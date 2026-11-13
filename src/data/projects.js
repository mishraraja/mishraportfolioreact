// Sourced from Raja's own LinkedIn project history. The government portal
// below is described generically at his request — no employer or state name
// in the copy — even though the live site and screenshot are public.

export const projects = [
  {
    id: "gov-education-portal",
    title: "Higher Education Portal",
    description:
      "A public portal for university information, student registration, and admissions in Jharkhand.",
    problem:
      "University details and admission steps were spread across separate channels. The portal brings those services together online.",
    solution:
      "I build and maintain the portal's Java and Spring Boot backend services. The site is live, and the work continues as its services change.",
    role: "Software Developer",
    stack: ["Java", "Spring Boot"],
    category: ["web"],
    image: "/projects/gov-education-portal.jpg",
    imageAlt: "Screenshot of a higher education portal homepage with university and admissions navigation.",
    liveUrl: "https://universities.jharkhand.gov.in/home",
    repoUrl: "",
    period: "Mar 2022 – Present",
    featured: true,
  },
  {
    id: "office-management-system",
    title: "Office Management System",
    description:
      "A desktop app for employee records, task assignments, documents, and meeting schedules.",
    problem:
      "Office records, tasks, documents, and meetings were handled separately, making it hard to see their status in one place.",
    solution:
      "I built the Java desktop app, including login and roles, employee records, task tracking, document storage, and meeting scheduling, with MySQL behind it.",
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
      "A Java Swing app for recording vehicle entry and exit at a campus.",
    problem: "Security staff needed to check campus permits and keep an entry and exit log.",
    solution:
      "I built the app with Oracle storage, token issuance, permit checks, and entry and exit records.",
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
      "A web app for patient registration, appointment booking, and viewing lab results.",
    problem:
      "The lab wanted patients to book check-up appointments and view previous results online.",
    solution:
      "I led the front-end work in a three-person team, using JavaScript, HTML, and CSS for the patient-facing screens.",
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
