import { motion } from "framer-motion";
import { useTilt } from "../hooks/useTilt";
import { useReducedMotion } from "../hooks/useReducedMotion";
import "./ProjectCard.css";

const BLUEPRINTS = {
  "office-management-system": { title: "Office operations", nodes: ["ACCESS & ROLES", "EMPLOYEE DATA", "TASKS & MEETINGS", "MYSQL STORAGE"] },
  "campus-vehicle-system": { title: "Campus access", nodes: ["REGISTRATION", "PERMIT CHECK", "TOKEN ISSUANCE", "ENTRY / EXIT LOG"] },
  "pathology-web-app": { title: "Patient experience", nodes: ["REGISTRATION", "APPOINTMENTS", "HEALTH RECORDS", "LAB WORKFLOW"] },
};

function ProjectBlueprint({ project }) {
  const blueprint = BLUEPRINTS[project.id];
  if (!blueprint) return null;
  return (
    <div className="project-blueprint" aria-hidden="true">
      <div className="project-blueprint__caption"><span>SYSTEM MAP</span><span>{project.category.includes("desktop") ? "DESKTOP" : "WEB"} ↗</span></div>
      <svg className="project-blueprint__routes" viewBox="0 0 400 220" preserveAspectRatio="none" fill="none">
        <path d="M90 65H310V170H90ZM200 65V170M90 115H310" stroke="var(--color-accent-3)" strokeOpacity=".3" strokeDasharray="4 5" />
        <circle cx="200" cy="115" r="27" stroke="var(--color-accent)" strokeOpacity=".6" />
      </svg>
      <div className="project-blueprint__nodes">{blueprint.nodes.map((node, i) => (
        <div key={node}><span>{String(i + 1).padStart(2, "0")}</span><b>{node}</b></div>
      ))}</div>
      <div className="project-blueprint__title">{blueprint.title}<span>Architecture sketch</span></div>
    </div>
  );
}

export function ProjectCard({ project, index, order = index }) {
  const reduced = useReducedMotion();
  const href = project.liveUrl || project.repoUrl;
  const Component = href ? motion.a : motion.div;
  const linkProps = href ? { href, target: "_blank", rel: "noreferrer" } : {};
  const tilt = useTilt(6);

  return (
    <motion.div className="project-story" layout={reduced ? false : "position"}>
    <Component
      className="project-card"
      initial={reduced ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: reduced ? 0 : 0.45, delay: order * 0.04, ease: [0.16, 1, 0.3, 1] }}
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
          <img src={project.image} alt="" loading="lazy" decoding="async" width="800" height="500" />
        ) : (
          <ProjectBlueprint project={project} />
        )}
      </div>

      <div className="project-card__body">
        <span className="project-card__kind">{project.featured ? "FEATURED BUILD" : "PROJECT ARCHIVE"} <span aria-hidden="true">/</span> {project.category.includes("desktop") ? "DESKTOP SYSTEM" : "WEB APPLICATION"}</span>
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
    <details className="project-story__details">
      <summary>Project details <span className="sr-only">— {project.title}</span></summary>
      <dl>
        <div><dt>01 / The problem</dt><dd>{project.problem}</dd></div>
        <div><dt>02 / My contribution</dt><dd><strong>{project.role}.</strong> {project.solution}</dd></div>
        <div><dt>03 / What got built</dt><dd>{project.description}</dd></div>
      </dl>
    </details>
    </motion.div>
  );
}
