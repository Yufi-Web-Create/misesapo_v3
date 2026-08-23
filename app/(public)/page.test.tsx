import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("HomePage", () => {
  it("renders the brand headline", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: "まずは、形に。" })).toBeInTheDocument();
  });

  it("links to the free consultation", () => {
    render(<HomePage />);
    const links = screen.getAllByRole("link", { name: /無料/ });
    expect(links.length).toBeGreaterThan(0);
  });
});
