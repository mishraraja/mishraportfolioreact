import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import App from "./App";
import { ENDPOINTS, callEndpoint, statusClass } from "./lib/api";
import { ACHIEVEMENTS, rankFor, TOTAL_ACHIEVEMENTS } from "./lib/achievements";

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

describe("page shell", () => {
  test("renders the hero headline", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  test("renders primary navigation", () => {
    render(<App />);
    expect(screen.getByRole("navigation", { name: /primary/i })).toBeInTheDocument();
  });

  test("applies a theme to the document root", () => {
    render(<App />);
    expect(document.documentElement.getAttribute("data-theme")).toBe("nebula");
  });

  test("exposes the site controls toolbar", () => {
    render(<App />);
    expect(screen.getByRole("toolbar", { name: /site controls/i })).toBeInTheDocument();
  });
});

describe("theme switching", () => {
  test("pressing T moves to the next theme", () => {
    render(<App />);
    fireEvent.keyDown(window, { key: "t" });
    expect(document.documentElement.getAttribute("data-theme")).toBe("supernova");
  });

  test("typing in a field does not trigger the theme shortcut", () => {
    render(<App />);
    const input = document.createElement("input");
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: "t" });
    expect(document.documentElement.getAttribute("data-theme")).toBe("nebula");
    document.body.removeChild(input);
  });
});

describe("terminal", () => {
  test("backtick opens the shell", async () => {
    render(<App />);
    fireEvent.keyDown(window, { key: "`" });
    expect(await screen.findByRole("dialog", { name: /interactive terminal/i })).toBeInTheDocument();
  });

  test("running whoami prints the name", async () => {
    render(<App />);
    fireEvent.keyDown(window, { key: "`" });

    const input = await screen.findByLabelText(/terminal input/i);
    fireEvent.change(input, { target: { value: "whoami" } });
    fireEvent.keyDown(input, { key: "Enter" });

    const dialog = screen.getByRole("dialog", { name: /interactive terminal/i });
    await waitFor(() => {
      expect(within(dialog).getByText("Raja Mishra - Java Backend Developer")).toBeInTheDocument();
    });
    expect(within(dialog).getByText(/open to opportunities/i)).toBeInTheDocument();
  });

  test("an unknown command reports command not found", async () => {
    render(<App />);
    fireEvent.keyDown(window, { key: "`" });

    const input = await screen.findByLabelText(/terminal input/i);
    fireEvent.change(input, { target: { value: "nonsense" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(await screen.findByText(/command not found: nonsense/i)).toBeInTheDocument();
  });
});

describe("achievements", () => {
  test("every achievement has the fields the UI renders", () => {
    ACHIEVEMENTS.forEach((a) => {
      expect(a.id).toBeTruthy();
      expect(a.name).toBeTruthy();
      expect(a.icon).toBeTruthy();
      expect(a.desc).toBeTruthy();
      expect(a.hint).toBeTruthy();
    });
  });

  test("achievement ids are unique", () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("rank scales from visitor to completionist", () => {
    expect(rankFor(0)).toBe("Visitor");
    expect(rankFor(TOTAL_ACHIEVEMENTS)).toBe("Completionist");
  });

  test("opening the command palette unlocks Commander", async () => {
    render(<App />);
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });

    expect(await screen.findByRole("dialog", { name: /command palette/i })).toBeInTheDocument();
    expect(await screen.findByText(/secret unlocked/i)).toBeInTheDocument();
    expect(await screen.findByText("Commander")).toBeInTheDocument();
  });
});

describe("api console", () => {
  test("every endpoint returns a serialisable body", async () => {
    for (const endpoint of ENDPOINTS) {
      const res = await callEndpoint(endpoint);
      expect(res.status).toBe(endpoint.status);
      expect(res.latency).toBeGreaterThan(0);
      expect(() => JSON.stringify(res.body)).not.toThrow();
      expect(res.headers["content-type"]).toBe("application/json");
    }
  });

  test("endpoint paths are unique", () => {
    const paths = ENDPOINTS.map((e) => e.method + " " + e.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  test("status codes map to the right style bucket", () => {
    expect(statusClass(200)).toBe("ok");
    expect(statusClass(201)).toBe("ok");
    expect(statusClass(403)).toBe("client");
    expect(statusClass(500)).toBe("server");
  });
});

describe("routing", () => {
  test("an unknown path renders the 404 error page", () => {
    window.history.pushState({}, "", "/does-not-exist");
    render(<App />);
    expect(screen.getByText(/whitelabel error page/i)).toBeInTheDocument();
    window.history.pushState({}, "", "/");
  });

  test("the navigation links to the DSA Arcade", () => {
    render(<App />);
    const nav = screen.getByRole("navigation", { name: /primary/i });
    expect(within(nav).getByRole("link", { name: /dsa arcade/i })).toHaveAttribute("href", "/dsa");
  });

  test("the DSA Arcade loads on its own route", async () => {
    window.history.pushState({}, "", "/dsa");
    render(<App />);
    expect(await screen.findByText(/every one of them playable/i, {}, { timeout: 8000 })).toBeInTheDocument();
    window.history.pushState({}, "", "/");
  });
});
