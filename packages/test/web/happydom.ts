import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { mock } from "bun:test";

GlobalRegistrator.register();

// @template/auth runs env validation and creates a WorkOS client at module load.
// Mock it in the preload so it's intercepted before any static imports load it.
void mock.module("@template/auth", () => ({
  auth: {},
  env: {},
}));
