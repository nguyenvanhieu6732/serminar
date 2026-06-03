/** @type {import('jest').Config} */
module.exports = {
  clearMocks: true,
  collectCoverageFrom: ["src/**/*.ts"],
  coverageDirectory: "coverage",
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleNameMapper: {
    "^@actions/github$": "<rootDir>/__tests__/mocks/actions-github.ts",
    "^(\\.{1,2}/.*)\\.js$": "$1"
  }
}
