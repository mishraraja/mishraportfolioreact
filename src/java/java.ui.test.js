import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ExperienceProvider } from "../context/ExperienceContext";
import JavaArcade from "./JavaArcade";
import { WORLDS } from "./data/worlds";
import { CONCEPTS, bossFor, conceptsInWorld } from "./data";
import { LABS } from "./labs";

const KEY = "rm.java.progress.v1";

function renderAt(path) {
  return render(
    <ExperienceProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/java/*" element={<JavaArcade />} />
        </Routes>
      </MemoryRouter>
    </ExperienceProvider>
  );
}

function saved() {
  return JSON.parse(window.localStorage.getItem(KEY) || "{}");
}

function missionsOf(labId) {
  const lab = (saved().labs || {})[labId];
  return lab ? lab.missions : [];
}

const click = (name) => fireEvent.click(screen.getByRole("button", { name }));

beforeEach(() => {
  window.localStorage.clear();
});

describe("hub", () => {
  test("shows all ten worlds", () => {
    const { container } = renderAt("/java");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/made playable/i);
    expect(container.querySelectorAll("a.jworld")).toHaveLength(WORLDS.length);
  });

  test("the labs index lists every lab", () => {
    const { container } = renderAt("/java/labs");
    expect(container.querySelectorAll("a.jlab")).toHaveLength(LABS.length);
  });
});

describe("world page", () => {
  test("renders every concept card for the world", () => {
    const { container } = renderAt("/java/core-java");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Core Java");
    expect(container.querySelectorAll(".concept")).toHaveLength(conceptsInWorld("core-java").length);
  });

  test("a card opens to three tabs and can be marked understood", () => {
    renderAt("/java/core-java");
    const concept = CONCEPTS.find((c) => c.id === "string-pool");
    fireEvent.click(screen.getByRole("button", { name: new RegExp(concept.title.replace(/[&]/g, "\\&")) }));
    fireEvent.click(screen.getByRole("tab", { name: /interview/i }));
    expect(screen.getByText(/the follow-up trap/i)).toBeInTheDocument();
    click("💡 I get it now");
    expect(saved().concepts["string-pool"]).toBe(true);
    expect(saved().xp).toBe(5);
  });

  test("the most-asked filter narrows the cards", () => {
    const { container } = renderAt("/java/collections");
    fireEvent.click(within(screen.getByRole("group", { name: /filter cards/i })).getByRole("button", { name: /most asked/i }));
    expect(container.querySelectorAll(".concept")).toHaveLength(conceptsInWorld("collections").filter((c) => c.hot).length);
  });

  test("answering every boss question right defeats the boss", () => {
    renderAt("/java/git");
    click(/fight the boss/i);
    bossFor("git").forEach((q) => {
      click(q.options[q.answer]);
      click(/next question|see the result/i);
    });
    expect(screen.getByText("Boss defeated!")).toBeInTheDocument();
    expect(saved().bosses.git.won).toBe(true);
  });

  test("an unknown world shows a friendly not-found", () => {
    renderAt("/java/cobol");
    expect(screen.getByText(/that world doesn't exist/i)).toBeInTheDocument();
  });
});

describe("labs", () => {
  test.each(LABS.map((lab) => [lab.id, lab]))("%s renders", (id, lab) => {
    renderAt("/java/lab/" + id);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(lab.title);
  });

  test("HashMap lab: a true collision, then a resize", () => {
    renderAt("/java/lab/hashmap");
    click("put Aa");
    click("put BB");
    expect(screen.getByText("same hashCode")).toBeInTheDocument();
    click("put pen");
    click("put ink");
    expect(missionsOf("hashmap")).toEqual(expect.arrayContaining(["collision", "resize"]));
  });

  test("Race lab: interleaving two count++ loses an update", () => {
    renderAt("/java/lab/race");
    ["T1", "T2", "T1", "T1", "T2", "T2"].forEach((t) => click(new RegExp("step " + t, "i")));
    expect(screen.getByText("lost update")).toBeInTheDocument();
    expect(missionsOf("race")).toContain("lost-update");
  });

  test("Deadlock lab: opposite lock order deadlocks", () => {
    renderAt("/java/lab/deadlock");
    ["T1", "T2", "T1", "T2"].forEach((t) => click(new RegExp("step " + t, "i")));
    expect(screen.getByText("Deadlock.")).toBeInTheDocument();
    expect(missionsOf("deadlock")).toContain("deadlock");
  });

  test("Thread states lab: starting twice throws", () => {
    renderAt("/java/lab/thread-states");
    click("t.start()");
    click("t.start()");
    expect(screen.getByText("IllegalThreadStateException")).toBeInTheDocument();
    expect(missionsOf("thread-states")).toContain("double-start");
  });

  test("Git lab: edit, add and commit clears the first mission", () => {
    renderAt("/java/lab/git");
    click(/edit a file/i);
    click("git add .");
    click("git commit");
    expect(missionsOf("git")).toContain("first-commit");
  });

  test("Thread pool lab: the queue fills before the pool grows", () => {
    renderAt("/java/lab/thread-pool");
    for (let i = 0; i < 5; i += 1) click(/pool\.submit/i);
    expect(missionsOf("thread-pool")).toEqual(expect.arrayContaining(["queued", "grow"]));
  });
});

describe("games and revision", () => {
  test("This or That plays a clue", () => {
    const { container } = renderAt("/java/play/this-or-that");
    click("Start →");
    const choices = container.querySelectorAll(".vs__choice");
    expect(choices).toHaveLength(2);
    fireEvent.click(choices[0]);
    expect(screen.getByRole("button", { name: /next clue/i })).toBeInTheDocument();
  });

  test("Guess the Output plays a snippet", () => {
    const { container } = renderAt("/java/play/guess-output");
    click("Show me the code →");
    const options = container.querySelectorAll(".guess__opt");
    expect(options).toHaveLength(4);
    fireEvent.click(options[0]);
    expect(screen.getByRole("button", { name: /next snippet|see my score/i })).toBeInTheDocument();
  });

  test("the revision sheet can be searched", () => {
    const { container } = renderAt("/java/revise");
    expect(container.querySelectorAll(".revise__item")).toHaveLength(CONCEPTS.length);
    fireEvent.change(screen.getByRole("searchbox", { name: /search the revision sheet/i }), { target: { value: "rebase" } });
    const hits = container.querySelectorAll(".revise__item").length;
    expect(hits).toBeGreaterThan(0);
    expect(hits).toBeLessThan(CONCEPTS.length);
  });
});
