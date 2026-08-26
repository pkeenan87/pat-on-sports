import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AudioPlayer from "./AudioPlayer";

describe("AudioPlayer", () => {
  let paused = true;

  beforeEach(() => {
    paused = true;

    Object.defineProperty(HTMLMediaElement.prototype, "paused", {
      configurable: true,
      get() {
        return paused;
      },
    });

    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(
      function playMock(this: HTMLMediaElement) {
        paused = false;
        this.dispatchEvent(new Event("play"));
        return Promise.resolve();
      }
    );

    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(
      function pauseMock(this: HTMLMediaElement) {
        paused = true;
        this.dispatchEvent(new Event("pause"));
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the listen control", () => {
    render(<AudioPlayer src="/audio/test.m4a" title="Week 21 recap" />);

    expect(
      screen.getByRole("button", { name: "Listen to this article" })
    ).toBeInTheDocument();
    expect(screen.getByText("Listen to this article")).toBeInTheDocument();
    expect(screen.getByLabelText("Audio recording of Week 21 recap")).toHaveAttribute(
      "preload",
      "none"
    );
  });

  it("plays on click and pauses on the second click", () => {
    render(<AudioPlayer src="/audio/test.m4a" title="Week 21 recap" />);

    const button = screen.getByRole("button", {
      name: "Listen to this article",
    });

    fireEvent.click(button);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Pause" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Listen to this article" })
    ).toHaveAttribute("aria-pressed", "false");
  });
});
