import { useMemo, useState } from "react";
import { projects, projectCategories } from "../data/projects";
import { profile } from "../data/profile";
import { SectionHeading } from "../components/ui/SectionHeading";
import { ProjectCard } from "./ProjectCard";
import { Reveal } from "../components/ui/Reveal";
import { SegmentedControl } from "../components/ui/SegmentedControl";
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

        <div className="projects__toolbar">
          <SegmentedControl label="Filter projects" value={filter} onChange={setFilter}
            options={[{ id: "all", label: "All work", count: projects.length }, ...projectCategories.map((cat) => ({
              ...cat, count: projects.filter((project) => project.category?.includes(cat.id)).length,
            }))]} />
          <p className="projects__count" role="status">{String(filtered.length).padStart(2, "0")} projects / selected work</p>
        </div>

        {filtered.length > 0 ? (
          <div className="projects__list">
            {filtered.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={projects.indexOf(project)} order={i} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </section>
  );
}
