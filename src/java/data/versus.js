/**
 * This or That: the comparisons interviewers love. Each pair has a handful of
 * clues; a clue's answer is "a" or "b".
 */
export const VERSUS = [
  {
    world: "collections",
    a: "ArrayList",
    b: "LinkedList",
    clues: [
      { text: "get(5000) runs in constant time", answer: "a", why: "It's backed by an array, so an index goes straight to the slot." },
      { text: "Also implements Deque, so it works as a queue", answer: "b", why: "LinkedList implements both List and Deque. ArrayList is only a List." },
      { text: "Uses less memory per element", answer: "a", why: "Every LinkedList node carries two extra references, for next and previous." },
    ],
  },
  {
    world: "collections",
    a: "HashMap",
    b: "Hashtable",
    clues: [
      { text: "Accepts one null key", answer: "a", why: "Hashtable throws NullPointerException for null keys and values." },
      { text: "Every public method is synchronized", answer: "b", why: "It's the legacy thread-safe map. Today you'd use ConcurrentHashMap." },
      { text: "Turns long collision chains into red-black trees", answer: "a", why: "Java 8 added treeification to HashMap only." },
    ],
  },
  {
    world: "collections",
    a: "HashMap",
    b: "TreeMap",
    clues: [
      { text: "Iterates its keys in sorted order", answer: "b", why: "TreeMap is a red-black tree ordered by the keys." },
      { text: "O(1) average get and put", answer: "a", why: "Hashing jumps straight to a bucket; a tree needs O(log n)." },
      { text: "Offers floorKey() and ceilingKey()", answer: "b", why: "TreeMap is a NavigableMap, so it can find the nearest keys." },
    ],
  },
  {
    world: "collections",
    a: "Comparable",
    b: "Comparator",
    clues: [
      { text: "compareTo() lives inside the class being sorted", answer: "a", why: "Comparable defines the class's one natural order." },
      { text: "Sorts the same class five different ways", answer: "b", why: "Each Comparator is a separate ordering you can pass around." },
      { text: "Chains tie-breakers with thenComparing()", answer: "b", why: "Comparator has the composition methods: comparing, thenComparing, reversed." },
    ],
  },
  {
    world: "core-java",
    a: "Checked exception",
    b: "Unchecked exception",
    clues: [
      { text: "IOException", answer: "a", why: "It extends Exception but not RuntimeException, so the compiler makes you handle it." },
      { text: "IllegalArgumentException", answer: "b", why: "It's a RuntimeException: a caller's bug, not a condition to plan for." },
      { text: "@Transactional rolls back on it by default", answer: "b", why: "Spring rolls back on RuntimeException and Error. Checked exceptions need rollbackFor." },
    ],
  },
  {
    world: "core-java",
    a: "String",
    b: "StringBuilder",
    clues: [
      { text: "Immutable", answer: "a", why: "Every String “change” returns a new String." },
      { text: "The right tool for appending inside a loop", answer: "b", why: "It grows one buffer instead of creating a new String every iteration." },
      { text: "Literals can be shared from the pool", answer: "a", why: "Only String has a pool — safe precisely because Strings can't change." },
    ],
  },
  {
    world: "oop",
    a: "Interface",
    b: "Abstract class",
    clues: [
      { text: "A class can have many of these", answer: "a", why: "Java allows implementing many interfaces but extending only one class." },
      { text: "Can have a constructor and instance fields", answer: "b", why: "Interfaces can't hold instance state; abstract classes can." },
      { text: "A lambda can implement it, if it has one abstract method", answer: "a", why: "That's a functional interface. Lambdas can't implement abstract classes." },
    ],
  },
  {
    world: "concurrency",
    a: "sleep()",
    b: "wait()",
    clues: [
      { text: "Releases the object's monitor while it waits", answer: "b", why: "wait() gives the monitor up so another thread can enter and notify." },
      { text: "Can be called without holding any lock", answer: "a", why: "wait() outside a synchronized block throws IllegalMonitorStateException." },
      { text: "Woken up early by notify()", answer: "b", why: "notify() and notifyAll() wake threads waiting on that object's monitor." },
    ],
  },
  {
    world: "concurrency",
    a: "synchronized",
    b: "ReentrantLock",
    clues: [
      { text: "Can give up after a timeout", answer: "b", why: "tryLock(timeout) returns false instead of waiting forever." },
      { text: "Released automatically when the block exits, even on an exception", answer: "a", why: "A ReentrantLock must be unlocked by you, in a finally block." },
      { text: "Can be created with a fairness policy", answer: "b", why: "new ReentrantLock(true) hands the lock to the longest-waiting thread." },
    ],
  },
  {
    world: "concurrency",
    a: "Runnable",
    b: "Callable",
    clues: [
      { text: "Returns a result", answer: "b", why: "call() returns V; run() returns void." },
      { text: "Can be passed straight to new Thread(...)", answer: "a", why: "Thread only accepts a Runnable. Callables go to an ExecutorService." },
      { text: "Its method may throw checked exceptions", answer: "b", why: "call() is declared throws Exception; run() isn't." },
    ],
  },
  {
    world: "concurrency",
    a: "volatile",
    b: "AtomicInteger",
    clues: [
      { text: "Makes count++ safe across threads", answer: "b", why: "incrementAndGet uses compare-and-swap. volatile only fixes visibility." },
      { text: "Perfect for a boolean stop flag read in a loop", answer: "a", why: "One writer, many readers who just need to see the latest value." },
    ],
  },
  {
    world: "spring",
    a: "@Component",
    b: "@Bean",
    clues: [
      { text: "Goes on a class you wrote", answer: "a", why: "Component scanning finds and registers annotated classes." },
      { text: "Registers an object from a library you can't annotate", answer: "b", why: "A @Bean method in a @Configuration class builds and returns it." },
      { text: "Goes on a method", answer: "b", why: "@Bean annotates factory methods; @Component annotates classes." },
    ],
  },
  {
    world: "spring",
    a: "singleton scope",
    b: "prototype scope",
    clues: [
      { text: "The default scope", answer: "a", why: "Unless you say otherwise, one instance per application context." },
      { text: "A new instance every time the bean is requested", answer: "b", why: "The container creates it, hands it over and forgets it." },
      { text: "Gets its @PreDestroy called when the context closes", answer: "a", why: "Spring doesn't track prototype instances, so it never destroys them." },
    ],
  },
  {
    world: "spring",
    a: "PUT",
    b: "POST",
    clues: [
      { text: "Idempotent: sending it twice leaves the same result", answer: "a", why: "Replacing a resource with the same content twice changes nothing more." },
      { text: "Usually creates a new resource under a collection, like /orders", answer: "b", why: "The server picks the new id and returns 201 Created." },
      { text: "Replaces the whole resource at a URL you already know", answer: "a", why: "PUT /orders/7 sends the full new state of order 7." },
    ],
  },
  {
    world: "microservices",
    a: "Circuit breaker",
    b: "Retry",
    clues: [
      { text: "Stops calling a failing service for a while", answer: "a", why: "Once OPEN, calls fail fast until the wait duration passes." },
      { text: "Should only wrap idempotent operations", answer: "b", why: "Retrying a non-idempotent call could charge a customer twice." },
    ],
  },
  {
    world: "microservices",
    a: "REST call",
    b: "Kafka event",
    clues: [
      { text: "The caller waits for the response", answer: "a", why: "It's synchronous: both services must be up at the same time." },
      { text: "Consumers can replay old messages", answer: "b", why: "Kafka retains messages, so a consumer can rewind its offset." },
      { text: "Ordering is guaranteed per partition", answer: "b", why: "Messages with the same key go to the same partition, in order." },
    ],
  },
  {
    world: "database",
    a: "INNER JOIN",
    b: "LEFT JOIN",
    clues: [
      { text: "Keeps employees who have no department", answer: "b", why: "LEFT keeps every left-side row and fills the right side with NULLs." },
      { text: "Returns only rows that match on both sides", answer: "a", why: "Unmatched rows on either side are dropped." },
      { text: "With WHERE d.id IS NULL, finds rows that have no match", answer: "b", why: "That's the anti-join pattern." },
    ],
  },
  {
    world: "database",
    a: "WHERE",
    b: "HAVING",
    clues: [
      { text: "Filters rows before GROUP BY", answer: "a", why: "WHERE runs on individual rows, before any grouping." },
      { text: "Can filter on COUNT(*) > 5", answer: "b", why: "Aggregates only exist after grouping, which is where HAVING runs." },
    ],
  },
  {
    world: "database",
    a: "FetchType.LAZY",
    b: "FetchType.EAGER",
    clues: [
      { text: "The default for @OneToMany", answer: "a", why: "Collections load only when you touch them." },
      { text: "The default for @ManyToOne", answer: "b", why: "To-one associations are EAGER by default — usually worth changing to LAZY." },
      { text: "Touch it after the session closes and get LazyInitializationException", answer: "a", why: "A lazy proxy needs an open persistence context to load itself." },
    ],
  },
  {
    world: "testing",
    a: "Mock",
    b: "Spy",
    clues: [
      { text: "Unstubbed methods return 0, false or null", answer: "a", why: "A mock has no real behaviour until you script it." },
      { text: "Unstubbed methods run the real code", answer: "b", why: "A spy wraps a real object." },
      { text: "Stub it with doReturn() so the real method never runs", answer: "b", why: "when(spy.method()) would call the real method while setting up." },
    ],
  },
  {
    world: "testing",
    a: "@WebMvcTest",
    b: "@SpringBootTest",
    clues: [
      { text: "Loads the whole application context", answer: "b", why: "Every bean, for full integration tests." },
      { text: "Loads only controllers, advice and filters", answer: "a", why: "It's the web slice. You mock the services." },
    ],
  },
  {
    world: "git",
    a: "git merge",
    b: "git rebase",
    clues: [
      { text: "Leaves existing commits exactly as they are", answer: "a", why: "Merge adds a merge commit but never rewrites what's there." },
      { text: "Gives your commits new hashes", answer: "b", why: "Each commit is replayed on top of the target as a new commit." },
      { text: "Safe on a branch others have already pulled", answer: "a", why: "Rewriting shared history breaks everyone else's copy." },
    ],
  },
  {
    world: "git",
    a: "git reset",
    b: "git revert",
    clues: [
      { text: "Adds a new commit that undoes an old one", answer: "b", why: "History stays intact, with the undo recorded on top." },
      { text: "With --hard, throws away uncommitted changes", answer: "a", why: "reset --hard makes the working tree match the target commit." },
      { text: "Safe to use on a shared main branch", answer: "b", why: "It doesn't rewrite commits that others already have." },
    ],
  },
  {
    world: "agile",
    a: "Scrum",
    b: "Kanban",
    clues: [
      { text: "Work is planned in fixed-length sprints", answer: "a", why: "Scrum runs in time-boxed sprints of 1–4 weeks." },
      { text: "Limits work in progress per column", answer: "b", why: "WIP limits are Kanban's core mechanism." },
      { text: "Has a defined Scrum Master accountability", answer: "a", why: "Kanban defines no roles." },
    ],
  },
];
