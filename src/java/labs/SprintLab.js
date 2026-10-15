import { useState } from "react";
import { Btn, Panel, Say } from "./kit";
import { sfx } from "../../lib/sound";
import "./SprintLab.css";

const TIMELINE = [
  { id: "backlog", title: "Product Owner orders the backlog", detail: "The most valuable items rise to the top; refinement keeps them ready." },
  { id: "planning", title: "Sprint Planning", detail: "The team agrees a sprint goal and picks the backlog items that serve it." },
  { id: "daily", title: "Daily Scrum", detail: "15 minutes every day: progress towards the goal and anything blocking it." },
  { id: "done", title: "Increment meets the Definition of Done", detail: "Tested, reviewed, releasable — not “done except for testing”." },
  { id: "review", title: "Sprint Review", detail: "Show the increment to stakeholders and adapt the backlog together." },
  { id: "retro", title: "Sprint Retrospective", detail: "The team inspects how it worked and picks improvements for next sprint." },
];

const SHUFFLE = [3, 5, 1, 4, 0, 2];

const ROLES = [
  { id: "po", label: "Product Owner" },
  { id: "sm", label: "Scrum Master" },
  { id: "dev", label: "Developers" },
];

const DUTIES = [
  { id: "order", text: "Orders the product backlog by value", role: "po" },
  { id: "impediment", text: "Gets an impediment that's blocking the team removed", role: "sm" },
  { id: "estimate", text: "Sizes the work and decides how to build it", role: "dev" },
  { id: "coach", text: "Coaches the team and the organisation in Scrum", role: "sm" },
  { id: "priority", text: "Has the final say on what's most valuable next", role: "po" },
  { id: "increment", text: "Builds a usable increment every sprint", role: "dev" },
];

const ROLE_WHY = {
  po: "The Product Owner is accountable for maximising the value of the product.",
  sm: "The Scrum Master serves the team by improving how Scrum is used and clearing obstacles.",
  dev: "Developers are the people who build the increment, and they own how.",
};

const ORDER_INTRO = "A sprint is about to begin. Click the moments in the order they happen.";
const ROLES_INTRO = "Now match every duty to the Scrum role accountable for it.";

export function SprintLab({ complete }) {
  const [placed, setPlaced] = useState([]);
  const [shake, setShake] = useState(null);
  const [say, setSay] = useState({ text: ORDER_INTRO });

  const [answers, setAnswers] = useState({});
  const [wrong, setWrong] = useState(null);
  const [roleSay, setRoleSay] = useState({ text: ROLES_INTRO });

  const remaining = SHUFFLE.map((i) => TIMELINE[i]).filter((s) => !placed.includes(s.id));

  function pick(item) {
    const expected = TIMELINE[placed.length];
    if (item.id !== expected.id) {
      setShake({ id: item.id, n: Date.now() });
      setSay({ text: "Not yet — **" + item.title + "** happens later in the sprint.", tone: "bad" });
      sfx.error();
      return;
    }
    const next = [...placed, item.id];
    setPlaced(next);
    setShake(null);
    if (next.length === TIMELINE.length) {
      setSay({ text: "That's a full sprint. Review looks at **the product** with stakeholders; Retro looks at **the process** inside the team — and then it starts again.", tone: "good" });
      complete("timeline");
      sfx.success();
    } else {
      setSay({ text: "✓ **" + item.title + "** — " + item.detail });
      sfx.click();
    }
  }

  function answer(duty, role) {
    if (answers[duty.id]) return;
    if (duty.role !== role) {
      setWrong({ id: duty.id, n: Date.now() });
      setRoleSay({ text: "Not quite. “" + duty.text + "” isn't the " + ROLES.find((r) => r.id === role).label + "'s job.", tone: "bad" });
      sfx.error();
      return;
    }
    const next = { ...answers, [duty.id]: role };
    setAnswers(next);
    setWrong(null);
    if (Object.keys(next).length === DUTIES.length) {
      setRoleSay({ text: "All six matched. Scrum has exactly three accountabilities — there's no “project manager” and no “tech lead” role in the guide.", tone: "good" });
      complete("roles");
      sfx.success();
    } else {
      setRoleSay({ text: "✓ " + ROLE_WHY[role] });
      sfx.click();
    }
  }

  return (
    <div className="lab sprint">
      <Panel title="Part 1 · Run the sprint in order">
        <div className="sprint__board">
          <ol className="sprint__timeline">
            {TIMELINE.map((s, i) => {
              const done = i < placed.length;
              return (
                <li key={s.id} className={done ? "is-done" : i === placed.length ? "is-next" : ""}>
                  <span className="sprint__num">{i + 1}</span>
                  {done ? (
                    <span className="sprint__text">
                      <strong>{s.title}</strong>
                      <span>{s.detail}</span>
                    </span>
                  ) : (
                    <span className="sprint__blank">{i === placed.length ? "what happens next?" : ""}</span>
                  )}
                </li>
              );
            })}
          </ol>
          <div className="sprint__pool">
            <span className="lab-label">Pick the next moment</span>
            {remaining.map((s) => {
              const shaking = shake && shake.id === s.id;
              return (
                <Btn key={s.id + (shaking ? shake.n : "")} className={shaking ? "lab-shake" : ""} onClick={() => pick(s)}>
                  {s.title}
                </Btn>
              );
            })}
            {!remaining.length ? <p className="lab-note">🏁 Sprint complete. The next one starts with planning again.</p> : null}
            {placed.length ? (
              <Btn
                variant="ghost"
                onClick={() => {
                  setPlaced([]);
                  setSay({ text: ORDER_INTRO });
                }}
              >
                ↺ Start over
              </Btn>
            ) : null}
          </div>
        </div>
      </Panel>

      <Say tone={say.tone}>{say.text}</Say>

      <Panel title="Part 2 · Who's accountable?">
        <ul className="sprint__duties">
          {DUTIES.map((d) => {
            const done = answers[d.id];
            const shaking = wrong && wrong.id === d.id;
            return (
              <li key={d.id + (shaking ? wrong.n : "")} className={"sprint__duty" + (done ? " is-done" : "") + (shaking ? " lab-shake" : "")}>
                <span className="sprint__duty-text">{d.text}</span>
                {done ? (
                  <span className="lab-chip is-good">✓ {ROLES.find((r) => r.id === done).label}</span>
                ) : (
                  <span className="lab-row" role="group" aria-label={d.text}>
                    {ROLES.map((r) => (
                      <Btn key={r.id} onClick={() => answer(d, r.id)}>
                        {r.label}
                      </Btn>
                    ))}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </Panel>

      <Say tone={roleSay.tone}>{roleSay.text}</Say>
    </div>
  );
}
