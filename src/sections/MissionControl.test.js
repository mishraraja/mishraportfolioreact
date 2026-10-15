import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MissionPlayground from "./MissionPlayground";
import { MissionControl, MissionPanel } from "./MissionControl";
import { ProjectCard } from "./ProjectCard";
import { projects } from "../data/projects";

function playground() {
  return render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><MissionPlayground /></MemoryRouter>);
}

test("mission choices preserve direct links to work, challenge and about", () => {
  render(<MissionPanel />);
  expect(screen.getByRole("link", { name: /Explore projects/ })).toHaveAttribute("href", "#projects");
  expect(screen.getByRole("link", { name: /Try a coding question/ })).toHaveAttribute("href", "#mission-lab");
  expect(screen.getByRole("link", { name: /About me/ })).toHaveAttribute("href", "#about");
});

test("request travels through all stages and can be replayed", () => {
  jest.useFakeTimers();
  try {
    playground();
    fireEvent.click(screen.getByRole("button", { name: /Send a request/ }));
    expect(screen.getByText(/The API validates/)).toBeInTheDocument();
    act(() => jest.advanceTimersByTime(950));
    expect(screen.getByText(/The service applies/)).toBeInTheDocument();
    act(() => jest.advanceTimersByTime(950));
    expect(screen.getByText(/The database returns/)).toBeInTheDocument();
    act(() => jest.advanceTimersByTime(950));
    expect(screen.getByText(/200 OK/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Send another request/ }));
    expect(screen.getByText(/The API validates/)).toBeInTheDocument();
  } finally { jest.useRealTimers(); }
});

test("reduced motion keeps the journey manual", () => {
  const original = window.matchMedia;
  window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
  jest.useFakeTimers();
  try {
    playground();
    fireEvent.click(screen.getByRole("button", { name: /Send a request/ }));
    act(() => jest.advanceTimersByTime(5000));
    expect(screen.getByText(/The API validates/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Next stage/ }));
    expect(screen.getByText(/The service applies/)).toBeInTheDocument();
  } finally { window.matchMedia = original; jest.useRealTimers(); }
});

test("challenge explains an answer, locks choices, and resets for the next question", () => {
  playground();
  // Daily rotation can start on any of the three questions.
  for (let i = 0; i < 3 && !screen.queryByText("Same words. Same object?"); i += 1) {
    fireEvent.click(screen.getByRole("button", { name: /Next challenge/ }));
  }
  const choices = screen.getByRole("group", { name: "Challenge answers" });
  fireEvent.click(within(choices).getByRole("button", { name: "true" }));
  expect(screen.getByText(/Correct — here's why/)).toBeInTheDocument();
  expect(screen.getByText(/equals\(\) compares the characters/)).toBeInTheDocument();
  within(choices).getAllByRole("button").forEach((button) => expect(button).toBeDisabled());
  expect(screen.getByRole("link", { name: /Explore the String Pool lab/ })).toHaveAttribute("href", "/java/lab/string-pool");
  fireEvent.click(screen.getByRole("button", { name: /Next challenge/ }));
  expect(screen.queryByText(/Correct — here's why/)).not.toBeInTheDocument();
  within(choices).getAllByRole("button").forEach((button) => expect(button).toBeEnabled());
});

test("lab has an explicit load fallback when intersection has not fired", async () => {
  render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><MissionControl /></MemoryRouter>);
  fireEvent.click(screen.getByRole("button", { name: /Open the interactive lab/ }));
  expect(await screen.findByRole("heading", { name: "How a backend handles a request" })).toBeInTheDocument();
});

test("project story keeps the original destination and places disclosure outside the link", () => {
  const { container } = render(<ProjectCard project={projects[0]} index={0} />);
  const details = container.querySelector("details");
  expect(details.closest("a")).toBeNull();
  expect(container.querySelector("a.project-card")).toHaveAttribute("href", projects[0].liveUrl);
  expect(within(details).getByText(projects[0].problem)).toBeInTheDocument();
  expect(within(details).getByText(projects[0].description)).toBeInTheDocument();
});
