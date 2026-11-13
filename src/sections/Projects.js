import { useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { projects, projectCategories } from "../data/projects";
import { SectionHeading } from "../components/ui/SectionHeading";
import { ProjectCard } from "./ProjectCard";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import "./Projects.css";

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
          title="Selected projects."
          description="What each project does, what I worked on, and the tools it uses."
        />

        <div className="projects__toolbar">
          <SegmentedControl label="Filter projects" value={filter} onChange={setFilter}
            options={[{ id: "all", label: "All work", count: projects.length }, ...projectCategories.map((cat) => ({
              ...cat, count: projects.filter((project) => project.category?.includes(cat.id)).length,
            }))]} />
          <p className="projects__count" role="status">{String(filtered.length).padStart(2, "0")} projects / selected work</p>
        </div>

        {filtered.length > 0 ? (
          <LayoutGroup id="selected-work"><motion.div layout className="projects__list">
            <AnimatePresence initial={false}>
            {filtered.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={projects.indexOf(project)} order={i} />
            ))}
            </AnimatePresence>
          </motion.div></LayoutGroup>
        ) : null}
      </div>
    </section>
  );
}
