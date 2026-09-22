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

/** Finds every call to `name` anywhere in the script setup block, in source order. */
const findCalls = (sourceFile: ts.SourceFile, name: string): ts.CallExpression[] => {
  const found: ts.CallExpression[] = [];
  const visit = (node: ts.Node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === name
    ) {
      found.push(node);
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

/**
 * Reads each `defineModel` call as the prop and the `update:<name>` emit it declares:
 * `defineModel<T>()` binds `modelValue`, `defineModel<T>('open')` binds `open`, and the
 * options object may be either argument.
 */
const readModels = (
  sourceFile: ts.SourceFile,
  aliases: Map<string, AliasEntry>,
  record: (names: string[]) => void,
): { props: ExtractedProp[]; emits: ExtractedEmit[] } => {
  const props: ExtractedProp[] = [];
  const emits: ExtractedEmit[] = [];

  for (const call of findCalls(sourceFile, 'defineModel')) {
    const [first, second] = call.arguments;
    const name = first && ts.isStringLiteral(first) ? first.text : 'modelValue';
    const options = [first, second].find(
      (argument): argument is ts.ObjectLiteralExpression =>
        argument !== undefined && ts.isObjectLiteralExpression(argument),
    );

    let required = false;
    let defaultValue: string | null = null;
    for (const member of options?.properties ?? []) {
      if (!ts.isPropertyAssignment(member)) continue;
      const key = propertyName(member, sourceFile);
      if (key === 'required') required = member.initializer.kind === ts.SyntaxKind.TrueKeyword;
      if (key === 'default') defaultValue = member.initializer.getText(sourceFile);
    }

    const typeArgument = call.typeArguments?.[0];
    const resolved = typeArgument
      ? resolveTypeText(typeArgument.getText(sourceFile), aliases)
      : { text: 'unknown', referenced: [] };
    record(resolved.referenced);
    props.push({ name, type: resolved.text, required, default: defaultValue });
    emits.push({ name: `update:${name}`, payload: `[value: ${resolved.text}]` });
  }
  return { props, emits };
};

/**
 * A static `name`, a bound `:name` in Vue's dynamic slot syntax (`[expression]`), or
 * `default` for an unnamed slot.
 */
const slotName = (element: ElementNode): string => {
  for (const prop of element.props) {
    if (prop.type === 6 && prop.name === 'name') return prop.value?.content ?? 'default';
    if (
      prop.type === 7 &&
      prop.name === 'bind' &&
      prop.arg?.type === 4 &&
      prop.arg.content === 'name' &&
      prop.exp?.type === 4
    ) {
      return `[${prop.exp.content}]`;
    }
  }
  return 'default';
};

const readSlots = (root: RootNode | undefined): string[] => {
  if (!root) return [];
  const names: string[] = [];

  const visit = (node: TemplateChildNode) => {
    if (node.type !== 1) return;
    const element = node as ElementNode;
    if (element.tag === 'slot') names.push(slotName(element));
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

  // A model is the component's primary binding, so it leads both tables, the way
  // `modelValue` leads I9kInput's hand-declared props.
  const models = readModels(sourceFile, aliases, record);

  return {
    name: basename(filePath, '.vue'),
    props: [...models.props, ...props],
    emits: [...models.emits, ...readEmits(sourceFile, aliases, record)],
    slots: readSlots(descriptor.template?.ast),
    referencedTypes,
  };
};
