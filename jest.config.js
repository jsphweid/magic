module.exports = {
  rootDir: `packages/${process.env.PACKAGE}`,
  testMatch: ["<rootDir>/src/**/*.spec.ts"],
  transform: { "^.+\\.(ts|tsx)$": "ts-jest" },
  moduleNameMapper: { "~(.*)$": "<rootDir>/../$1/src" },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"]
};
