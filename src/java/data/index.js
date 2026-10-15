import { WORLDS } from "./worlds";
import * as coreJava from "./topics/core-java";
import * as oop from "./topics/oop";
import * as collections from "./topics/collections";
import * as concurrency from "./topics/concurrency";
import * as spring from "./topics/spring";
import * as microservices from "./topics/microservices";
import * as database from "./topics/database";
import * as testing from "./topics/testing";
import * as git from "./topics/git";
import * as agile from "./topics/agile";

const TOPICS = {
  "core-java": coreJava,
  oop,
  collections,
  concurrency,
  spring,
  microservices,
  database,
  testing,
  git,
  agile,
};

/** Every concept card, tagged with the world it belongs to, in world order. */
export const CONCEPTS = WORLDS.flatMap((w) => TOPICS[w.id].concepts.map((c) => ({ ...c, world: w.id })));

export function conceptsInWorld(worldId) {
  return CONCEPTS.filter((c) => c.world === worldId);
}

export function getConcept(id) {
  return CONCEPTS.find((c) => c.id === id) || null;
}

export function bossFor(worldId) {
  return (TOPICS[worldId] && TOPICS[worldId].boss) || [];
}
