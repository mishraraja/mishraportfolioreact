/* Collections — concept cards and the boss fight. */

export const concepts = [
  {
    id: "collection-map",
    title: "The collections family",
    emoji: "🗺️",
    simple:
      "Three kinds of container. A List is the queue at a ticket counter: order matters, duplicates are fine. A Set is a guest list: nobody gets in twice. A Map is a coat check: hand in a ticket, get your coat back.",
    points: [
      "`Iterable` → `Collection` → **List**, **Set**, **Queue/Deque**. **Map is not a Collection.**",
      "Lists: `ArrayList`, `LinkedList`. Sets: `HashSet`, `LinkedHashSet`, `TreeSet`.",
      "Queues: `ArrayDeque` (stack or queue), `PriorityQueue` (a heap).",
      "Maps: `HashMap`, `LinkedHashMap`, `TreeMap`, `ConcurrentHashMap`.",
      "`Collection` is the interface; `Collections` is the utility class (`sort`, `unmodifiableList`, `synchronizedMap`).",
    ],
    code: `List<String> cart = new ArrayList<>();         // ordered, duplicates allowed
Set<String> tags = new HashSet<>();            // unique, no order
Set<String> sortedTags = new TreeSet<>();      // unique, sorted
Map<Long, Order> byId = new HashMap<>();       // key -> value
Deque<Task> undo = new ArrayDeque<>();         // stack: faster than Stack
Queue<Job> jobs = new PriorityQueue<>(Comparator.comparingInt(Job::priority));`,
    say: "Lists keep order and allow duplicates, Sets keep elements unique, Maps associate keys with values and aren't Collections, and Collections is just the helper class.",
    trap: "“Does Map extend Collection?” No. It has `keySet()`, `values()` and `entrySet()` views that are collections.",
  },
  {
    id: "hashmap-internals",
    title: "How HashMap works inside",
    emoji: "🧮",
    hot: true,
    lab: "hashmap",
    simple:
      "A HashMap is a row of lockers. The key's hash picks the locker number. If two keys get the same locker they share it in a little chain. When the lockers are 75% full, the building doubles in size and everyone moves.",
    points: [
      "An array of buckets. **Default capacity 16, load factor 0.75** — it resizes past 12 entries, doubling the table.",
      "Bucket index = `(n - 1) & (h ^ (h >>> 16))`: the high bits are mixed in, then masked, because `n` is a power of two.",
      "**put**: find the bucket, walk it comparing hash then `equals()`. A match replaces the value; otherwise a node is appended.",
      "Collisions form a linked list. Since Java 8, a bucket with **8+ nodes becomes a red-black tree** (once the table has 64+ buckets), so the worst case is O(log n), not O(n).",
      "One `null` key is allowed (bucket 0). Not thread-safe; iteration order isn't guaranteed.",
    ],
    code: `Map<String, Integer> stock = new HashMap<>();   // 16 buckets, resizes after 12 entries
stock.put("pen", 10);                 // hash("pen") -> bucket -> new node
stock.put("pen", 12);                 // equals() matches: value replaced, size unchanged
stock.merge("ink", 5, Integer::sum);  // insert or combine in one call

// "Aa" and "BB" share a hashCode (2112): a guaranteed collision
System.out.println("Aa".hashCode() == "BB".hashCode());   // true`,
    say: "HashMap hashes the key to a bucket, resolves collisions with a chain that turns into a red-black tree past eight nodes, and doubles its table once size exceeds capacity times 0.75.",
    trap: "“Why is the capacity always a power of two?” So `(n - 1) & hash` can replace a slow modulo and still use every bucket.",
  },
  {
    id: "arraylist-linkedlist",
    title: "ArrayList vs LinkedList",
    emoji: "🚃",
    hot: true,
    simple:
      "ArrayList is a row of numbered seats: jump straight to seat 500, but squeezing someone in at the front makes everyone shuffle along. LinkedList is a conga line: easy to join in the middle once you're there, but finding person 500 means counting from the start.",
    points: [
      "**ArrayList**: a resizable array. `get(i)` is **O(1)**; `add` at the end is amortised O(1) (grows by 50%); insert or remove in the middle is O(n).",
      "**LinkedList**: doubly linked nodes. `get(i)` is **O(n)**; add or remove at either end is O(1).",
      "LinkedList's cheap insert only counts once you're *at* the position — getting there is O(n).",
      "Every LinkedList node costs extra memory and scatters across the heap, which is slow for the CPU cache.",
      "Default to ArrayList. Need a queue or stack? Use **ArrayDeque**.",
    ],
    code: `List<Integer> ids = new ArrayList<>(10_000);  // pre-size when you know the count
ids.get(5_000);                               // O(1): straight into the array
ids.add(0, 42);                               // O(n): shifts every element right

Deque<Integer> queue = new ArrayDeque<>();    // a queue? not LinkedList
queue.offerLast(1);
queue.pollFirst();`,
    say: "ArrayList gives O(1) random access and cache-friendly iteration; LinkedList only wins when inserting at a position you're already holding, so ArrayList — or ArrayDeque for queues — is my default.",
    trap: "“On a `List<Integer>`, does `list.remove(1)` remove the value 1?” No, the element at index 1. Use `list.remove(Integer.valueOf(1))` for the value.",
  },
  {
    id: "sets-and-sorted",
    title: "HashSet, LinkedHashSet, TreeSet",
    emoji: "🎟️",
    simple:
      "All three are guest lists with no duplicates. HashSet is a bag: fast, no order. LinkedHashSet remembers who arrived first. TreeSet keeps everyone sorted.",
    points: [
      "**HashSet is a HashMap in disguise**: your elements are the keys, and every value is one shared dummy object.",
      "**LinkedHash*** keeps insertion order. `LinkedHashMap` in *access order* plus `removeEldestEntry` is a ready-made **LRU cache**.",
      "**TreeSet / TreeMap** are red-black trees: O(log n), always sorted, with `floor`, `ceiling`, `headMap` and `tailMap`.",
      "Tree collections need `Comparable` elements or a `Comparator`, and don't accept `null` keys.",
    ],
    code: `class LruCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;

    LruCache(int capacity) {
        super(16, 0.75f, true);          // true = order by access, not insertion
        this.capacity = capacity;
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity;        // evict the least recently used entry
    }
}

TreeMap<Integer, String> taxSlabs = new TreeMap<>(Map.of(0, "0%", 400_000, "5%", 800_000, "10%"));
taxSlabs.floorEntry(520_000).getValue();   // "5%"`,
    say: "HashSet is backed by a HashMap, so it's O(1) and unordered; LinkedHash collections keep insertion or access order, which gives an LRU cache; Tree collections keep keys sorted in O(log n).",
    trap: "“How does HashSet reject duplicates?” `add` calls `map.put(element, PRESENT)`; if hashCode and equals find an existing key, put returns the old value and add returns false.",
  },
  {
    id: "comparable-comparator",
    title: "Comparable vs Comparator",
    emoji: "⚖️",
    hot: true,
    simple:
      "Comparable is an object's own natural way to line up, like sorting people by the date of birth on their ID. A Comparator is an outside judge you bring in for a different contest: by height today, by name tomorrow.",
    points: [
      "**Comparable**: `compareTo` lives *inside* the class and defines its one natural order (`String`, `Integer`, `LocalDate`).",
      "**Comparator**: a separate object, so you can have many orders. Build them with `comparing`, `thenComparing` and `reversed`.",
      "Never compare by subtracting (`a - b`): it overflows. Use `Integer.compare`.",
      "`TreeSet` and `TreeMap` treat `compare == 0` as a *duplicate*, whatever `equals` says.",
    ],
    code: `record Employee(String name, String dept, int salary) implements Comparable<Employee> {
    @Override
    public int compareTo(Employee other) {
        return name.compareTo(other.name);     // the natural order: by name
    }
}

employees.sort(Comparator
    .comparing(Employee::dept)
    .thenComparing(Employee::salary, Comparator.reverseOrder()));

// Never: (a, b) -> a.salary() - b.salary()   overflows for large values`,
    say: "Comparable defines one natural order inside the class; Comparator defines any number of external orders and composes with thenComparing.",
    trap: "“A TreeSet ordered only by salary gets two people with the same salary?” The second is silently dropped: compare returned 0, so it counts as a duplicate.",
  },
  {
    id: "fail-fast",
    title: "Fail-fast vs fail-safe iterators",
    emoji: "🚦",
    simple:
      "A fail-fast iterator is a strict librarian: rearrange the shelf while they're counting and they stop and shout. A fail-safe iterator counts from a photo of the shelf, so your changes don't disturb them — and don't show up either.",
    points: [
      "ArrayList and HashMap iterators track a **modCount** and throw **ConcurrentModificationException** when it changes underneath them.",
      "That happens even on **one thread** — remove inside a for-each loop and you'll see it.",
      "To remove while looping, use `removeIf` or `Iterator.remove()`.",
      "**CopyOnWriteArrayList** iterates a snapshot, and every write copies the array: great for rarely changing listener lists.",
      "**ConcurrentHashMap** iterators are *weakly consistent*: no exception, and they may or may not see concurrent updates.",
    ],
    code: `List<String> names = new ArrayList<>(List.of("asha", "bo", "cy"));

for (String n : names) {
    if (n.equals("asha")) names.remove(n);   // ConcurrentModificationException
}

names.removeIf(n -> n.startsWith("b"));     // the right way

Iterator<String> it = names.iterator();     // or explicitly
while (it.hasNext()) {
    if (it.next().startsWith("c")) it.remove();
}`,
    say: "Fail-fast iterators compare a modification count and throw ConcurrentModificationException; concurrent collections iterate a snapshot or a weakly consistent view — and to remove while looping I use removeIf.",
    trap: "“Does ConcurrentModificationException mean several threads?” No. One thread removing from a list inside its own for-each loop is enough.",
  },
  {
    id: "concurrenthashmap",
    title: "ConcurrentHashMap",
    emoji: "🚻",
    hot: true,
    simple:
      "Hashtable is one bathroom key for the whole office. ConcurrentHashMap gives every row of cubicles its own key: readers never wait, and writers only queue for their own row.",
    points: [
      "`Hashtable` and `Collections.synchronizedMap` lock the **whole map** on every call.",
      "ConcurrentHashMap (Java 8+) **reads without locking**, uses CAS to fill an empty bucket and locks only that **one bucket** on a collision.",
      "**No null keys or values**: `get` returning null has to mean “absent”.",
      "Use the atomic compound operations — `putIfAbsent`, `computeIfAbsent`, `merge`. Check-then-act is still a race.",
      "`size()` is only an estimate while other threads are writing.",
    ],
    code: `ConcurrentHashMap<String, LongAdder> hits = new ConcurrentHashMap<>();

// Race: two threads can both see "absent", and one count is lost
// if (!hits.containsKey(url)) hits.put(url, new LongAdder());

hits.computeIfAbsent(url, k -> new LongAdder()).increment();   // atomic per key

ConcurrentHashMap<String, Integer> totals = new ConcurrentHashMap<>();
totals.merge(sku, qty, Integer::sum);                            // atomic insert-or-add`,
    say: "ConcurrentHashMap reads without locks, locks only the bucket being written, rejects nulls and gives atomic compute and merge — which I use instead of check-then-act.",
    trap: "“Is every operation on a ConcurrentHashMap thread-safe, so my code is too?” Single calls are, but `if (!map.containsKey(k)) map.put(k, v)` is two calls — still a race.",
  },
  {
    id: "immutable-collections",
    title: "Immutable, unmodifiable, fixed-size",
    emoji: "🧊",
    simple:
      "`List.of` is a laminated menu: no scribbling. `Collections.unmodifiableList` is a glass case over a menu the chef can still edit. `Arrays.asList` has a fixed number of lines: you can change a line, but not add one.",
    points: [
      "`List.of`, `Set.of` and `Map.of` (Java 9) are **truly immutable** and **reject nulls**; `Set.of` and `Map.of` also reject duplicates.",
      "`Collections.unmodifiableList(list)` is a read-only **view** — changes to the original show through.",
      "`Arrays.asList` is **fixed-size**: `set` works, `add` and `remove` throw `UnsupportedOperationException`.",
      "`List.copyOf` and `stream().toList()` give you unmodifiable copies.",
    ],
    code: `List<String> fixed = Arrays.asList("a", "b");
fixed.set(0, "z");        // fine: writes through to the backing array
fixed.add("c");           // UnsupportedOperationException

List<String> frozen = List.of("a", "b");
frozen.set(0, "z");       // UnsupportedOperationException
List.of("a", null);       // NullPointerException

List<String> source = new ArrayList<>(List.of("a"));
List<String> view = Collections.unmodifiableList(source);
source.add("b");
System.out.println(view); // [a, b] – a view, not a copy`,
    say: "List.of is truly immutable and null-hostile, unmodifiableList is a read-only view over a list that can still change, and Arrays.asList is fixed-size but writable.",
    trap: "“Is a `final List` immutable?” No. `final` only stops you reassigning the variable.",
  },
  {
    id: "collection-complexity",
    title: "Complexity cheat card",
    emoji: "⏱️",
    simple: "Before you pick a collection, ask which operation you'll be doing a million times — then pick the one that makes that operation cheap.",
    points: [
      "**ArrayList** — get O(1) · add at end O(1)* · insert/remove middle O(n) · contains O(n)",
      "**LinkedList** — get O(n) · add/remove at the ends O(1) · contains O(n)",
      "**HashMap / HashSet** — get, put, contains O(1) average · O(log n) worst case in a treeified bucket",
      "**TreeMap / TreeSet** — get, put, remove O(log n) · always sorted",
      "**PriorityQueue** — offer, poll O(log n) · peek O(1) · contains O(n)",
      "**ArrayDeque** — push, pop, offer, poll at either end O(1)*",
    ],
    say: "I pick collections by their hot operation: HashMap for lookups by key, ArrayList for indexed reads, ArrayDeque for queues and stacks, TreeMap when order matters and PriorityQueue for top-k.",
    trap: "“What's `contains` on a PriorityQueue?” O(n). A heap only knows where its smallest element is.",
  },
];

export const boss = [
  {
    q: "A new HashMap has capacity 16 and load factor 0.75. Which put() makes the table resize?",
    options: ["The 12th", "The 13th", "The 16th", "The 17th"],
    answer: 1,
    why: "The threshold is 16 × 0.75 = 12. HashMap resizes once size goes above the threshold, so the 13th entry doubles the table to 32.",
  },
  {
    q: "Two different keys have the same hashCode. What does HashMap do?",
    options: [
      "Overwrites the first key",
      "Keeps both in the same bucket and uses equals() to tell them apart",
      "Throws an exception",
      "Rehashes the second key with a different function",
    ],
    answer: 1,
    why: "That's a collision. Both nodes live in one bucket's chain (or tree), and lookups walk it comparing hash and equals.",
  },
  {
    q: "You remove the first element inside a for-each loop over an ArrayList. What happens?",
    options: ["IllegalStateException", "ConcurrentModificationException", "IndexOutOfBoundsException", "It works fine"],
    answer: 1,
    why: "The iterator notices modCount changed on its next call to next(). Use removeIf or Iterator.remove instead.",
  },
  {
    q: "Why does ConcurrentHashMap reject null keys and values?",
    options: [
      "Nulls break the hash function",
      "get() returning null must unambiguously mean “absent” while other threads write",
      "Only for compatibility with Hashtable",
      "Nulls take too much memory",
    ],
    answer: 1,
    why: "With nulls allowed you couldn't tell “absent” from “mapped to null”, and a follow-up containsKey could already be out of date.",
  },
  {
    q: "You need keys kept in sorted order, with floorKey() lookups. Which map?",
    options: ["HashMap", "LinkedHashMap", "TreeMap", "ConcurrentHashMap"],
    answer: 2,
    why: "TreeMap is a red-black tree: always sorted, with floor, ceiling, headMap and tailMap in O(log n).",
  },
];
