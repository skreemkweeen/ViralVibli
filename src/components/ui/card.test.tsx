import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "./card";

describe("<Card />", () => {
  it("renders children inside a rounded surface", () => {
    render(<Card>Content</Card>);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("applies padding scale variants", () => {
    const { rerender, container } = render(<Card padding="none">x</Card>);
    expect(container.firstChild).not.toHaveClass("p-5");

    rerender(<Card padding="lg">x</Card>);
    expect(container.firstChild).toHaveClass("p-6");
  });

  it("renders as different semantic elements via the `as` prop", () => {
    render(
      <Card as="section" aria-label="brand">
        x
      </Card>,
    );
    const el = screen.getByLabelText(/brand/i);
    expect(el.tagName).toBe("SECTION");
  });
});
