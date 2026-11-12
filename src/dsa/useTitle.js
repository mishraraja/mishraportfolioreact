import { useEffect } from "react";

const SITE_TITLE = "Raja Mishra | Java Backend Developer";
const FALLBACK_DESCRIPTION = "Raja Mishra is a Java backend developer with 5+ years building reliable Spring Boot services using Kafka, PostgreSQL and AWS. Explore his work and projects.";

function setMeta(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.setAttribute("content", value);
}

/** Keeps each client-rendered route's search and social metadata in sync. */
export function useTitle(title, description = FALLBACK_DESCRIPTION) {
  useEffect(() => {
    const brandedTitle = title.includes("Raja Mishra") ? title : `${title} | Raja Mishra`;
    const conciseDescription = String(description || FALLBACK_DESCRIPTION).replace(/\s+/g, " ").trim().slice(0, 155);
    document.title = brandedTitle;
    setMeta('meta[name="description"]', conciseDescription);
    setMeta('meta[property="og:title"]', brandedTitle);
    setMeta('meta[property="og:description"]', conciseDescription);
    setMeta('meta[name="twitter:title"]', brandedTitle);
    setMeta('meta[name="twitter:description"]', conciseDescription);
    return () => {
      document.title = SITE_TITLE;
      setMeta('meta[name="description"]', FALLBACK_DESCRIPTION);
      setMeta('meta[property="og:title"]', SITE_TITLE);
      setMeta('meta[property="og:description"]', FALLBACK_DESCRIPTION);
      setMeta('meta[name="twitter:title"]', SITE_TITLE);
      setMeta('meta[name="twitter:description"]', FALLBACK_DESCRIPTION);
    };
  }, [title, description]);
}
