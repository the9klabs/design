// The relative specifiers a built ES module imports or re-exports, statically or for its side
// effect (`import "./I9kButton.css";`), in the order they appear. Shared by the build's scripts,
// which read Rolldown's output: imports at the top, specifiers without `;` or quotes.

const IMPORT = /(?:^|[;\n}])\s*(?:import|export)\s*(?:[^'";]*?\sfrom\s*)?['"](\.[^'"]+)['"]/g;

export function relativeImports(code) {
  return [...code.matchAll(IMPORT)].map((match) => match[1]);
}
