/**
 * The Backend Arcade's ten worlds — the topics a Java backend interview
 * actually walks through, roughly in the order interviewers go.
 */
export const WORLDS = [
  {
    id: "core-java",
    name: "Core Java",
    emoji: "☕",
    tagline: "What the JVM is really doing under your code.",
    blurb: "Memory, the String pool, wrappers, exceptions, GC, generics and modern Java — the round that decides whether the rest of the interview happens.",
  },
  {
    id: "oop",
    name: "OOP & Design Patterns",
    emoji: "🧩",
    tagline: "Four pillars, one contract and the patterns everyone asks about.",
    blurb: "Encapsulation to polymorphism, the equals/hashCode contract, composition over inheritance, SOLID and the patterns Spring is built from.",
  },
  {
    id: "collections",
    name: "Collections",
    emoji: "🗂️",
    tagline: "Pick the right box, and know what's inside it.",
    blurb: "HashMap internals, ArrayList vs LinkedList, sets, ConcurrentHashMap, fail-fast iterators and Comparable vs Comparator.",
  },
  {
    id: "concurrency",
    name: "Multithreading",
    emoji: "🧵",
    tagline: "Many hands, one counter, zero surprises.",
    blurb: "Thread lifecycle, race conditions, synchronized and volatile, executors, locks, atomics, CompletableFuture and deadlocks.",
  },
  {
    id: "spring",
    name: "Spring Boot",
    emoji: "🌱",
    tagline: "The framework that writes half your application.",
    blurb: "IoC and dependency injection, bean scopes and lifecycle, auto-configuration, REST controllers, exception handling, profiles and @Transactional.",
  },
  {
    id: "microservices",
    name: "Microservices",
    emoji: "🛰️",
    tagline: "Small services, big failure modes.",
    blurb: "API gateway, service discovery, circuit breakers, config server, sync vs async messaging, sagas and observability.",
  },
  {
    id: "database",
    name: "SQL, JPA & Hibernate",
    emoji: "🗄️",
    tagline: "Where the data lives, and how not to lose it.",
    blurb: "ACID, isolation levels, joins, indexes, normalization, JPA entity states, lazy loading, the N+1 problem and caching.",
  },
  {
    id: "testing",
    name: "Testing",
    emoji: "🧪",
    tagline: "Prove it works before production does.",
    blurb: "JUnit 5, Mockito mocks and spies, Spring test slices, MockMvc, Testcontainers, TDD and what coverage really tells you.",
  },
  {
    id: "git",
    name: "Git",
    emoji: "🌿",
    tagline: "A time machine you can't afford to break.",
    blurb: "The three areas, merge vs rebase, reset vs revert, stash, conflicts and the branching workflow teams actually use.",
  },
  {
    id: "agile",
    name: "Agile & Delivery",
    emoji: "🏃",
    tagline: "How the code gets from a ticket to production.",
    blurb: "Scrum roles and ceremonies, Kanban, story points, Jira and Confluence, Waterfall vs Agile and the DevOps pipeline.",
  },
];

export function getWorld(id) {
  return WORLDS.find((w) => w.id === id) || null;
}
