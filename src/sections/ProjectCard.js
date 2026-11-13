import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
        <path d="M40 110H110C170 110 130 50 200 50S230 170 290 170H360M200 25V195" stroke="var(--color-border-strong)" strokeDasharray="3 6" />
        <motion.path d="M40 110H110C170 110 130 50 200 50S230 170 290 170H360" stroke="var(--color-accent)" strokeWidth="1.5" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.5 }} />
        {[40, 110, 200, 290, 360].map((x, i) => <circle key={x} cx={x} cy={[110, 110, 50, 170, 170][i]} r={i === 2 ? 7 : 3} fill="var(--color-accent-3)" />)}
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
  const [expanded, setExpanded] = useState(false);
  const detailId = useId();
  const href = project.liveUrl || project.repoUrl;
  const Component = href ? motion.a : motion.div;
  const linkProps = href ? { href, target: "_blank", rel: "noreferrer" } : {};

  return (
    <motion.article className="project-story" layout={reduced ? false : "position"}
      exit={{ opacity: 0, scale: reduced ? 1 : .985 }} transition={{ duration: .18 }}>
    <Component
      className="project-card"
      initial={reduced ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: reduced ? 0 : 0.45, delay: order * 0.04, ease: [0.16, 1, 0.3, 1] }}
      {...linkProps}
    >
      <span className="project-card__index">{String(index + 1).padStart(2, "0")}</span>

      <div className="project-card__media">
        {project.image ? (
          <img src={project.image} alt={project.imageAlt || project.title} loading="lazy" decoding="async" width="800" height="500" />
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
    <div className="project-story__details">
      <button type="button" id={detailId + "-button"} aria-expanded={expanded} aria-controls={detailId}
        onClick={() => setExpanded((value) => !value)}>
        <span>Project details <span className="sr-only">— {project.title}</span></span>
        <motion.span aria-hidden="true" animate={{ rotate: expanded ? 45 : 0 }} transition={{ duration: .2 }}>+</motion.span>
      </button>
      <AnimatePresence initial={false}>
      {expanded && <motion.div id={detailId} role="region" aria-labelledby={detailId + "-button"}
        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
        transition={{ duration: reduced ? 0 : .28, ease: [.16, 1, .3, 1] }} style={{ overflow: "hidden" }}>
      <dl>
        <div><dt>01 / The problem</dt><dd>{project.problem}</dd></div>
        <div><dt>02 / My contribution</dt><dd><strong>{project.role}.</strong> {project.solution}</dd></div>
        <div><dt>03 / What got built</dt><dd>{project.description}</dd></div>
      </dl>
      </motion.div>}
      </AnimatePresence>
    </div>
    </motion.article>
  );
}
