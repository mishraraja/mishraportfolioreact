import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the hero headline", () => {
  render(<App />);
  expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
});

test("renders primary navigation", () => {
  render(<App />);
  expect(screen.getByRole("navigation", { name: /primary/i })).toBeInTheDocument();
});
