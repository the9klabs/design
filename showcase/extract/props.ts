import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

import type { TemplateChildNode, RootNode, ElementNode } from '@vue/compiler-core';
import ts from 'typescript';
import { parse as parseSfc } from 'vue/compiler-sfc';

import type { AliasEntry } from './aliases';
import { collectAliases, resolveTypeText, sharedTypeAliases } from './aliases';
import type { ExtractedComponent, ExtractedEmit, ExtractedProp } from './types';

/** Finds the first call to `name` anywhere in the script setup block. */
const findCall = (sourceFile: ts.SourceFile, name: string): ts.CallExpression | null => {
  let found: ts.CallExpression | null = null;
  const visit = (node: ts.Node) => {
    if (found) return;
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === name
    ) {
      found = node;
      return;
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(sourceFile, visit);
  return found;
};

/** Reads the `{ key: value }` second argument of `withDefaults`, as source text. */
const readDefaults = (sourceFile: ts.SourceFile): Map<string, string> => {
  const defaults = new Map<string, string>();
  const call = findCall(sourceFile, 'withDefaults');
  const argument = call?.arguments[1];
  if (!argument || !ts.isObjectLiteralExpression(argument)) return defaults;

  for (const property of argument.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    defaults.set(property.name.getText(sourceFile), property.initializer.getText(sourceFile));
  }
  return defaults;
};

const propertyName = (
  node: ts.PropertySignature | ts.PropertyAssignment,
  sourceFile: ts.SourceFile,
): string => (ts.isStringLiteral(node.name) ? node.name.text : node.name.getText(sourceFile));

/** Maps a runtime constructor identifier (`Boolean`, `String`, …) to its TS type name. */
const RUNTIME_TYPE_NAMES: Record<string, string> = {
  Boolean: 'boolean',
  String: 'string',
  Number: 'number',
};

const runtimeTypeName = (node: ts.Expression, sourceFile: ts.SourceFile): string => {
  const text = node.getText(sourceFile);
  return RUNTIME_TYPE_NAMES[text] ?? text;
};

/** Reads props declared with the runtime `defineProps({ … })` object form. */
const readRuntimeProps = (argument: ts.Expression, sourceFile: ts.SourceFile): ExtractedProp[] => {
  if (!ts.isObjectLiteralExpression(argument)) return [];

  const props: ExtractedProp[] = [];
  for (const property of argument.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const name = propertyName(property, sourceFile);
    const initializer = property.initializer;

    if (!ts.isObjectLiteralExpression(initializer)) {
      props.push({
        name,
        type: runtimeTypeName(initializer, sourceFile),
        required: false,
        default: null,
      });
      continue;
    }

    let type = 'unknown';
    let required = false;
    let defaultValue: string | null = null;
    for (const member of initializer.properties) {
      if (!ts.isPropertyAssignment(member)) continue;
      const key = propertyName(member, sourceFile);
      if (key === 'type') type = runtimeTypeName(member.initializer, sourceFile);
      if (key === 'required') required = member.initializer.kind === ts.SyntaxKind.TrueKeyword;
      if (key === 'default') defaultValue = member.initializer.getText(sourceFile);
    }
    props.push({ name, type, required, default: defaultValue });
  }
  return props;
};

const readEmits = (
  sourceFile: ts.SourceFile,
  aliases: Map<string, AliasEntry>,
  record: (names: string[]) => void,
): ExtractedEmit[] => {
  const emitsType = findCall(sourceFile, 'defineEmits')?.typeArguments?.[0];
  if (!emitsType || !ts.isTypeLiteralNode(emitsType)) return [];

  return emitsType.members.flatMap((member) => {
    if (!ts.isPropertySignature(member) || !member.type) return [];
    const resolved = resolveTypeText(member.type.getText(sourceFile), aliases);
    record(resolved.referenced);
    return [{ name: propertyName(member, sourceFile), payload: resolved.text }];
  });
};

const readSlots = (root: RootNode | undefined): string[] => {
  if (!root) return [];
  const names: string[] = [];

  const visit = (node: TemplateChildNode) => {
    if (node.type !== 1) return;
    const element = node as ElementNode;
    if (element.tag === 'slot') {
      const nameProp = element.props.find((prop) => prop.type === 6 && prop.name === 'name');
      const value = nameProp && nameProp.type === 6 ? nameProp.value?.content : undefined;
      names.push(value ?? 'default');
    }
    element.children.forEach(visit);
  };

  root.children.forEach(visit);
  // A slot rendered in both branches of a v-if would otherwise be listed twice.
  return [...new Set(names)];
};

export const extractComponent = (filePath: string): ExtractedComponent => {
  const source = readFileSync(filePath, 'utf8');
  const { descriptor } = parseSfc(source, { filename: filePath });
  const scriptSetup = descriptor.scriptSetup?.content ?? '';
  const sourceFile = ts.createSourceFile(filePath, scriptSetup, ts.ScriptTarget.ES2022, true);

  const aliases = new Map<string, AliasEntry>([
    ...sharedTypeAliases(),
    ...collectAliases(scriptSetup, filePath),
  ]);

  const referencedTypes: Record<string, string> = {};
  const record = (names: string[]) => {
    for (const name of names) {
      const entry = aliases.get(name);
      if (entry) referencedTypes[name] = entry.declaration;
    }
  };

  let props: ExtractedProp[] = [];
  const defaults = readDefaults(sourceFile);
  const definePropsCall = findCall(sourceFile, 'defineProps');
  const propsType = definePropsCall?.typeArguments?.[0];

  if (propsType && ts.isTypeLiteralNode(propsType)) {
    for (const member of propsType.members) {
      if (!ts.isPropertySignature(member) || !member.type) continue;
      const name = propertyName(member, sourceFile);
      const resolved = resolveTypeText(member.type.getText(sourceFile), aliases);
      record(resolved.referenced);
      props.push({
        name,
        type: resolved.text,
        required: member.questionToken === undefined,
        default: defaults.get(name) ?? null,
      });
    }
  } else if (definePropsCall && !propsType && definePropsCall.arguments[0]) {
    props = readRuntimeProps(definePropsCall.arguments[0], sourceFile);
  }

  return {
    name: basename(filePath, '.vue'),
    props,
    emits: readEmits(sourceFile, aliases, record),
    slots: readSlots(descriptor.template?.ast),
    referencedTypes,
  };
};
