module.exports = {
  preset: "jest-preset-angular",
  globalSetup: "jest-preset-angular/global-setup",
  // Initialises zone.js/testing and the Angular TestBed; without it every
  // suite dies on "zone-testing.js is needed for the fakeAsync() test helper".
  setupFilesAfterEnv: ["jest-preset-angular/setup-jest"],
  // tsconfig resolves "src/..." imports through baseUrl; jest needs telling too.
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
  },
};
