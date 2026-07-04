import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Field, Input, Textarea } from "./field";

describe("<Input />", () => {
  it("forwards the ref and accepts standard input props", async () => {
    render(<Input aria-label="brand" defaultValue="ViralVibli" />);
    const el = screen.getByLabelText(/brand/i);
    expect(el).toHaveValue("ViralVibli");
    await userEvent.clear(el);
    await userEvent.type(el, "Hello");
    expect(el).toHaveValue("Hello");
  });
});

describe("<Textarea />", () => {
  it("renders a textarea with the requested rows", () => {
    render(<Textarea aria-label="brief" rows={5} />);
    const el = screen.getByLabelText(/brief/i);
    expect(el.tagName).toBe("TEXTAREA");
    expect(el).toHaveAttribute("rows", "5");
  });
});

describe("<Field />", () => {
  it("connects label to control via useId and exposes hint via aria-describedby", () => {
    render(
      <Field label="Brand name" hint="This shows up in AI output">
        {(a11y) => <Input placeholder="Your Brand" {...a11y} />}
      </Field>,
    );
    const control = screen.getByLabelText(/brand name/i);
    const describedBy = control.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const hint = document.getElementById(describedBy!);
    expect(hint).toHaveTextContent(/this shows up in ai output/i);
  });

  it("switches from hint to error message and sets aria-invalid", () => {
    render(
      <Field label="Email" error="Email is required">
        {(a11y) => <Input {...a11y} />}
      </Field>,
    );
    const control = screen.getByLabelText(/email/i);
    expect(control).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent(/email is required/i);
  });

  it("marks optional fields", () => {
    render(
      <Field label="Tagline" optional>
        {(a11y) => <Input {...a11y} />}
      </Field>,
    );
    expect(screen.getByText(/\(optional\)/i)).toBeInTheDocument();
  });
});
