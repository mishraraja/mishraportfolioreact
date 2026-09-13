import { profile } from "../data/profile";

/**
 * Anyone who opens DevTools on a developer portfolio is a peer. Greet them
 * properly, and give them a real function to call.
 *
 * @param {(id: string) => void} unlock  achievement unlocker from context
 */
export function installConsoleEgg(unlock) {
  if (typeof window === "undefined" || window.__rmConsoleEgg) return;
  window.__rmConsoleEgg = true;

  const accent = "color:#8b7bff;font-weight:700";
  const muted = "color:#9a99a6";
  const mono = "font-family:monospace;color:#6cd39a";

  /* eslint-disable no-console */
  console.log(
    "%c\n" +
      "  ██████╗  █████╗      ██╗ █████╗ \n" +
      "  ██╔══██╗██╔══██╗     ██║██╔══██╗\n" +
      "  ██████╔╝███████║     ██║███████║\n" +
      "  ██╔══██╗██╔══██║██   ██║██╔══██║\n" +
      "  ██║  ██║██║  ██║╚█████╔╝██║  ██║\n" +
      "  ╚═╝  ╚═╝╚═╝  ╚═╝ ╚════╝ ╚═╝  ╚═╝\n",
    accent
  );

  console.log(
    "%cYou opened the console. Of course you did.%c\n\n" +
      "This site is React 18 + framer-motion, no UI kit, no chart library,\n" +
      "no confetti package. The audio is synthesised with WebAudio at runtime,\n" +
      "the particles are hand-rolled canvas, and the API console is a\n" +
      "Spring-Boot-shaped service running entirely in this tab.\n",
    "color:#f4f3ee;font-size:13px;font-weight:600",
    muted
  );

  console.log("%cTry these:", "color:#ffb454;font-weight:600");
  console.log("%c  hire()        %c open a conversation", mono, muted);
  console.log("%c  secrets()     %c list every hidden feature", mono, muted);
  console.log("%c  whoami()      %c the short version", mono, muted);

  window.hire = function hire() {
    window.location.href = "mailto:" + profile.social.email + "?subject=Let%27s%20work%20together";
    return "Opening your mail client. Good call.";
  };

  window.whoami = function whoami() {
    return {
      name: profile.name,
      role: profile.roles[0],
      experience: profile.yearsExperience + "+ years",
      openToWork: profile.openToWork,
      links: profile.social,
    };
  };

  window.secrets = function secrets() {
    return [
      "Backtick (`) opens a working shell",
      "Cmd/Ctrl+K opens the command palette",
      "T cycles five colour themes",
      "The Konami code boots a CRT",
      "Type 'chess' anywhere for a mate-in-one",
      "The API console has a 403 endpoint worth reading",
      "Stand still for a minute and the site talks to you",
    ];
  };

  // Reward the curiosity — but only once the panel is actually open.
  const probe = new Image();
  Object.defineProperty(probe, "id", {
    get() {
      unlock("inspector");
      return "devtools";
    },
  });
  console.log("%c", probe);
  /* eslint-enable no-console */
}
