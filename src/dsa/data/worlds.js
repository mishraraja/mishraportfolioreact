/**
 * The arcade's worlds — the classic Blind 75 groupings, in the order most
 * people find easiest to learn them.
 */
export const WORLDS = [
  {
    id: "arrays",
    name: "Arrays & Hashing",
    emoji: "🧮",
    blurb: "Lookups, running totals, and the art of never looping twice.",
  },
  {
    id: "strings",
    name: "Strings",
    emoji: "🔤",
    blurb: "Windows that slide, pointers that meet, counts that match.",
  },
  {
    id: "lists",
    name: "Linked Lists",
    emoji: "🔗",
    blurb: "Rewiring pointers without ever dropping the chain.",
  },
  {
    id: "trees",
    name: "Trees & Tries",
    emoji: "🌳",
    blurb: "Recursion's natural habitat. Trust the smaller answer.",
  },
  {
    id: "graphs",
    name: "Graphs",
    emoji: "🕸️",
    blurb: "Islands, prerequisites, and who is connected to whom.",
  },
  {
    id: "matrix",
    name: "Matrix",
    emoji: "🧊",
    blurb: "Walk the grid, rotate it, search it — in place.",
  },
  {
    id: "intervals",
    name: "Intervals",
    emoji: "📅",
    blurb: "Sort by start or end, then sweep once.",
  },
  {
    id: "heaps",
    name: "Heaps",
    emoji: "⛰️",
    blurb: "Always know the smallest thing in the room, instantly.",
  },
  {
    id: "bits",
    name: "Binary",
    emoji: "💡",
    blurb: "Thinking in ones and zeros. XOR is your friend.",
  },
  {
    id: "dp",
    name: "Dynamic Programming",
    emoji: "🧩",
    blurb: "Big answers built from small answers you already remembered.",
  },
];

export function getWorld(id) {
  return WORLDS.find((w) => w.id === id);
}
