import { profile, focusAreas } from "../data/profile";
import { skillGroups } from "../data/skills";
import { projects } from "../data/projects";
import { experience } from "../data/experience";

/**
 * A Spring-Boot-shaped API that happens to run entirely in the browser.
 * Each endpoint returns the real content of this site, so the console is a
 * genuine second interface to the portfolio rather than a canned demo.
 */

const startedAt = Date.now();

function uptime() {
  const s = Math.floor((Date.now() - startedAt) / 1000);
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return h + ":" + m + ":" + sec;
}

export const ENDPOINTS = [
  {
    id: "health",
    method: "GET",
    path: "/api/v1/health",
    summary: "Service health and uptime",
    status: 200,
    handler: () => ({
      status: "UP",
      uptime: uptime(),
      components: {
        db: { status: "UP", details: { database: "PostgreSQL", validationQuery: "isValid()" } },
        diskSpace: { status: "UP", details: { free: "47.2 GB", threshold: "10 MB" } },
        kafka: { status: "UP", details: { brokers: 3, consumerLag: 0 } },
        ping: { status: "UP" },
      },
    }),
  },
  {
    id: "profile",
    method: "GET",
    path: "/api/v1/profile",
    summary: "Who you are talking to",
    status: 200,
    handler: () => ({
      name: profile.name,
      title: profile.roles[0],
      headline: profile.headline,
      yearsOfExperience: profile.yearsExperience,
      education: profile.education,
      openToWork: profile.openToWork,
      focusAreas: focusAreas.map((f) => ({ area: f.label, stack: f.detail })),
      interests: profile.hobbies,
      links: profile.social,
    }),
  },
  {
    id: "skills",
    method: "GET",
    path: "/api/v1/skills",
    summary: "The stack, grouped",
    status: 200,
    handler: () => ({
      totalSkills: skillGroups.reduce((n, g) => n + g.skills.length, 0),
      groups: skillGroups.map((g) => ({
        id: g.id,
        label: g.label,
        skills: g.skills.map((s) => s.name),
      })),
    }),
  },
  {
    id: "projects",
    method: "GET",
    path: "/api/v1/projects",
    summary: "Shipped work, newest first",
    status: 200,
    handler: () => ({
      page: 0,
      size: projects.length,
      totalElements: projects.length,
      content: projects.map((p) => ({
        id: p.id,
        title: p.title,
        role: p.role,
        period: p.period,
        stack: p.stack,
        featured: Boolean(p.featured),
        liveUrl: p.liveUrl || null,
      })),
    }),
  },
  {
    id: "experience",
    method: "GET",
    path: "/api/v1/experience",
    summary: "Professional history",
    status: 200,
    handler: () => ({
      totalYears: profile.yearsExperience,
      positions: experience.map((e) => ({
        role: e.role,
        period: e.period,
        summary: e.summary,
        highlights: e.highlights,
        stack: e.stack,
      })),
    }),
  },
  {
    id: "hire",
    method: "POST",
    path: "/api/v1/hire",
    summary: "Start a conversation",
    status: 201,
    body: {
      company: "your-company",
      role: "Backend Engineer",
      stack: ["Java", "Spring Boot", "Kafka"],
      message: "We are hiring and your work looks like a fit.",
    },
    handler: () => ({
      id: "req_" + Math.random().toString(36).slice(2, 12),
      status: "ACCEPTED",
      message: "Request received. He reads every one of these.",
      respondBy: new Date(Date.now() + 86400000).toISOString(),
      nextStep: "mailto:" + profile.social.email,
      _links: {
        self: { href: "/api/v1/hire" },
        resume: { href: profile.resumeUrl },
        linkedin: { href: profile.social.linkedin },
      },
    }),
  },
  {
    id: "secrets",
    method: "GET",
    path: "/api/v1/secrets",
    summary: "403 - but try anyway",
    status: 403,
    handler: () => ({
      timestamp: new Date().toISOString(),
      status: 403,
      error: "Forbidden",
      message: "Access denied. Hint: the Konami code still works in 2026.",
      path: "/api/v1/secrets",
      trace: [
        "at SecurityFilterChain.doFilter(SecurityConfig.java:42)",
        "at CuriosityInterceptor.preHandle(Curiosity.java:7)",
        "at YouFoundThis.reward(EasterEgg.java:1)",
      ],
    }),
  },
];

/** Simulated network latency, so responses feel like they travelled. */
export function callEndpoint(endpoint) {
  const latency = 40 + Math.round(Math.random() * 180);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        status: endpoint.status,
        latency,
        headers: {
          "content-type": "application/json",
          "x-powered-by": "Spring Boot 3.2.4",
          "x-response-time": latency + "ms",
          "cache-control": "no-cache, max-age=0",
        },
        body: endpoint.handler(),
      });
    }, latency);
  });
}

export function statusClass(status) {
  if (status >= 200 && status < 300) return "ok";
  if (status >= 300 && status < 400) return "redirect";
  if (status >= 400 && status < 500) return "client";
  return "server";
}

export function statusText(status) {
  const map = {
    200: "OK",
    201: "Created",
    202: "Accepted",
    204: "No Content",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    500: "Internal Server Error",
  };
  return map[status] || "Unknown";
}
