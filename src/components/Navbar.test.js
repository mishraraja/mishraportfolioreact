import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Navbar } from "./Navbar";

function renderMenu() {
  render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Navbar /></MemoryRouter>);
  const toggle = screen.getByRole("button", { name: "Open menu" });
  fireEvent.click(toggle);
  return { toggle, menu: screen.getByRole("dialog", { name: "Mobile navigation" }) };
}

test("mobile navigation escapes the header, cycles focus and restores scrolling on Escape", () => {
  const { toggle, menu } = renderMenu();
  expect(menu.parentElement).toBe(document.body);
  expect(document.body.style.overflow).toBe("hidden");
  const close = within(menu).getByRole("button", { name: "Close menu" });
  const last = within(menu).getByRole("link", { name: /Java Arcade/ });
  expect(close).toHaveFocus();
  fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
  expect(last).toHaveFocus();
  fireEvent.keyDown(last, { key: "Tab" });
  expect(close).toHaveFocus();
  fireEvent.keyDown(close, { key: "Escape" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(document.body.style.overflow).toBe("");
  expect(toggle).toHaveFocus();
});

test("choosing an arcade closes the menu and releases the scroll lock", () => {
  const { menu } = renderMenu();
  fireEvent.click(within(menu).getByRole("link", { name: /Java Arcade/ }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(document.body.style.overflow).toBe("");
});

test("resizing to desktop closes the mobile menu", () => {
  const originalWidth = window.innerWidth;
  try {
    window.innerWidth = 375;
    renderMenu();
    fireEvent.resize(window);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    window.innerWidth = 1024;
    fireEvent.resize(window);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  } finally {
    window.innerWidth = originalWidth;
  }
});
