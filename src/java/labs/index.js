import { StringPoolLab } from "./StringPoolLab";
import { EqualsHashCodeLab } from "./EqualsHashCodeLab";
import { HashMapLab } from "./HashMapLab";
import { RaceLab } from "./RaceLab";
import { DeadlockLab } from "./DeadlockLab";
import { ThreadStatesLab } from "./ThreadStatesLab";
import { ThreadPoolLab } from "./ThreadPoolLab";
import { BeanLifecycleLab } from "./BeanLifecycleLab";
import { RequestJourneyLab } from "./RequestJourneyLab";
import { CircuitBreakerLab } from "./CircuitBreakerLab";
import { IsolationLab } from "./IsolationLab";
import { JoinLab } from "./JoinLab";
import { NPlusOneLab } from "./NPlusOneLab";
import { MockSpyLab } from "./MockSpyLab";
import { GitLab } from "./GitLab";
import { SprintLab } from "./SprintLab";

/**
 * Every lab: a hands-on toy for one hard idea. Missions turn "play with it"
 * into goals; each lab calls complete(missionId) as they're reached.
 */
export const LABS = [
  {
    id: "string-pool",
    world: "core-java",
    emoji: "🏨",
    title: "The String Hotel",
    blurb: "Book rooms with literals, new and intern(), then find out what == and equals() really compare.",
    missions: [
      { id: "same-object", text: "Make == true for two different variables" },
      { id: "equal-not-same", text: "Find two variables that are equals() but not ==" },
      { id: "intern", text: "Use intern() to reach a heap String's pooled twin" },
      { id: "immutable", text: "Try to change a String with + and check the original" },
    ],
    takeaways: [
      "Literals are shared from the pool; new String() always makes a new object.",
      "== compares references; equals() compares characters.",
      "Every String “change” returns a brand-new String.",
    ],
    Component: StringPoolLab,
  },
  {
    id: "equals-hashcode",
    world: "oop",
    emoji: "🔑",
    title: "The Lost Key",
    blurb: "Switch equals() and hashCode() on and off, then watch a HashSet store duplicates and lose your keys.",
    missions: [
      { id: "duplicate", text: "Get the same employee stored twice" },
      { id: "hash-only", text: "Override only hashCode() and still get a duplicate" },
      { id: "found", text: "Make contains(new Employee(7, \"Asha\")) return true" },
    ],
    takeaways: [
      "hashCode() picks the bucket; equals() confirms the match inside it.",
      "Equal objects must have equal hash codes — override both, from the same fields.",
    ],
    Component: EqualsHashCodeLab,
  },
  {
    id: "hashmap",
    world: "collections",
    emoji: "🧮",
    title: "Bucket Brigade",
    blurb: "Put keys into a real-math HashMap: see the hash, the bucket, collisions and the table doubling.",
    missions: [
      { id: "collision", text: "Put two keys into the same bucket" },
      { id: "resize", text: "Push the size past the load factor and trigger a resize" },
      { id: "overwrite", text: "Put an existing key and replace its value" },
      { id: "get", text: "get() a key and watch the walk through its bucket" },
    ],
    takeaways: [
      "Index = (n − 1) & (h ^ (h >>> 16)); capacity is always a power of two.",
      "The table doubles once size exceeds capacity × 0.75.",
      "Lookups compare the hash first, then call equals().",
    ],
    Component: HashMapLab,
  },
  {
    id: "race",
    world: "concurrency",
    emoji: "🏁",
    title: "The Lost Update",
    blurb: "Be the thread scheduler. Interleave two count++ calls until one vanishes, then fix it two ways.",
    missions: [
      { id: "lost-update", text: "Finish both threads with count = 1" },
      { id: "blocked", text: "With synchronized, make a thread wait at the lock" },
      { id: "cas-retry", text: "With AtomicInteger, make a compare-and-swap fail and retry" },
    ],
    takeaways: [
      "count++ is read, add, write — three steps that can interleave.",
      "synchronized makes the steps indivisible; atomics use compare-and-swap instead of locks.",
    ],
    Component: RaceLab,
  },
  {
    id: "deadlock",
    world: "concurrency",
    emoji: "🔐",
    title: "The Deadly Embrace",
    blurb: "Two transfers, two locks, one bad order. Create a deadlock, then escape it with ordering and tryLock.",
    missions: [
      { id: "deadlock", text: "Deadlock the two threads" },
      { id: "ordered", text: "Finish both transfers using lock ordering" },
      { id: "escape", text: "Finish both with tryLock after a thread backs off" },
    ],
    takeaways: [
      "Deadlock needs all four Coffman conditions; break one to prevent it.",
      "A global lock order breaks circular wait; tryLock with a timeout breaks hold-and-wait.",
    ],
    Component: DeadlockLab,
  },
  {
    id: "thread-states",
    world: "concurrency",
    emoji: "🔄",
    title: "A Thread's Life",
    blurb: "Push one thread through start(), sleep(), wait(), notify() and join() across all six states.",
    missions: [
      { id: "all-states", text: "Visit all six thread states" },
      { id: "notify-blocked", text: "See notify() lead to BLOCKED, not RUNNABLE" },
      { id: "double-start", text: "Trigger IllegalThreadStateException" },
    ],
    takeaways: [
      "BLOCKED waits for a monitor; WAITING waits for a signal; TIMED_WAITING waits for a timer.",
      "sleep() keeps locks; wait() releases the monitor.",
    ],
    Component: ThreadStatesLab,
  },
  {
    id: "thread-pool",
    world: "concurrency",
    emoji: "🍳",
    title: "The Task Kitchen",
    blurb: "Submit tasks to a ThreadPoolExecutor and discover the order it really uses: core, queue, max, reject.",
    missions: [
      { id: "queued", text: "Make a task wait in the queue" },
      { id: "grow", text: "Make the pool grow beyond its core size" },
      { id: "rejected", text: "Get a task rejected" },
      { id: "shrink", text: "Let keepAliveTime stop an idle extra thread" },
    ],
    takeaways: [
      "Core threads first, then the queue, then extra threads up to max, then rejection.",
      "An unbounded queue means the pool never grows past its core size.",
    ],
    Component: ThreadPoolLab,
  },
  {
    id: "bean-lifecycle",
    world: "spring",
    emoji: "🫘",
    title: "Birth of a Bean",
    blurb: "Put a Spring bean's lifecycle in order, then compare singleton and prototype scopes live.",
    missions: [
      { id: "order", text: "Put all nine lifecycle steps in order" },
      { id: "singleton-same", text: "Get the singleton twice and compare" },
      { id: "prototype-new", text: "Get the prototype twice and compare" },
      { id: "close", text: "Close the context and see who gets @PreDestroy" },
    ],
    takeaways: [
      "Instantiate → inject → aware → post-process → @PostConstruct → init → proxy → ready → @PreDestroy.",
      "Spring never calls destroy callbacks on prototype beans.",
    ],
    Component: BeanLifecycleLab,
  },
  {
    id: "request-journey",
    world: "spring",
    emoji: "🛎️",
    title: "Life of a Request",
    blurb: "Follow one HTTP request through filters, DispatcherServlet, a transactional service and back — five ways.",
    missions: [
      { id: "ok", text: "Deliver a 201 Created" },
      { id: "unauthorized", text: "Get stopped at the gate with a 401" },
      { id: "bad-request", text: "Fail validation with a 400" },
      { id: "not-found", text: "Map a missing order to a 404" },
      { id: "rollback", text: "Watch a transaction roll back into a 409" },
    ],
    takeaways: [
      "Security filters run before DispatcherServlet, so their rejections never reach your advice.",
      "Unchecked exceptions roll the transaction back; @RestControllerAdvice turns them into status codes.",
    ],
    Component: RequestJourneyLab,
  },
  {
    id: "circuit-breaker",
    world: "microservices",
    emoji: "⚡",
    title: "The Fuse Box",
    blurb: "Take the payment service down and watch a circuit breaker trip, fail fast and recover.",
    missions: [
      { id: "tripped", text: "Trip the breaker OPEN" },
      { id: "short-circuit", text: "Get a call short-circuited while OPEN" },
      { id: "recovered", text: "Recover through HALF_OPEN back to CLOSED" },
    ],
    takeaways: [
      "CLOSED counts failures; OPEN fails fast; HALF_OPEN tests recovery with a few calls.",
      "Failing fast stops one slow service from exhausting every caller's threads.",
    ],
    Component: CircuitBreakerLab,
  },
  {
    id: "isolation",
    world: "database",
    emoji: "🪟",
    title: "Two Tabs, One Row",
    blurb: "Step through two transactions at each isolation level and catch dirty, non-repeatable and phantom reads.",
    missions: [
      { id: "dirty", text: "Catch a dirty read" },
      { id: "non-repeatable", text: "Catch a non-repeatable read" },
      { id: "phantom", text: "Catch a phantom read" },
      { id: "prevented", text: "Run a scenario where the anomaly is prevented" },
    ],
    takeaways: [
      "READ COMMITTED stops dirty reads, REPEATABLE READ stops non-repeatable reads, SERIALIZABLE stops phantoms.",
      "Higher isolation buys correctness with throughput.",
    ],
    Component: IsolationLab,
  },
  {
    id: "joins",
    world: "database",
    emoji: "🔗",
    title: "Join the Tables",
    blurb: "Flip between INNER, LEFT, RIGHT and FULL joins and watch exactly which rows survive.",
    missions: [
      { id: "inner-left", text: "Compare INNER and LEFT JOIN" },
      { id: "anti", text: "Find employees with no valid department" },
      { id: "full", text: "Keep every row from both tables" },
    ],
    takeaways: [
      "INNER keeps matches; LEFT keeps every left row, with NULLs for missing matches.",
      "LEFT JOIN … WHERE right.id IS NULL finds rows with no match.",
    ],
    Component: JoinLab,
  },
  {
    id: "n-plus-one",
    world: "database",
    emoji: "🐌",
    title: "The Query Counter",
    blurb: "Run a report over up to 50 authors and count the SQL queries each fetch strategy fires.",
    missions: [
      { id: "n-plus-one", text: "Run the lazy loop over 20+ authors" },
      { id: "eager-trap", text: "Find out whether EAGER fixes it" },
      { id: "fixed", text: "Get it down to one query" },
      { id: "batch", text: "Try batch fetching with more than 10 authors" },
    ],
    takeaways: [
      "Touching a lazy collection in a loop is 1 + N queries.",
      "JOIN FETCH or @EntityGraph make it 1; @BatchSize makes it 1 + N/size. EAGER doesn't help.",
    ],
    Component: NPlusOneLab,
  },
  {
    id: "mock-spy",
    world: "testing",
    emoji: "🎬",
    title: "Stunt Doubles",
    blurb: "Test a PriceService with a mock and a spy, stub it two ways, and watch when the real database gets hit.",
    missions: [
      { id: "mock-default", text: "Get a default value from a mock" },
      { id: "spy-real", text: "Make a spy run real code" },
      { id: "when-trap", text: "Fall into the when() trap on a spy" },
      { id: "forty-five", text: "Make discounted(1) return 45.0" },
    ],
    takeaways: [
      "Mocks return defaults until stubbed; spies run real methods unless stubbed.",
      "Stub spies with doReturn().when() so the real method never runs.",
    ],
    Component: MockSpyLab,
  },
  {
    id: "git",
    world: "git",
    emoji: "🌿",
    title: "Git Time Machine",
    blurb: "A live commit graph: stage, commit, branch, merge, rebase, reset, revert and stash — and see every change.",
    missions: [
      { id: "first-commit", text: "Edit, stage and commit" },
      { id: "merge", text: "Merge feature into main" },
      { id: "rebase", text: "Rebase feature onto main" },
      { id: "undo-keep", text: "Undo a commit but keep its changes" },
      { id: "revert", text: "Undo a commit safely with revert" },
      { id: "stash", text: "Stash your work and bring it back" },
    ],
    takeaways: [
      "add moves changes to the index; commit snapshots the index; a branch is a movable label.",
      "Rebase rewrites commits with new hashes; revert adds an undo commit and rewrites nothing.",
    ],
    Component: GitLab,
  },
  {
    id: "sprint",
    world: "agile",
    emoji: "🏃",
    title: "Sprint Speedrun",
    blurb: "Run a Scrum sprint in the right order, then match every duty to the role that owns it.",
    missions: [
      { id: "timeline", text: "Put the sprint's moments in order" },
      { id: "roles", text: "Match all six duties to their roles" },
    ],
    takeaways: [
      "Planning → daily scrums → a Done increment → Review → Retrospective.",
      "Three accountabilities: Product Owner, Scrum Master, Developers.",
    ],
    Component: SprintLab,
  },
];

export function getLab(id) {
  return LABS.find((l) => l.id === id) || null;
}

export function labsInWorld(worldId) {
  return LABS.filter((l) => l.world === worldId);
}
