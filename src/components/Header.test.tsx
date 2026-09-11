import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Header from "./Header";

describe("Header", () => {
  const assign = vi.fn();
  const replaceState = vi.fn();

  beforeEach(() => {
    assign.mockReset();
    replaceState.mockReset();
    vi.stubGlobal("location", {
      search: "",
      pathname: "/",
      assign,
    });
    vi.stubGlobal("history", {
      replaceState,
    });
  });

  it("renders the wordmark, search, nav, and category chips on listing pages", () => {
    render(
      <Header categories={["Pros & Cons", "Preview", "UCLA"]} pathname="/" />
    );

    expect(screen.getByText("Pat on Sports")).toBeInTheDocument();
    expect(screen.getByLabelText("Search posts")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Filter by category" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pros & Cons" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preview" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "UCLA" })).toBeInTheDocument();
  });

  it("hides category chips on post pages", () => {
    render(<Header categories={["Pros & Cons"]} pathname="/blog/week-01" />);
    expect(
      screen.queryByRole("group", { name: "Filter by category" })
    ).not.toBeInTheDocument();
  });

  it("navigates to /blog when searching from the homepage", () => {
    render(<Header categories={["Pros & Cons"]} pathname="/" />);

    fireEvent.change(screen.getByLabelText("Search posts"), {
      target: { value: "Maye" },
    });
    fireEvent.submit(screen.getByLabelText("Search posts").closest("form")!);

    expect(assign).toHaveBeenCalledWith("/blog?q=Maye");
  });

  it("navigates to a category URL when a category is selected off the archive", () => {
    render(<Header categories={["Pros & Cons"]} pathname="/" />);
    fireEvent.click(screen.getByRole("button", { name: "Pros & Cons" }));
    expect(assign).toHaveBeenCalledWith("/category/pros-cons");
  });

  it("filters in place on the archive when searching with a category", () => {
    vi.stubGlobal("location", {
      search: "",
      pathname: "/blog",
      assign,
    });

    render(<Header categories={["Pros & Cons", "Preview"]} pathname="/blog" />);
    fireEvent.change(screen.getByLabelText("Search posts"), {
      target: { value: "Maye" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));

    expect(assign).not.toHaveBeenCalled();
    expect(replaceState).toHaveBeenCalledWith(
      {},
      "",
      "/blog?q=Maye&category=Preview"
    );
    expect(screen.getByRole("button", { name: "Preview" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("navigates to a category page from the archive when there is no query", () => {
    vi.stubGlobal("location", {
      search: "",
      pathname: "/blog",
      assign,
    });

    render(<Header categories={["Pros & Cons", "Preview"]} pathname="/blog" />);
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    expect(assign).toHaveBeenCalledWith("/category/preview");
  });

  it("applies query params after mount so SSR markup stays empty", () => {
    vi.stubGlobal("location", {
      search: "?q=Maye&category=Pros+%26+Cons",
      pathname: "/blog",
      assign,
    });
    vi.stubGlobal("history", { replaceState });

    render(<Header categories={["Pros & Cons", "Preview"]} pathname="/blog" />);

    expect(screen.getByLabelText("Search posts")).toHaveValue("Maye");
    expect(screen.getByRole("button", { name: "Pros & Cons" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("marks the active category from a category route", () => {
    vi.stubGlobal("location", {
      search: "",
      pathname: "/category/ucla",
      assign,
    });

    render(
      <Header categories={["Pros & Cons", "UCLA"]} pathname="/category/ucla" />
    );
    expect(screen.getByRole("button", { name: "UCLA" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });
});
