import { configure as domConfig } from "@testing-library/dom";

const config = {
  getElementError: (message: string | null) => {
    // Strip the huge accessible roles tree that getByRole bakes into the message,
    // and the "Ignored nodes:" prettyDOM section from getByText.
    let short = message ?? "";
    for (const marker of [
      "\n\nHere are the accessible roles:",
      "\n\nIgnored nodes:",
    ]) {
      const idx = short.indexOf(marker);
      if (idx !== -1) short = short.slice(0, idx);
    }
    const error = new Error(short);
    error.name = "TestingLibraryElementError";
    error.stack = undefined;
    return error;
  },
};

domConfig(config);
