import json from "rollup-plugin-json";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import sourceMaps from "rollup-plugin-sourcemaps";

const plugins = [
  sourceMaps(),

  typescript({
    tsconfigOverride: {
      include: [".tst/declarations.d.ts"],
      compilerOptions: { resolveJsonModule: false }
    }
  }),

  resolve({
    preferBuiltins: true
  }),

  commonjs(),
  json()
];

export default {
  plugins,
  input: "packages/twilio/src/index.ts",
  output: {
    file: "packages/twilio/dist/index.js",
    format: "cjs",
    sourcemap: true
  },

  onwarn: (warning, warn) =>
    warning.code !== "THIS_IS_UNDEFINED" && warn(warning)
};
