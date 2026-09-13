/**
 * The stack as a solar system.
 *
 * The star is the JVM — everything here orbits it. Distance from the star
 * reflects how close a technology sits to the core of his day-to-day work,
 * and period follows distance the way it does in a real system: the further
 * out a body is, the slower it goes round.
 */

export const star = {
  name: "JVM",
  label: "Java Virtual Machine",
  detail: "Eleven years of syntax, five of it in production. Everything here runs on it.",
};

export const bodies = [
  {
    id: "java",
    name: "Java",
    role: "The language",
    detail: "Core Java through to modern records and streams. The centre of gravity.",
    orbit: 0.34,
    radius: 15,
    period: 15,
    color: "#f89820",
    ring: false,
  },
  {
    id: "spring",
    name: "Spring Boot",
    role: "The framework",
    detail: "Services, starters, actuator, security filter chains. Where the working day happens.",
    orbit: 0.48,
    radius: 18,
    period: 24,
    color: "#6db33f",
    ring: false,
  },
  {
    id: "postgres",
    name: "PostgreSQL",
    role: "The datastore",
    detail: "Schema design, indexes and the explain plans that follow. Also MySQL where it was already there.",
    orbit: 0.62,
    radius: 16,
    period: 35,
    color: "#4a90d9",
    ring: true,
  },
  {
    id: "kafka",
    name: "Kafka",
    role: "The event bus",
    detail: "Streams between services that must not lose a message.",
    orbit: 0.76,
    radius: 13,
    period: 48,
    color: "#a78bfa",
    ring: false,
  },
  {
    id: "aws",
    name: "AWS",
    role: "The outer system",
    detail: "Where all of it actually runs.",
    orbit: 0.9,
    radius: 14,
    period: 64,
    color: "#ff9900",
    ring: true,
  },
];

/** A small body on a fast inner orbit — the front end, always moving. */
export const comet = {
  id: "react",
  name: "React / Angular",
  role: "The front end",
  detail: "The interfaces that sit in front of the services. This page is one of them.",
  color: "#48dbe0",
};
