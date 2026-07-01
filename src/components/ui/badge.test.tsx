import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./badge";

describe("<Badge />", () => {
  it("renders label content", () => {
    render(<Badge>Live</Badge>);
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("applies tone classes", () => {
    const { rerender, container } = render(<Badge tone="danger">Err</Badge>);
    expect(container.firstChild).toHaveClass("text-red-400");

    rerender(<Badge tone="success">OK</Badge>);
    expect(container.firstChild).toHaveClass("text-emerald-300");
  });
});
