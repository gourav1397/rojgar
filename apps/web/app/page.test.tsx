import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("HomePage", () => {
  it("renders Rogjar marketplace headline", () => {
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).toContain("Find jobs, hire talent");
  });
});
