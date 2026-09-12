import { skillGroups } from "../data/skills";
import { SectionHeading } from "../components/ui/SectionHeading";
import { RevealGroup, revealItemVariants } from "../components/ui/Reveal";
import { motion } from "framer-motion";
import "./Skills.css";

export function Skills() {
  return (
    <section id="skills" className="skills section">
      <div className="container">
        <SectionHeading
          index="04"
          eyebrow="Technology"
          title="The stack, end to end."
          description="Tools used deliberately, not collected for their own sake."
        />

        <div className="skills__groups">
          {skillGroups.map((group) => (
            <div key={group.id} className="skills__group">
              <h3 className="skills__group-label">{group.label}</h3>
              <RevealGroup className="skills__grid" stagger={0.05}>
                {group.skills.map(({ name, icon: Icon }) => (
                  <motion.div key={name} className="skill-chip" variants={revealItemVariants}>
                    <Icon className="skill-chip__icon" aria-hidden="true" />
                    <span>{name}</span>
                  </motion.div>
                ))}
              </RevealGroup>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
