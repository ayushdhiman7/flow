import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";

describe("smoke", () => {
  it("renders div", () => {
    const { container } = render(<div>hello</div>);
    expect(container.textContent).toContain("hello");
  });
  it("api client base", async () => {
    const { API_BASE } = await import("@/api/client");
    expect(API_BASE).toContain("/api");
  });
});
