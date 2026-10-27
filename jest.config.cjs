module.exports = {
  roots: ["<rootDir>/src"],
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],
  transform: { "^.+\\.m?jsx?$": "babel-jest" },
  // These calendar packages ship ESM only; compile them for Jest's CJS runner.
  transformIgnorePatterns: ["node_modules/(?!(react-github-calendar|react-activity-calendar)/)"],
  moduleNameMapper: {
    "\\.css$": "<rootDir>/scripts/test-style.cjs",
    "\\.(svg|png|jpe?g|gif|webp|woff2?)$": "<rootDir>/scripts/test-asset.cjs",
  },
  clearMocks: true,
};
