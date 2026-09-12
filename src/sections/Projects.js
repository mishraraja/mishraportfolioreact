import { useMemo, useState } from "react";
import { projects, projectCategories } from "../data/projects";
import { profile } from "../data/profile";
import { SectionHeading } from "../components/ui/SectionHeading";
import { ProjectCard } from "./ProjectCard";
import { Reveal } from "../components/ui/Reveal";
import "./Projects.css";

function EmptyState() {
  return (
    <Reveal className="projects-empty">
      <p className="projects-empty__title">Case studies are being finalized.</p>
      <p className="text-muted">
        This section is fully wired up and ready to go — it just needs real project data
        {profile.social.github ? (
          <>
            {" "}
            in the meantime, browse the code on{" "}
            <a href={profile.social.github} target="_blank" rel="noreferrer" className="text-gradient">
              GitHub
            </a>
            .
          </>
        ) : (
          "."
        )}
      </p>
    </Reveal>
  );
}

export function Projects() {
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    if (filter === "all") return projects;
    return projects.filter((p) => p.category?.includes(filter));
  }, [filter]);

  return (
    <section id="projects" className="projects section">
      <div className="container">
        <SectionHeading
          index="03"
          eyebrow="Selected Work"
          title="Projects that mattered."
          description="A closer look at what got built, why, and how."
        />

        {projectCategories.length > 0 && (
          <div className="projects__filters">
            <button
              className={`tag ${filter === "all" ? "tag--active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            {projectCategories.map((cat) => (
              <button
                key={cat.id}
                className={`tag ${filter === cat.id ? "tag--active" : ""}`}
                onClick={() => setFilter(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {filtered.length > 0 ? (
          <div className="projects__list">
            {filtered.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </section>
  );
}
