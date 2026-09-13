import { Link } from "react-router-dom";
import { getPattern } from "../data/patterns";
import { isDue } from "../progress";
import { sfx } from "../../lib/sound";

const STATUS = {
  mastered: { icon: "★", label: "Mastered" },
  watched: { icon: "✓", label: "Watched" },
  seen: { icon: "◐", label: "Opened" },
  new: { icon: "○", label: "New" },
};

export function StatusBadge({ status, record }) {
  if (isDue(record)) {
    return (
      <span className="status status--due">
        <span aria-hidden="true">↻</span> Review due
      </span>
    );
  }
  const s = STATUS[status] || STATUS.new;
  return (
    <span className={"status status--" + status}>
      <span aria-hidden="true">{s.icon}</span> {s.label}
    </span>
  );
}

export function ProblemCard({ problem, status, record }) {
  const pattern = getPattern(problem.pattern);
  return (
    <Link to={"/dsa/" + problem.slug} className={"pcard pcard--" + status} onPointerEnter={sfx.hover} data-cursor="Play">
      <span className="pcard__top">
        <span className="pcard__emoji" aria-hidden="true">
          {problem.emoji}
        </span>
        <span className="pcard__num">#{problem.lc}</span>
      </span>
      <span className="pcard__title">{problem.title}</span>
      <span className="pcard__meta">
        <span className={"diff diff--" + problem.difficulty}>{problem.difficulty}</span>
        <span className="pcard__pattern">{pattern.name}</span>
      </span>
      <StatusBadge status={status} record={record} />
    </Link>
  );
}
