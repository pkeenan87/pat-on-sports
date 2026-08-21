import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Header from "./Header";

describe("Header", () => {
  const assign = vi.fn();

  beforeEach(() => {
    assign.mockReset();
    vi.stubGlobal("location", {
      search: "",
      pathname: "/",
      assign,
    });
  });

  it("renders the site title, search, and tags on listing pages", () => {
    render(<Header tags={["NFL", "Preview"]} pathname="/" />);

    expect(screen.getByText("Pat on Sports")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search posts…")).toBeInTheDocument();
    expect(screen.getByText("Filter:")).toBeInTheDocument();
    expect(screen.getByText("#NFL")).toBeInTheDocument();
    expect(screen.getByText("#Preview")).toBeInTheDocument();
  });

  it("hides the tag bar on post pages", () => {
    render(<Header tags={["NFL"]} pathname="/blog/week-01" />);
    expect(screen.queryByText("Filter:")).not.toBeInTheDocument();
  });

  it("navigates to /blog with the search query", () => {
    render(<Header tags={["NFL"]} pathname="/" />);

    fireEvent.change(screen.getByPlaceholderText("Search posts…"), {
      target: { value: "Maye" },
    });
    fireEvent.submit(
      screen.getByPlaceholderText("Search posts…").closest("form")!
    );

    expect(assign).toHaveBeenCalledWith("/blog?q=Maye");
  });

  it("navigates to /blog when a tag is selected", () => {
    render(<Header tags={["NFL"]} pathname="/" />);
    fireEvent.click(screen.getByText("#NFL"));
    expect(assign).toHaveBeenCalledWith("/blog?tag=NFL");
  });

  it("applies query params after mount so SSR markup stays empty", () => {
    vi.stubGlobal("location", {
      search: "?q=Maye&tag=NFL",
      pathname: "/blog",
      assign,
    });

    render(<Header tags={["NFL", "Preview"]} pathname="/blog" />);

    expect(screen.getByPlaceholderText("Search posts…")).toHaveValue("Maye");
    expect(screen.getByText("#NFL")).toHaveClass("bg-slate-900");
    expect(screen.getByText("All")).not.toHaveClass("bg-slate-900");
  });
});
