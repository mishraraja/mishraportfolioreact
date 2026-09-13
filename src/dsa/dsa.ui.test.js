import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ExperienceProvider } from "../context/ExperienceContext";
import DsaArcade from "./DsaArcade";
import { PROBLEMS, getProblem } from "./data";
import { runTrace } from "./engine/trace";
import { Stage } from "./engine/Stage";

function renderAt(path) {
  return render(
    <ExperienceProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/dsa/*" element={<DsaArcade />} />
        </Routes>
      </MemoryRouter>
    </ExperienceProvider>
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("hub", () => {
  test("shows every problem on the map", () => {
    const { container } = renderAt("/dsa");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/every one of them playable/i);
    expect(container.querySelectorAll("a.pcard")).toHaveLength(75);
  });

  test("search narrows the map", () => {
    const { container } = renderAt("/dsa");
    fireEvent.change(screen.getByRole("searchbox", { name: /search problems/i }), { target: { value: "palindrom" } });
    expect(container.querySelectorAll("a.pcard")).toHaveLength(3);
  });

  test("difficulty filter keeps only hard problems", () => {
    const { container } = renderAt("/dsa");
    fireEvent.click(within(screen.getByRole("group", { name: /difficulty/i })).getByRole("button", { name: "Hard" }));
    const hard = PROBLEMS.filter((p) => p.difficulty === "Hard").length;
    expect(container.querySelectorAll("a.pcard")).toHaveLength(hard);
  });
});

describe("problem page", () => {
  test("playing to the end reveals the answer and awards XP", async () => {
    renderAt("/dsa/two-sum");
    expect(screen.getByRole("heading", { level: 1, name: "Two Sum" })).toBeInTheDocument();
    const next = screen.getByRole("button", { name: "Next step" });
    for (let i = 0; i < 20 && !next.disabled; i += 1) fireEvent.click(next);
    expect(screen.getByText("[0, 1]", { selector: ".player__done code" })).toBeInTheDocument();
    expect(await screen.findByText(/watched it all the way through/i)).toBeInTheDocument();
  });

  test("predict mode pauses and asks what happens next", () => {
    renderAt("/dsa/two-sum");
    fireEvent.click(screen.getByRole("checkbox", { name: /predict mode/i }));
    const next = screen.getByRole("button", { name: "Next step" });
    fireEvent.click(next);
    fireEvent.click(next);
    const quiz = screen.getByRole("group", { name: /predict the next step/i });
    fireEvent.click(within(quiz).getByRole("button", { name: "No" }));
    expect(within(quiz).getByText(/nailed it|exactly right|thinking like|spot on|that's the one/i)).toBeInTheDocument();
    fireEvent.click(within(quiz).getByRole("button", { name: /see what happens/i }));
    expect(screen.queryByRole("group", { name: /predict the next step/i })).not.toBeInTheDocument();
  });

  test("bad custom input explains what's wrong", () => {
    renderAt("/dsa/two-sum");
    fireEvent.click(screen.getByRole("button", { name: /try your own input/i }));
    fireEvent.change(screen.getByRole("textbox", { name: /nums/i }), { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: /run it/i }));
    expect(screen.getByText(/use a list of whole numbers/i)).toBeInTheDocument();
  });

  test("good custom input re-runs the animation", () => {
    renderAt("/dsa/two-sum");
    fireEvent.click(screen.getByRole("button", { name: /try your own input/i }));
    fireEvent.change(screen.getByRole("textbox", { name: /nums/i }), { target: { value: "[1, 5, 4]" } });
    fireEvent.change(screen.getByRole("textbox", { name: /target/i }), { target: { value: "9" } });
    fireEvent.click(screen.getByRole("button", { name: /run it/i }));
    expect(screen.getByText("[1, 5, 4]", { selector: ".player__input-line code" })).toBeInTheDocument();
    expect(screen.queryByText(/use a list of whole numbers/i)).not.toBeInTheDocument();
  });

  test("answering the mastery question marks the problem mastered", () => {
    renderAt("/dsa/two-sum");
    const problem = getProblem("two-sum");
    fireEvent.click(screen.getByRole("button", { name: problem.quiz.options[problem.quiz.answer] }));
    expect(screen.getByText(/it's now on your review schedule/i)).toBeInTheDocument();
    const saved = JSON.parse(window.localStorage.getItem("rm.dsa.progress.v1"));
    expect(saved.problems["two-sum"].mastered).toBe(true);
  });

  test("an unknown problem shows a friendly not-found", () => {
    renderAt("/dsa/not-a-real-problem");
    expect(screen.getByText(/that level doesn't exist/i)).toBeInTheDocument();
  });
});

describe("learn pages", () => {
  test.each([
    ["/dsa/learn/patterns", /recognise patterns/i],
    ["/dsa/learn/roadmap", /eight weeks/i],
    ["/dsa/learn/big-o", /feel the difference/i],
    ["/dsa/learn/interview", /this is the other half/i],
    ["/dsa/radar", /name the pattern/i],
  ])("%s renders", (path, title) => {
    renderAt(path);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(title);
  });

  test("a pattern opens to show its template and problems", () => {
    renderAt("/dsa/learn/patterns");
    fireEvent.click(screen.getByRole("button", { name: /hash map & set/i }));
    expect(screen.getByText(/spot it when you see/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /two sum/i }).length).toBeGreaterThan(0);
  });

  test("the Big-O slider changes n", () => {
    const { container } = renderAt("/dsa/learn/big-o");
    fireEvent.change(screen.getByRole("slider", { name: /input size/i }), { target: { value: "2" } });
    expect(container.querySelector(".bigo-lab__n")).toHaveTextContent("n = 100");
  });

  test("Pattern Radar plays a round", () => {
    const { container } = renderAt("/dsa/radar");
    fireEvent.click(screen.getByRole("button", { name: /start scanning/i }));
    const options = container.querySelectorAll(".radar__opt");
    expect(options).toHaveLength(4);
    fireEvent.click(options[0]);
    expect(screen.getByRole("button", { name: /next problem/i })).toBeInTheDocument();
  });
});

describe("stage", () => {
  test.each(PROBLEMS.map((p) => [p.slug, p]))("draws every frame of %s", (slug, problem) => {
    const { frames } = runTrace(problem, problem.examples[0].input);
    const { rerender, unmount } = render(<Stage panels={frames[0].panels} />);
    frames.forEach((frame) => rerender(<Stage panels={frame.panels} />));
    unmount();
  });
});
