import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";

describe("<Button />", () => {
  it("renders as a native button when no href is provided", () => {
    render(<Button>Save</Button>);
    const el = screen.getByRole("button", { name: /save/i });
    expect(el.tagName).toBe("BUTTON");
    expect(el).toHaveAttribute("type", "button");
  });

  it("renders as a Link when href is provided", () => {
    render(<Button href="/dashboard">Go</Button>);
    const el = screen.getByRole("link", { name: /go/i });
    expect(el.tagName).toBe("A");
    expect(el).toHaveAttribute("href", "/dashboard");
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    await userEvent.click(screen.getByRole("button", { name: /click me/i }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("sets aria-busy and disables when loading", () => {
    render(<Button loading>Saving</Button>);
    const el = screen.getByRole("button", { name: /saving/i });
    expect(el).toHaveAttribute("aria-busy", "true");
    expect(el).toBeDisabled();
  });

  it("respects the disabled prop", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Nope
      </Button>,
    );
    const el = screen.getByRole("button", { name: /nope/i });
    expect(el).toBeDisabled();
    await userEvent.click(el);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies size and variant classes", () => {
    render(
      <Button variant="ghost" size="sm">
        Ghost
      </Button>,
    );
    const el = screen.getByRole("button", { name: /ghost/i });
    expect(el.className).toContain("border");
    expect(el.className).toContain("h-9");
  });
});
