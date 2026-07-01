import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Chip } from "./chip";

describe("<Chip />", () => {
  it("exposes aria-pressed for the active state", () => {
    const { rerender } = render(<Chip active={false}>Instagram</Chip>);
    expect(screen.getByRole("button", { name: /instagram/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    rerender(<Chip active>Instagram</Chip>);
    expect(screen.getByRole("button", { name: /instagram/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("dispatches onClick", async () => {
    const onClick = vi.fn();
    render(<Chip onClick={onClick}>Tap</Chip>);
    await userEvent.click(screen.getByRole("button", { name: /tap/i }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders as a native button with type='button'", () => {
    render(<Chip>Neutral</Chip>);
    const el = screen.getByRole("button", { name: /neutral/i });
    expect(el.tagName).toBe("BUTTON");
    expect(el).toHaveAttribute("type", "button");
  });

  it("supports disabled state", async () => {
    const onClick = vi.fn();
    render(
      <Chip disabled onClick={onClick}>
        Disabled
      </Chip>,
    );
    const el = screen.getByRole("button", { name: /disabled/i });
    expect(el).toBeDisabled();
    await userEvent.click(el);
    expect(onClick).not.toHaveBeenCalled();
  });
});
