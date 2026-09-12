import { motion } from "framer-motion";
import { useTilt } from "../hooks/useTilt";
import "./ProjectCard.css";

export function ProjectCard({ project, index }) {
  const href = project.liveUrl || project.repoUrl;
  const Component = href ? motion.a : motion.div;
  const linkProps = href ? { href, target: "_blank", rel: "noreferrer" } : {};
  const tilt = useTilt(6);

  return (
    <Component
      className="project-card"
      data-cursor={href ? "View" : undefined}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.6, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      {...linkProps}
    >
      <span className="project-card__index">{String(index + 1).padStart(2, "0")}</span>

      <div
        className="project-card__media"
        ref={tilt.ref}
        onMouseMove={tilt.onMouseMove}
        onMouseLeave={tilt.onMouseLeave}
      >
        {project.image ? (
          <img src={project.image} alt="" loading="lazy" />
        ) : (
          <div className="project-card__placeholder" aria-hidden="true">
            {project.title
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")}
          </div>
        )}
      </div>

      <div className="project-card__body">
        {project.period ? <span className="project-card__period text-muted">{project.period}</span> : null}
        <h3>{project.title}</h3>
        <p className="text-muted">{project.description}</p>
        <div className="project-card__stack">
          {project.stack?.map((tech) => (
            <span key={tech} className="tag">
              {tech}
            </span>
          ))}
        </div>
      </div>

      {href ? <span className="project-card__link">View Project →</span> : null}
    </Component>
  );
}
