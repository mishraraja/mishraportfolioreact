import { useEffect, useRef, useState } from "react";
import { Btn, Panel, Say } from "./kit";
import { sfx } from "../../lib/sound";
import "./GitLab.css";

const COL = 70;
const PAD = 40;
const LANE_Y = [48, 116];
const HEIGHT = 168;

const INTRO = "A tiny repo with one commit on main. Edit a file, stage it, commit it — then branch, merge, rebase and undo. Every button is a real Git command.";

function freshRepo() {
  return {
    commits: { c1: { id: "c1", parents: [], lane: 0, changes: [] } },
    order: ["c1"],
    branches: { main: "c1" },
    head: "main",
    work: [],
    index: [],
    stash: [],
    counter: 1,
    edits: 0,
    log: [],
  };
}

/** Every commit reachable from `id`, including itself. */
function ancestors(repo, id) {
  const seen = new Set();
  const stack = [id];
  while (stack.length) {
    const c = stack.pop();
    if (c && !seen.has(c)) {
      seen.add(c);
      stack.push(...repo.commits[c].parents);
    }
  }
  return seen;
}

function newCommit(repo, commit, branch) {
  const counter = repo.counter + 1;
  const id = "c" + counter;
  return {
    id,
    repo: {
      ...repo,
      counter,
      commits: { ...repo.commits, [id]: { ...commit, id } },
      order: [...repo.order, id],
      branches: { ...repo.branches, [branch]: id },
    },
  };
}

/** One Git command. Returns { repo, cmd, text, tone, mission } or { error }. */
function run(repo, action) {
  const tip = repo.branches[repo.head];
  const lane = repo.head === "main" ? 0 : 1;

  switch (action) {
    case "edit": {
      const edits = repo.edits + 1;
      return {
        repo: { ...repo, edits, work: [...repo.work, "Δ" + edits] },
        cmd: "# edit OrderService.java",
        text: "You changed a file (Δ" + edits + "). The change lives only in your **working tree** — Git hasn't recorded anything yet.",
      };
    }
    case "add":
      if (!repo.work.length) return { error: "Nothing to add — the working tree is clean. Edit a file first." };
      return {
        repo: { ...repo, index: [...repo.index, ...repo.work], work: [] },
        cmd: "git add .",
        text: "`git add` copied your changes into the **index** (the staging area): exactly what the next commit will contain.",
      };
    case "commit": {
      if (!repo.index.length) {
        return { error: repo.work.length ? "Nothing is staged. `git commit` records only what's in the index — run `git add` first." : "Nothing to commit. Edit a file first." };
      }
      const made = newCommit(repo, { parents: [tip], lane, changes: repo.index }, repo.head);
      return {
        repo: { ...made.repo, index: [] },
        cmd: 'git commit -m "' + repo.index.join(" ") + '"',
        text: "Commit **" + made.id + "** is a snapshot of the index that points back at " + tip + ". The **" + repo.head + "** label moved forward to it.",
        tone: "good",
        mission: "first-commit",
      };
    }
    case "feature":
      if (repo.head === "feature") return { error: "You're already on feature." };
      if (repo.branches.feature) {
        return { repo: { ...repo, head: "feature" }, cmd: "git switch feature", text: "HEAD now points at **feature**. New commits will move that label, not main." };
      }
      return {
        repo: { ...repo, head: "feature", branches: { ...repo.branches, feature: tip } },
        cmd: "git switch -c feature",
        text: "A branch is just a new label on " + tip + ". Nothing was copied, which is why creating a branch is instant.",
      };
    case "main":
      if (repo.head === "main") return { error: "You're already on main." };
      return { repo: { ...repo, head: "main" }, cmd: "git switch main", text: "HEAD points at **main** again. Uncommitted changes came along with you." };
    case "merge": {
      if (!repo.branches.feature) return { error: "There's no feature branch yet. Create one and commit on it first." };
      if (repo.head !== "main") return { error: "Switch to main first — you merge feature *into* the branch you're on." };
      const f = repo.branches.feature;
      const m = repo.branches.main;
      if (ancestors(repo, m).has(f)) return { error: "Already up to date — main already contains everything on feature." };
      if (ancestors(repo, f).has(m)) {
        return {
          repo: { ...repo, branches: { ...repo.branches, main: f } },
          cmd: "git merge feature",
          text: "**Fast-forward.** main hadn't moved since feature branched off, so Git simply slid the main label forward to " + f + ". No merge commit needed.",
          tone: "good",
          mission: "merge",
        };
      }
      const made = newCommit(repo, { parents: [m, f], lane: 0, changes: [], merge: true }, "main");
      return {
        repo: made.repo,
        cmd: "git merge feature",
        text: "Both branches had moved on, so Git created **merge commit " + made.id + "** with two parents. History shows exactly what happened, in parallel.",
        tone: "good",
        mission: "merge",
      };
    }
    case "rebase": {
      if (!repo.branches.feature) return { error: "There's no feature branch yet. Create one and commit on it first." };
      if (repo.head !== "feature") return { error: "Switch to feature first — you rebase the branch you're on." };
      const onMain = ancestors(repo, repo.branches.main);
      const onFeature = ancestors(repo, repo.branches.feature);
      if (onFeature.has(repo.branches.main)) return { error: "feature already sits on top of main, so there's nothing to replay. Commit something on main first." };
      const mine = repo.order.filter((id) => onFeature.has(id) && !onMain.has(id) && !repo.commits[id].merge);
      if (!mine.length) return { error: "feature has no commits of its own to replay." };

      let next = repo;
      let parent = repo.branches.main;
      const moved = [];
      for (const oldId of mine) {
        const made = newCommit(next, { parents: [parent], lane: 1, changes: repo.commits[oldId].changes }, "feature");
        moved.push(oldId + " → " + made.id);
        next = made.repo;
        parent = made.id;
      }
      return {
        repo: next,
        cmd: "git rebase main",
        text: "Git replayed feature's commits on top of main as **brand-new commits** (" + moved.join(", ") + "). Same changes, new hashes, one straight line. The old commits are orphaned.",
        tone: "good",
        mission: "rebase",
      };
    }
    case "soft":
    case "mixed":
    case "hard": {
      const commit = repo.commits[tip];
      if (!commit.parents.length) return { error: "That's the very first commit — there's nothing before it to reset to." };
      if (commit.merge) return { error: "Let's keep this simple: undo a normal commit, not a merge." };
      const parent = commit.parents[0];
      const branches = { ...repo.branches, [repo.head]: parent };
      const what = commit.changes.join(" ");
      if (action === "soft") {
        return {
          repo: { ...repo, branches, index: [...commit.changes, ...repo.index] },
          cmd: "git reset --soft HEAD~1",
          text: "**" + repo.head + "** moved back to " + parent + ". The undone changes (" + what + ") are still **staged**, ready to commit again.",
          tone: "good",
          mission: "undo-keep",
        };
      }
      if (action === "mixed") {
        return {
          repo: { ...repo, branches, index: [], work: [...commit.changes, ...repo.index, ...repo.work] },
          cmd: "git reset HEAD~1",
          text: "**" + repo.head + "** moved back to " + parent + ". The undone changes (" + what + ") are in your **working tree**, unstaged.",
          tone: "good",
          mission: "undo-keep",
        };
      }
      return {
        repo: { ...repo, branches, index: [], work: [] },
        cmd: "git reset --hard HEAD~1",
        text:
          "**" + repo.head + "** moved back and the working tree was wiped to match. " + commit.id + "'s changes" +
          (repo.work.length || repo.index.length ? ", and your uncommitted edits," : "") + " are gone — only `git reflog` could find that commit now.",
        tone: "bad",
      };
    }
    case "revert": {
      const commit = repo.commits[tip];
      if (!commit.parents.length) return { error: "Reverting the initial commit would empty the repo. Make another commit first." };
      if (commit.merge) return { error: "Reverting a merge needs `-m 1` to say which parent to keep. Try a normal commit." };
      const made = newCommit(repo, { parents: [tip], lane, changes: commit.changes.map((c) => "¬" + c), revert: tip }, repo.head);
      return {
        repo: made.repo,
        cmd: "git revert " + commit.id,
        text: "**" + made.id + "** is a new commit that undoes " + commit.id + ". Nothing was rewritten, so it's safe on a branch other people have pulled.",
        tone: "good",
        mission: "revert",
      };
    }
    case "stash":
      if (!repo.work.length && !repo.index.length) return { error: "Nothing to stash — there are no uncommitted changes." };
      return {
        repo: { ...repo, stash: [...repo.stash, [...repo.index, ...repo.work]], work: [], index: [] },
        cmd: "git stash",
        text: "Your uncommitted changes went into the stash drawer. The working tree is clean — free to switch branches or pull.",
      };
    case "pop": {
      if (!repo.stash.length) return { error: "The stash is empty. Stash some changes first." };
      const top = repo.stash[repo.stash.length - 1];
      return {
        repo: { ...repo, stash: repo.stash.slice(0, -1), work: [...repo.work, ...top] },
        cmd: "git stash pop",
        text: "The stashed changes are back in your working tree, and that stash entry is gone.",
        tone: "good",
        mission: "stash",
      };
    }
    default:
      return { error: "Unknown command." };
  }
}

const GROUPS = [
  {
    title: "Everyday",
    actions: [
      ["edit", "✏️ edit a file"],
      ["add", "git add ."],
      ["commit", "git commit"],
    ],
  },
  {
    title: "Branches",
    actions: [
      ["feature", "git switch -c feature"],
      ["main", "git switch main"],
      ["merge", "git merge feature"],
      ["rebase", "git rebase main"],
    ],
  },
  {
    title: "Undo",
    actions: [
      ["soft", "git reset --soft HEAD~1"],
      ["mixed", "git reset HEAD~1"],
      ["hard", "git reset --hard HEAD~1"],
      ["revert", "git revert HEAD"],
    ],
  },
  {
    title: "Shelve",
    actions: [
      ["stash", "git stash"],
      ["pop", "git stash pop"],
    ],
  },
];

export function GitLab({ complete }) {
  const [repo, setRepo] = useState(freshRepo);
  const [say, setSay] = useState({ text: INTRO });
  const scroller = useRef(null);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [repo.order.length]);

  function handle(action) {
    const r = run(repo, action);
    if (r.error) {
      setSay({ text: r.error, tone: "bad" });
      sfx.error();
      return;
    }
    setRepo({ ...r.repo, log: [...repo.log, r.cmd].slice(-8) });
    setSay({ text: r.text, tone: r.tone });
    if (r.mission) complete(r.mission);
    if (r.tone === "bad") sfx.error();
    else if (r.tone === "good") sfx.success();
    else sfx.click();
  }

  function reset() {
    setRepo(freshRepo());
    setSay({ text: INTRO });
    sfx.close();
  }

  const reachable = new Set();
  Object.values(repo.branches).forEach((tip) => ancestors(repo, tip).forEach((id) => reachable.add(id)));

  const width = Math.max(320, PAD * 2 + (repo.order.length - 1) * COL);
  const pos = (id) => ({ x: PAD + repo.order.indexOf(id) * COL, y: LANE_Y[repo.commits[id].lane] });

  const edges = [];
  repo.order.forEach((id) => {
    repo.commits[id].parents.forEach((p) => {
      const a = pos(p);
      const b = pos(id);
      const d = a.y === b.y ? "M" + a.x + "," + a.y + " L" + b.x + "," + b.y : "M" + a.x + "," + a.y + " C" + (a.x + COL / 2) + "," + a.y + " " + (b.x - COL / 2) + "," + b.y + " " + b.x + "," + b.y;
      edges.push({ key: p + "-" + id, d, orphan: !reachable.has(id) });
    });
  });

  const labelFor = (name) => (repo.head === name ? "HEAD → " + name : name);

  return (
    <div className="lab gitlab">
      <Panel title="Commit graph" className="gitlab__graph-panel">
        <div className="gitlab__scroll" ref={scroller}>
          <svg width={width} height={HEIGHT} viewBox={"0 0 " + width + " " + HEIGHT} className="gitlab__svg" role="img" aria-label={"Commit graph. HEAD is on " + repo.head + " at " + repo.branches[repo.head]}>
            <text x="6" y={LANE_Y[0] + 4} className="gitlab__lane">
              main
            </text>
            <text x="6" y={LANE_Y[1] + 4} className="gitlab__lane">
              feat
            </text>
            {edges.map((e) => (
              <path key={e.key} d={e.d} className={"gitlab__edge" + (e.orphan ? " is-orphan" : "")} />
            ))}
            {repo.order.map((id) => {
              const p = pos(id);
              const c = repo.commits[id];
              const cls = !reachable.has(id) ? " is-orphan" : c.merge ? " is-merge" : c.revert ? " is-revert" : "";
              return (
                <g key={id} className={"gitlab__commit" + cls}>
                  <circle cx={p.x} cy={p.y} r="14" />
                  <text x={p.x} y={p.y + 4}>
                    {id}
                  </text>
                </g>
              );
            })}
            {Object.entries(repo.branches).map(([name, id]) => {
              const p = pos(id);
              const text = labelFor(name);
              const w = text.length * 6.6 + 14;
              const y = name === "main" ? p.y - 38 : p.y + 20;
              return (
                <g key={name} className={"gitlab__branch" + (repo.head === name ? " is-head" : "")}>
                  <rect x={p.x - w / 2} y={y} width={w} height="18" rx="9" />
                  <text x={p.x} y={y + 13}>
                    {text}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </Panel>

      <Say tone={say.tone}>{say.text}</Say>

      <div className="gitlab__areas">
        <Panel title="Working tree">
          <div className="lab-row">
            {repo.work.length ? (
              repo.work.map((c, i) => (
                <span key={c + i} className="lab-chip is-warn">
                  {c}
                </span>
              ))
            ) : (
              <span className="lab-note">clean</span>
            )}
          </div>
        </Panel>
        <Panel title="Index (staged)">
          <div className="lab-row">
            {repo.index.length ? (
              repo.index.map((c, i) => (
                <span key={c + i} className="lab-chip is-active">
                  {c}
                </span>
              ))
            ) : (
              <span className="lab-note">nothing staged</span>
            )}
          </div>
        </Panel>
        <Panel title="HEAD & stash">
          <span className="lab-note">
            HEAD → <strong>{repo.head}</strong> → {repo.branches[repo.head]}
          </span>
          <span className="lab-note">stash: {repo.stash.length ? repo.stash.length + " entr" + (repo.stash.length === 1 ? "y" : "ies") : "empty"}</span>
        </Panel>
      </div>

      <div className="gitlab__controls">
        {GROUPS.map((g) => (
          <Panel key={g.title} title={g.title}>
            <div className="gitlab__buttons">
              {g.actions.map(([id, label]) => (
                <Btn key={id} variant={id === "hard" ? "danger" : undefined} onClick={() => handle(id)}>
                  {id === "feature" && repo.branches.feature ? "git switch feature" : label}
                </Btn>
              ))}
            </div>
          </Panel>
        ))}
      </div>

      <Panel title="Terminal">
        <ol className="lab-log gitlab__terminal">
          {repo.log.length ? repo.log.map((cmd, i) => <li key={i}>$ {cmd}</li>) : <li>$ git log --oneline --graph</li>}
        </ol>
        <Btn variant="ghost" onClick={reset}>
          ↺ Fresh repo
        </Btn>
      </Panel>
    </div>
  );
}
