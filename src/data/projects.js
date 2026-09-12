// Sourced from Raja's own LinkedIn project history. The government portal
// below is described generically at his request — no employer or state name
// in the copy — even though the live site and screenshot are public.

export const projects = [
  {
    id: "gov-education-portal",
    title: "Higher Education Portal",
    description:
      "A citizen-facing government portal for state-level higher education administration — university listings, student registration and admissions workflows, serving a large user base.",
    problem:
      "A state education department needed a single online portal for university information, student sign-up and admissions, replacing scattered offline processes.",
    solution:
      "Building and maintaining backend services in Java and Spring Boot for a live, actively-used government portal — ongoing work on a large-scale production system.",
    role: "Software Developer",
    stack: ["Java", "Spring Boot"],
    category: ["web"],
    image: "/projects/gov-education-portal.jpg",
    liveUrl: "https://universities.jharkhand.gov.in/home",
    repoUrl: "",
    period: "Mar 2022 – Present",
    featured: true,
  },
  {
    id: "office-management-system",
    title: "Office Management System",
    description:
      "A desktop application that streamlines day-to-day office operations — employee records, task assignment, documents and meetings — in one place.",
    problem:
      "Office admin work was spread across manual processes with no single system tracking employees, tasks, documents or meetings.",
    solution:
      "Built a Java desktop app covering user auth and roles, employee records, task tracking, document storage and a meeting scheduler, backed by a MySQL schema designed for the relationships between them.",
    role: "Solo developer",
    stack: ["Java", "Java Swing", "JavaFX", "MySQL"],
    category: ["desktop"],
    image: "",
    liveUrl: "",
    repoUrl: "",
    period: "Jan 2021 – May 2021",
    featured: true,
  },
  {
    id: "campus-vehicle-system",
    title: "Campus Vehicle Entry & Exit System",
    description:
      "A desktop application managing vehicle registration, token issuance and permit verification for campus security.",
    problem: "Campus security needed a reliable way to register, verify and log vehicle entry and exit.",
    solution:
      "Built a Java Swing application backed by an Oracle database, with automated token issuance, real-time permit verification and full entry/exit logging for auditing.",
    role: "Solo developer",
    stack: ["Java", "Java Swing", "Oracle Database"],
    category: ["desktop"],
    image: "",
    liveUrl: "",
    repoUrl: "",
    period: "Jan 2020 – Jun 2020",
    featured: false,
  },
  {
    id: "pathology-web-app",
    title: "Pathology Management Web App",
    description:
      "A responsive web app for patient registration, appointment scheduling and health record access at a pathology lab.",
    problem:
      "Patients needed a straightforward way to register, book check-up appointments and access past results online.",
    solution:
      "Led front-end design and styling with JavaScript, HTML and CSS in a three-person team, building a fully responsive interface with secure record storage on the backend.",
    role: "Front-end lead, team of 3",
    stack: ["JavaScript", "HTML", "CSS", "Java", "SQL"],
    category: ["web"],
    image: "",
    liveUrl: "",
    repoUrl: "",
    period: "Feb 2017 – May 2017",
    featured: false,
  },
];

export const projectCategories = [
  { id: "web", label: "Web" },
  { id: "desktop", label: "Desktop" },
];
