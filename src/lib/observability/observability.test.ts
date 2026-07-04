import { describe, expect, it, vi } from "vitest";
import { noopProvider } from "./noop-provider";
import { consoleProvider } from "./console-provider";

describe("noopProvider", () => {
  it("swallows all calls without throwing", () => {
    expect(() => {
      noopProvider.logger.info("hi");
      noopProvider.logger.error("boom", { a: 1 });
      noopProvider.reporter.captureException(new Error("x"), { where: "test" });
      noopProvider.tracker.track("clicked", { button: "save" });
      noopProvider.tracker.identify("user_1", { plan: "pro" });
    }).not.toThrow();
  });
});

describe("consoleProvider", () => {
  it("writes structured log lines to the matching console method", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleProvider.logger.warn("slow-op", { duration: 900 });
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toContain("slow-op");
    expect(spy.mock.calls[0][0]).toContain('"duration":900');
    spy.mockRestore();
  });

  it("captureException includes error message and stack", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleProvider.reporter.captureException(new Error("kaboom"), {
      route: "/vault",
    });
    expect(spy.mock.calls[0][0]).toContain("kaboom");
    expect(spy.mock.calls[0][0]).toContain("/vault");
    spy.mockRestore();
  });
});
