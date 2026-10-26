import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SiteChat from "./SiteChat";

const originalFetch = global.fetch;
test("Enter sends, while Shift+Enter and composition do not", async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error("offline"));
  render(<SiteChat onClose={() => {}} />);
  const input = screen.getByLabelText("Your question");
  fireEvent.change(input, { target: { value: "Explain Two Sum" } });
  fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
  expect(screen.queryByRole("link", { name: "Two Sum" })).not.toBeInTheDocument();
  fireEvent.keyDown(input, { key: "Enter", isComposing: true });
  expect(screen.queryByRole("link", { name: "Two Sum" })).not.toBeInTheDocument();
  fireEvent.keyDown(input, { key: "Enter" });
  expect(await screen.findByRole("link", { name: "Two Sum" })).toBeInTheDocument();
  expect(input).toHaveValue("");
});
test("topic shortcuts prepare a question and the X button closes", () => {
  global.fetch = jest.fn().mockRejectedValue(new Error("offline"));
  const close = jest.fn();
  render(<SiteChat onClose={close} />);
  fireEvent.click(screen.getByRole("button", { name: /01 Projects/ }));
  expect(screen.getByLabelText("Your question")).toHaveValue("What projects has Raja built?");
  expect(screen.getByLabelText("Your question")).toHaveFocus();
  fireEvent.click(screen.getByRole("button", { name: "Close site chat" }));
  expect(close).toHaveBeenCalledTimes(1);
});
afterEach(() => { global.fetch = originalFetch; });
test("site search works when the endpoint is unavailable, and Escape closes chat", async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error("offline"));
  const close = jest.fn();
  render(<SiteChat onClose={close} />);
  fireEvent.change(screen.getByLabelText("Your question"), { target: { value: "Explain Two Sum" } });
  fireEvent.click(screen.getByRole("button", { name: "Send question" }));
  expect(await screen.findByRole("link", { name: "Two Sum" })).toHaveAttribute("href", "/dsa/two-sum");
  expect(global.fetch).toHaveBeenCalledTimes(1); // Only the optional config lookup.
  fireEvent.keyDown(screen.getByLabelText("Your question"), { key: "Escape" });
  expect(close).toHaveBeenCalled();
});
test("AI is opt-in and failure retains local results", async () => {
  global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ aiEnabled: true }) }).mockRejectedValue(new Error("quota"));
  render(<SiteChat onClose={() => {}} />);
  const consent = await screen.findByRole("checkbox");
  expect(consent).not.toBeChecked();
  fireEvent.click(consent);
  fireEvent.change(screen.getByLabelText("Your question"), { target: { value: "Explain Two Sum" } });
  fireEvent.click(screen.getByRole("button", { name: "Send question" }));
  await screen.findByText("AI could not reply. Showing site search results instead.");
  expect(screen.getByRole("link", { name: "Two Sum" })).toBeInTheDocument();
  expect(JSON.parse(global.fetch.mock.calls[1][1].body)).toEqual({ question: "Explain Two Sum", useAI: true });
});
test("keyboard focus stays inside the dialog", async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error("offline"));
  render(<SiteChat onClose={() => {}} />);
  const close = screen.getByRole("button", { name: "Close site chat" });
  close.focus();
  fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
  await waitFor(() => expect(screen.getByLabelText("Your question")).toHaveFocus());
});
