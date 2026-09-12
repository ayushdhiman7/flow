import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ThemeProvider } from "@/app/ThemeContext";

describe("smoke", () => {
  it("renders ThemeProvider", () => {
    const { container } = render(<ThemeProvider><div>hello</div></ThemeProvider>);
    expect(container.textContent).toContain("hello");
  });
  it("api client base", async () => {
    const { API_BASE } = await import("@/api/client");
    expect(API_BASE).toContain("/api");
  });
});
