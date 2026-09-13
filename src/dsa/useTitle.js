import { useEffect } from "react";

const SITE_TITLE = "Raja Mishra — Java Backend Developer";

/** Sets the tab title while a page is mounted, then hands it back. */
export function useTitle(title) {
  useEffect(() => {
    document.title = title;
    return () => {
      document.title = SITE_TITLE;
    };
  }, [title]);
}
