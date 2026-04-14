// Load jest-expo preset to get its transform config (handles Flow syntax in RN)
const jestExpoPreset = require("jest-expo/jest-preset");

module.exports = {
  ...jestExpoPreset,
  testMatch: ["<rootDir>/mobile/**/*.test.tsx"],
  setupFiles: [
    ...jestExpoPreset.setupFiles,
    "./mobile/setup-globals.js",
    "./mobile/setup.ts",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/../../apps/native/$1",
    // Pre-compiled CJS versions of @orpc/* — avoids .mjs ESM gate
    "^@orpc/([^/]+)$": "<rootDir>/mobile/compiled-orpc/$1.js",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(react-native|@react-native|@react-native-community|expo|expo-modules-core|@expo|react-navigation|@react-navigation|@template|drizzle-orm|zod)/)",
  ],
  // First match wins — PGlite's .js files use ts-jest ESM to preserve
  // import.meta.url (required for WASM/VFS resolution).
  // Everything else uses babel-jest via jest-expo preset (handles Flow syntax).
  transform: {
    "node_modules/@electric-sql/.+\\.js$": ["ts-jest", { useESM: true }],
    ...jestExpoPreset.transform,
  },
};
