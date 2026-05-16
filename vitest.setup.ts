import "@testing-library/jest-dom";

const originalError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  if (typeof args[0] === "string" && args[0].includes("not wrapped in act")) return;
  originalError(...args);
};
