import { Link } from "react-router-dom";
import { sfx } from "../../lib/sound";

export function LabCard({ lab, record }) {
  const known = new Set(lab.missions.map((m) => m.id));
  const count = record.missions.filter((id) => known.has(id)).length;
  const done = record.done;

  return (
    <Link to={"/java/lab/" + lab.id} className={"jlab" + (done ? " is-done" : "")} onPointerEnter={sfx.hover}>
      <span className="jlab__top">
        <span className="jlab__emoji" aria-hidden="true">
          {lab.emoji}
        </span>
        <span className={"jlab__status" + (done ? " is-done" : "")}>{done ? "🏆 cleared" : count + " / " + lab.missions.length + " missions"}</span>
      </span>
      <span className="jlab__title">{lab.title}</span>
      <span className="jlab__blurb">{lab.blurb}</span>
      <span className="meter" style={{ "--meter": "var(--color-accent-2)" }} aria-hidden="true">
        <span className="meter__fill" style={{ width: (count / lab.missions.length) * 100 + "%" }} />
      </span>
    </Link>
  );
}
