/**
 * The secret hunt. Every interaction worth finding is registered here, so the
 * HUD, the toast and the trophy case all read from one list.
 *
 * `hint` is shown in the trophy case before the secret is found — vague enough
 * to stay a puzzle, specific enough to be findable.
 */

export const ACHIEVEMENTS = [
  {
    id: "first-contact",
    name: "First Contact",
    icon: "👋",
    desc: "Landed on the site and scrolled past the fold.",
    hint: "Just start scrolling.",
  },
  {
    id: "commander",
    name: "Commander",
    icon: "⌘",
    desc: "Opened the command palette.",
    hint: "Every good app has a ⌘K.",
  },
  {
    id: "shell-access",
    name: "Shell Access",
    icon: "▸",
    desc: "Opened the terminal and ran a command.",
    hint: "Backtick (`) is a key for a reason.",
  },
  {
    id: "api-caller",
    name: "API Caller",
    icon: "⚡",
    desc: "Sent a request to the live API console.",
    hint: "There's a REST API on this page. Call it.",
  },
  {
    id: "endpoint-explorer",
    name: "Endpoint Explorer",
    icon: "🛰",
    desc: "Called every endpoint in the API console.",
    hint: "One request is not enough. Try them all.",
  },
  {
    id: "chromatic",
    name: "Chromatic",
    icon: "🎨",
    desc: "Tried every theme on the site.",
    hint: "The palette switcher has more than one stop.",
  },
  {
    id: "audiophile",
    name: "Audiophile",
    icon: "🔊",
    desc: "Turned the sound on. It's all synthesised live.",
    hint: "This site can make noise. Let it.",
  },
  {
    id: "konami",
    name: "Time Traveller",
    icon: "🕹",
    desc: "Entered the Konami code and booted 1983.",
    hint: "↑ ↑ ↓ ↓ ← → ← → B A",
  },
  {
    id: "grandmaster",
    name: "Grandmaster",
    icon: "♞",
    desc: "Solved the mate-in-one puzzle.",
    hint: "He plays chess. Ask him about it.",
  },
  {
    id: "inspector",
    name: "Inspector",
    icon: "🔍",
    desc: "Opened DevTools and read the console.",
    hint: "Developers always look under the hood.",
  },
  {
    id: "persistent",
    name: "Persistent",
    icon: "⏳",
    desc: "Stayed still long enough for the site to notice.",
    hint: "Do nothing at all for a while.",
  },
  {
    id: "closer",
    name: "The Closer",
    icon: "🤝",
    desc: "Copied the email address. The right move.",
    hint: "Contact section. One click, no typing.",
  },
];

export const TOTAL_ACHIEVEMENTS = ACHIEVEMENTS.length;

export function getAchievement(id) {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/** Ranks give the hunt a sense of progress instead of a bare counter. */
export function rankFor(count) {
  const pct = count / TOTAL_ACHIEVEMENTS;
  if (count === 0) return "Visitor";
  if (pct < 0.25) return "Curious";
  if (pct < 0.5) return "Explorer";
  if (pct < 0.75) return "Power User";
  if (pct < 1) return "Archaeologist";
  return "Completionist";
}
