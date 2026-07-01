import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Reset DOM between tests
afterEach(() => {
  cleanup();
});

// Stub matchMedia for prefers-reduced-motion queries in Motion
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// Mock scrollTo which jsdom lacks
if (typeof window !== "undefined") {
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
}
