import { build, emptyDir } from "https://deno.land/x/dnt@0.38.0/mod.ts";

await emptyDir("./npm");

await build({
  entryPoints: ["./mod.ts"],
  compilerOptions: {
    target: "ES2017",
    sourceMap: false,
  },
  outDir: "./npm",
  shims: {},
  package: {
    name: "darker-engine",
    description: "ecs lightweight library",
    version: Deno.args[0],
    author: "darkaqua",
    license: "MIT",
    repository: "https://github.com/darkaqua/darker-engine",
    keywords: [
      "ecs",
      "entity-component-system",
      "entity",
      "component",
      "system",
      "lightweight",
      "library",
      "functional",
      "node",
      "typescript",
    ],
  },
  test: false,
  postBuild() {
    Deno.copyFileSync("LICENSE", "npm/LICENSE");
    Deno.copyFileSync("README.md", "npm/README.md");
  },
});
