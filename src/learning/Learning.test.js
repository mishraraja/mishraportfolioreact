import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Learning from "./Learning";
import { createBackup, KEYS } from "./storage";
import { hasOfflineCopy } from "./offline";

jest.mock("./offline", () => ({ hasOfflineCopy: jest.fn(async () => false), prepareOffline: jest.fn(), removeOffline: jest.fn() }));
beforeEach(() => { localStorage.clear(); hasOfflineCopy.mockResolvedValue(false); });
test("all tools are available without configured authentication", async () => {
  render(<MemoryRouter><Learning /></MemoryRouter>);
  expect(screen.getByText(/Google sign-in is not available yet/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Download progress backup" })).toBeEnabled();
  await waitFor(() => expect(screen.getByRole("heading", { name: "What to review" })).toBeVisible());
});
test("file selection previews changes; cancel keeps existing progress", async () => {
  const backup = createBackup();
  localStorage.setItem(KEYS.reviews, "{}");
  render(<MemoryRouter><Learning /></MemoryRouter>);
  fireEvent.change(screen.getByLabelText("Choose backup file"), { target: { files: [{ size: 100, text: async () => JSON.stringify(backup) }] } });
  await screen.findByRole("heading", { name: "Review this backup" });
  expect(localStorage.getItem(KEYS.reviews)).toBe("{}");
  fireEvent.click(screen.getByRole("button", { name: "Cancel import" }));
  expect(screen.queryByRole("heading", { name: "Review this backup" })).not.toBeInTheDocument();
  expect(localStorage.getItem(KEYS.reviews)).toBe("{}");
});
