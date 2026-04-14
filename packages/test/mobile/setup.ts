// Mock @template/auth — runs env validation at module load
jest.mock("@template/auth", () => ({ auth: {}, env: {} }));

// Mock @template/db — provide PGlite db instance
// Access db lazily since it's initialized async in initializeTestDatabase
jest.mock("@template/db", () => {
  const dbModule = require("../db");
  return { createDb: () => dbModule.db };
});

// Mock expo-router
jest.mock("expo-router", () => ({
  Stack: {
    Screen: ({ children }: { children?: React.ReactNode }) => children ?? null,
  },
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  Link: ({ children }: { children?: React.ReactNode }) => children,
}));

// Mock @schema0/auth-mobile
jest.mock("@schema0/auth-mobile", () => ({
  useSchema0Auth: () => ({
    user: { id: "user_mobile_123", email: "mobile@test.com" },
    isLoading: false,
    role: "member",
    signIn: jest.fn(),
    signOut: jest.fn(),
  }),
  Schema0AuthProvider: ({ children }: { children?: React.ReactNode }) =>
    children,
}));

// Mock expo modules that aren't installed in packages/test
jest.mock(
  "expo-haptics",
  () => ({
    impactAsync: jest.fn(),
    ImpactFeedbackStyle: { Medium: "medium" },
  }),
  { virtual: true },
);

jest.mock(
  "expo-secure-store",
  () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
  }),
  { virtual: true },
);

jest.mock(
  "expo-auth-session",
  () => ({
    makeRedirectUri: jest.fn(() => "schema0://redirect"),
  }),
  { virtual: true },
);

// Mock react-native-safe-area-context
jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(View, props, children),
    SafeAreaProvider: ({ children }: { children?: React.ReactNode }) =>
      children,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// Mock lucide-react-native icons — Proxy auto-creates mock icons for any name
jest.mock("lucide-react-native", () => {
  const React = require("react");
  const { View } = require("react-native");
  const createMockIcon = (name: string) => {
    const Icon = (props: Record<string, unknown>) =>
      React.createElement(View, { ...props, testID: `icon-${name}` });
    Icon.displayName = name;
    return Icon;
  };
  return new Proxy(
    {},
    { get: (_target, name: string) => createMockIcon(name) },
  );
});

// Mock crypto.randomUUID
if (typeof globalThis.crypto === "undefined") {
  Object.defineProperty(globalThis, "crypto", {
    value: {
      randomUUID: () =>
        "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }),
    },
  });
}
