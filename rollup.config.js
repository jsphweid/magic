const plugins = [
  sourceMaps(),

  typescript({
    tsconfigOverride: {
      include: [".tst/declarations.d.ts"],
      compilerOptions: { resolveJsonModule: false }
    }
  }),

  resolve({ preferBuiltins: true }),

  commonjs(),
  json()
];
