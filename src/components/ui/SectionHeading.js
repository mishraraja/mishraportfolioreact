import { Reveal } from "./Reveal";
import "./SectionHeading.css";

export function SectionHeading({ index, eyebrow, title, description, align = "left" }) {
  return (
    <div className={`section-heading section-heading--${align}`}>
      <Reveal>
        <span className="eyebrow">
          {index ? <span className="section-heading__index">{index}</span> : null}
          {eyebrow}
        </span>
      </Reveal>
      <Reveal delay={0.08}>
        <h2 className="section-heading__title">{title}</h2>
      </Reveal>
      {description ? (
        <Reveal delay={0.14}>
          <p className="section-heading__desc text-muted">{description}</p>
        </Reveal>
      ) : null}
    </div>
  );
}
