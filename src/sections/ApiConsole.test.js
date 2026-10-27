import { act, fireEvent, render, screen } from "@testing-library/react";
import { ApiConsole } from "./ApiConsole";
import { callEndpoint } from "../lib/api";

jest.mock("../lib/api", () => ({ ...jest.requireActual("../lib/api"), callEndpoint: jest.fn() }));
jest.mock("../context/ExperienceContext", () => {
  const unlock = jest.fn();
  return { useExperience: () => ({ unlock }) };
});

const OriginalObserver = window.IntersectionObserver;
let intersect;
beforeEach(() => {
  jest.useFakeTimers();
  callEndpoint.mockReset();
  window.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; }
    observe(element) { if (element.id === "api") intersect = this.callback; }
    unobserve() {}
    disconnect() {}
  };
});
afterEach(() => { jest.useRealTimers(); window.IntersectionObserver = OriginalObserver; });

test("switching endpoints discards an in-flight response and allows a new request", async () => {
  let finishHealth;
  callEndpoint.mockImplementationOnce(() => new Promise((resolve) => { finishHealth = resolve; }));
  callEndpoint.mockResolvedValueOnce({ status: 200, latency: 10, headers: {}, body: { name: "Current profile response" } });
  render(<ApiConsole />);
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  fireEvent.click(screen.getByRole("button", { name: /GET \/api\/v1\/profile/ }));
  expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Send" })); });
  await act(async () => { finishHealth({ status: 200, latency: 50, headers: {}, body: { stale: "Old health response" } }); });
  expect(screen.queryByText(/Old health response/)).not.toBeInTheDocument();
  expect(screen.getByText(/Current profile response/)).toBeInTheDocument();
});

test("an automatic health check does not override a visitor's endpoint choice", () => {
  render(<ApiConsole />);
  act(() => intersect([{ isIntersecting: true }]));
  fireEvent.click(screen.getByRole("button", { name: /GET \/api\/v1\/profile/ }));
  act(() => jest.advanceTimersByTime(400));
  expect(callEndpoint).not.toHaveBeenCalled();
});

test("leaving the page cancels its scheduled automatic health check", () => {
  const { unmount } = render(<ApiConsole />);
  act(() => intersect([{ isIntersecting: true }]));
  unmount();
  act(() => jest.advanceTimersByTime(400));
  expect(callEndpoint).not.toHaveBeenCalled();
});
