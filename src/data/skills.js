// Sourced from the original Techstack component, the README "Built With"
// list, and the real skills/experience listed on Raja's own LinkedIn profile.
import { DiJava, DiNodejs, DiReact, DiGit, DiCss3, DiJavascript1 } from "react-icons/di";
import {
  SiSpringboot,
  SiSpring,
  SiHibernate,
  SiExpress,
  SiPostgresql,
  SiMysql,
  SiApachekafka,
  SiAmazonaws,
  SiAngular,
  SiApachetomcat,
} from "react-icons/si";
import { TbApi, TbShieldLock } from "react-icons/tb";
import { BsDiagram3 } from "react-icons/bs";

export const skillGroups = [
  {
    id: "backend",
    label: "Backend",
    skills: [
      { name: "Java", icon: DiJava },
      { name: "Spring Framework", icon: SiSpring },
      { name: "Spring Boot", icon: SiSpringboot },
      { name: "Spring Security", icon: TbShieldLock },
      { name: "Hibernate / JPA", icon: SiHibernate },
      { name: "Node.js", icon: DiNodejs },
      { name: "Express.js", icon: SiExpress },
    ],
  },
  {
    id: "frontend",
    label: "Frontend",
    skills: [
      { name: "React", icon: DiReact },
      { name: "Angular", icon: SiAngular },
      { name: "JavaScript", icon: DiJavascript1 },
      { name: "HTML / CSS", icon: DiCss3 },
    ],
  },
  {
    id: "data-cloud",
    label: "Data & Cloud",
    skills: [
      { name: "PostgreSQL", icon: SiPostgresql },
      { name: "MySQL", icon: SiMysql },
      { name: "Apache Kafka", icon: SiApachekafka },
      { name: "AWS", icon: SiAmazonaws },
    ],
  },
  {
    id: "concepts",
    label: "Architecture",
    skills: [
      { name: "Microservices", icon: BsDiagram3 },
      { name: "REST APIs", icon: TbApi },
    ],
  },
  {
    id: "tools",
    label: "Tooling",
    skills: [
      { name: "Git", icon: DiGit },
      { name: "Apache Tomcat", icon: SiApachetomcat },
    ],
  },
];
