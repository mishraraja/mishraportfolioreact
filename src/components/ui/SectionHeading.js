import { Reveal } from "./Reveal";
import "./SectionHeading.css";

/**
 * Every section opens like a waypoint in a star chart: a sector number, a
 * label, and a horizon line that runs off toward the edge of the page.
 */
export function SectionHeading({ index, eyebrow, title, description, align = "left" }) {
  return (
    <div className={"section-heading section-heading--" + align}>
      <Reveal>
        <span className="section-heading__marker">
          {index ? <span className="section-heading__index">{index}</span> : null}
          <span className="section-heading__eyebrow">{eyebrow}</span>
          <span className="section-heading__rule" aria-hidden="true" />
        </span>
      </Reveal>

      <Reveal delay={0.08}>
        <h2 className="section-heading__title">{title}</h2>
      </Reveal>

      {description ? (
        <Reveal delay={0.14}>
          <p className="section-heading__desc">{description}</p>
        </Reveal>
      ) : null}
    </div>
  );
}
