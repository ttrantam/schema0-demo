// PGlite's Emscripten runtime accesses window.location.pathname and
// window.encodeURIComponent when ENVIRONMENT_IS_WEB is true.
if (typeof globalThis.window !== "undefined") {
  if (!globalThis.window.location) {
    const pgliteDir = require
      .resolve("@electric-sql/pglite")
      .replace(/index\.cjs$/, "");
    globalThis.window.location = { pathname: pgliteDir + "pglite.js" };
  }
  if (!globalThis.window.encodeURIComponent) {
    globalThis.window.encodeURIComponent = encodeURIComponent;
  }
}

// Jest's --experimental-vm-modules creates isolated VM contexts where
// objects from the main Node context fail `instanceof` checks inside the VM.
// PGlite's Emscripten VFS unpacker checks `instanceof ArrayBuffer`.
// Workaround: override Symbol.hasInstance to accept cross-context instances.
Object.defineProperty(ArrayBuffer, Symbol.hasInstance, {
  value(instance) {
    return (
      instance != null &&
      typeof instance === "object" &&
      typeof instance.byteLength === "number" &&
      typeof instance.slice === "function" &&
      instance.constructor?.name === "ArrayBuffer"
    );
  },
});
