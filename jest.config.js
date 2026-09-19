module.exports = {
  preset: "jest-preset-angular",
  globalSetup: "jest-preset-angular/global-setup",
  // Initialises zone.js/testing and the Angular TestBed; without it every
  // suite dies on "zone-testing.js is needed for the fakeAsync() test helper".
  setupFilesAfterEnv: ["jest-preset-angular/setup-jest"],
  // The e2e specs belong to Playwright, and src/test.ts is Karma's old
  // bootstrap, not a suite.
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/e2e/", "<rootDir>/src/test.ts"],
  // tsconfig resolves "src/..." imports through baseUrl; jest needs telling too.
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
  },
};
