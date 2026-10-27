module.exports = {
  roots: ["<rootDir>/src"],
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],
  transform: { "^.+\\.m?jsx?$": "babel-jest" },
  moduleNameMapper: {
    "\\.css$": "<rootDir>/scripts/test-style.cjs",
    "\\.(svg|png|jpe?g|gif|webp|woff2?)$": "<rootDir>/scripts/test-asset.cjs",
  },
  clearMocks: true,
};
