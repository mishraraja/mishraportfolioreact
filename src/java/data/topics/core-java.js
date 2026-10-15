/* Core Java — concept cards and the boss fight. */

export const concepts = [
  {
    id: "jdk-jre-jvm",
    title: "JDK vs JRE vs JVM",
    emoji: "📦",
    hot: true,
    simple:
      "The JDK is the whole kitchen, tools included. The JRE is just the stove and the pantry: enough to cook, nothing to build with. The JVM is the chef who reads the recipe (bytecode) and cooks it on whatever stove it's standing at.",
    points: [
      "`javac` (a JDK tool) compiles `.java` source into `.class` **bytecode**.",
      "The **JVM** loads classes, verifies the bytecode, then runs it — interpreting at first, then **JIT-compiling** hot methods to native code.",
      "**JRE = JVM + standard class libraries.** JDK = JRE + developer tools (`javac`, `jar`, `javap`, `jshell`, debugger).",
      "Bytecode is platform-independent; **the JVM itself is platform-specific**. That's what makes “write once, run anywhere” work.",
      "Since Java 11 there's no separate JRE download — `jlink` builds a trimmed runtime for your app instead.",
    ],
    code: `javac OrderService.java   # JDK tool: source -> bytecode (OrderService.class)
java OrderService         # the JVM loads, verifies and runs that bytecode
javap -c OrderService     # peek at the bytecode the JVM actually executes`,
    lang: "shell",
    say: "JDK is JRE plus dev tools, JRE is the JVM plus class libraries, and the JVM runs bytecode — the bytecode is portable, each OS gets its own JVM.",
    trap: "“Is the JVM platform-independent?” No. The bytecode is; the JVM is a native program built for each OS.",
  },
  {
    id: "jvm-memory",
    title: "Stack, heap and Metaspace",
    emoji: "🧠",
    hot: true,
    simple:
      "The stack is your desk: every method call gets a sticky note (a frame) that goes in the bin the moment the call returns. The heap is the warehouse where every object lives until nobody holds its ticket any more.",
    points: [
      "**Each thread has its own stack** of frames: local variables, primitives and *references*. Too-deep recursion → `StackOverflowError`.",
      "**The heap is shared by all threads** and holds every object and array. Run out → `OutOfMemoryError: Java heap space`.",
      "The heap is split into **young generation** (Eden + survivor spaces) and **old generation**, because most objects die young.",
      "**Metaspace** (Java 8+, replaced PermGen) holds class metadata in native memory. Static fields live with the `Class` object on the heap.",
      "The String pool moved onto the heap in Java 7.",
    ],
    code: `public class Checkout {
    static int ordersPlaced = 0;          // with the Class object, on the heap

    void place(int qty) {                 // a new stack frame for this call
        int total = qty * 100;            // primitive: lives in the frame
        Order order = new Order(total);   // reference in the frame,
                                          // the Order object on the heap
        ordersPlaced++;
    }                                     // frame popped: Order is now unreachable
}`,
    say: "Locals and references live on the calling thread's stack, objects live on the shared heap, and class metadata lives in Metaspace.",
    trap: "“Where does `Order order = new Order()` live?” Both places: the reference `order` is on the stack, the object it points at is on the heap.",
  },
  {
    id: "string-pool",
    title: "String pool & immutability",
    emoji: "🧵",
    hot: true,
    lab: "string-pool",
    simple:
      "The String pool is a shared rack of name badges. Write \"java\" twice and both variables wear the same badge. `new String(\"java\")` prints a brand-new badge that just happens to say the same thing.",
    points: [
      "String **literals are interned** into the pool; `new String(...)` always makes a new heap object.",
      "`==` compares **references** (same object?). `equals()` compares **content** (same characters?).",
      "Strings are **immutable**: `concat`, `replace`, `toUpperCase` all return a *new* String and leave the original alone.",
      "Immutability is what makes sharing safe: thread-safe for free, `hashCode` cached, safe as `HashMap` keys and for class names, URLs and passwords.",
      "Building strings in a loop? Use `StringBuilder`. (`StringBuffer` is the older, synchronized version.)",
    ],
    code: `String a = "java";               // goes into the String pool
String b = "java";               // same pooled object
String c = new String("java");   // brand-new object on the heap

System.out.println(a == b);          // true  – same reference
System.out.println(a == c);          // false – different objects
System.out.println(a.equals(c));     // true  – same characters
System.out.println(a == c.intern()); // true  – intern() hands back the pooled copy

String d = a.concat("!");        // a is untouched; d is a new String`,
    say: "Strings are immutable, which lets the JVM share literals in the pool safely — so always compare them with equals(), never ==.",
    trap: "“How many objects does `new String(\"hi\")` create?” Up to two: the pooled literal (if it isn't there yet) plus the new heap object.",
  },
  {
    id: "wrappers",
    title: "Wrappers, autoboxing & the Integer cache",
    emoji: "🎁",
    simple:
      "A primitive is a coin in your pocket. A wrapper is that coin in a labelled box, so it can go into a collection. Java boxes and unboxes for you — and keeps ready-made boxes for every number from -128 to 127.",
    points: [
      "**Autoboxing**: `Integer x = 5` compiles to `Integer.valueOf(5)`. **Unboxing**: `int y = x` compiles to `x.intValue()`.",
      "`Integer.valueOf` returns **cached objects for -128..127**, so `==` happens to work for small numbers and silently breaks at 128.",
      "Unboxing a `null` wrapper throws **NullPointerException** — a classic with `Map<String, Integer>.get()`.",
      "Collections and generics need objects: `List<Integer>`, never `List<int>`.",
      "Boxing inside hot loops creates garbage; prefer primitives or `IntStream` there.",
    ],
    code: `Integer a = 127, b = 127;
Integer c = 128, d = 128;
System.out.println(a == b);      // true  – both from the -128..127 cache
System.out.println(c == d);      // false – two separate objects
System.out.println(c.equals(d)); // true  – compare values with equals()

Map<String, Integer> stock = new HashMap<>();
int left = stock.get("pen");     // NullPointerException while unboxing`,
    say: "Autoboxing calls Integer.valueOf, which caches -128 to 127 — so compare wrappers with equals(), and watch for NPEs when unboxing null.",
    trap: "“`Integer a = 128, b = 128; a == b`?” false. Outside the cache they're two different objects.",
  },
  {
    id: "exceptions",
    title: "Checked vs unchecked exceptions",
    emoji: "🚨",
    hot: true,
    simple:
      "Checked exceptions are the weather forecast: foreseeable, so the compiler makes you carry an umbrella (catch it or declare it). Unchecked exceptions are tripping over your own shoelace: a bug to fix, not something to plan around.",
    points: [
      "`Throwable` splits into **`Error`** (OutOfMemoryError, StackOverflowError — don't catch) and **`Exception`**.",
      "**Checked** (`IOException`, `SQLException`): the compiler forces `try/catch` or `throws`.",
      "**Unchecked** = `RuntimeException` and its children (`NullPointerException`, `IllegalArgumentException`, `IllegalStateException`).",
      "`finally` always runs (unless the JVM dies). **try-with-resources** closes `AutoCloseable` resources automatically, in reverse order.",
      "`throw` raises one exception; `throws` declares what a method might raise. Spring's `@Transactional` rolls back on unchecked exceptions by default — **not** on checked ones.",
    ],
    code: `// Checked: the compiler makes you handle or declare it
String firstLine(Path path) throws IOException {
    try (BufferedReader in = Files.newBufferedReader(path)) { // closed for you
        return in.readLine();
    }
}

// Unchecked: the caller broke the rules, so fail fast
void withdraw(long amount) {
    if (amount <= 0) throw new IllegalArgumentException("amount must be positive");
}`,
    say: "Checked exceptions are recoverable conditions the compiler makes you handle; unchecked ones are programming errors — and @Transactional only rolls back on unchecked by default.",
    trap: "“Does `finally` run when `try` returns?” Yes. And a `return` inside `finally` overrides the original return value — so never return from `finally`.",
  },
  {
    id: "static-final",
    title: "static, final, finally, finalize",
    emoji: "🔒",
    simple:
      "`static` is one whiteboard shared by the whole class. `final` means written in pen: can't reassign it, can't override it, can't extend it. `finally` is the clean-up crew. `finalize` is a retired employee — don't call him.",
    points: [
      "**static** members belong to the class: one copy, no object needed. Static methods can't touch instance fields.",
      "**final variable**: assigned once. **final method**: can't be overridden. **final class**: can't be extended (`String` is final).",
      "A final *reference* is not an immutable *object*: a `final List` can still be added to.",
      "**static block** runs once, when the class is loaded.",
      "**finally** belongs to try/catch. **finalize()** is deprecated since Java 9 — use try-with-resources or `Cleaner`.",
    ],
    code: `class Invoice {
    static int issued = 0;          // one copy, shared by every Invoice
    final String number;            // set exactly once, in the constructor

    Invoice() { number = "INV-" + (++issued); }
}

final List<String> lines = new ArrayList<>();
lines.add("2 x coffee");            // fine: the list itself can change
// lines = new ArrayList<>();       // compile error: the reference is final`,
    say: "static means one per class, final means assign/override/extend once — and final locks the reference, not the object it points at.",
    trap: "“Can you override a static method?” No — you can only hide it. Which one runs is decided by the reference type at compile time.",
  },
  {
    id: "garbage-collection",
    title: "Garbage collection",
    emoji: "🧹",
    simple:
      "The garbage collector is a cleaner who throws out anything nobody is pointing at. Most objects die young, so the cleaner sweeps the small nursery (young generation) often and the big old-age home (old generation) rarely.",
    points: [
      "An object is garbage when it's **unreachable from GC roots**: stack locals, static fields, active threads, JNI references.",
      "**Minor GC** cleans the young generation (fast, frequent). Survivors get promoted to the old generation. **Major/Full GC** is slower.",
      "**G1** is the default collector since Java 9. **ZGC** and **Shenandoah** keep pauses in the low milliseconds for big heaps.",
      "`System.gc()` is only a hint. Size the heap with `-Xms` / `-Xmx`.",
      "**Java can still leak memory**: objects you forgot to drop stay reachable — ever-growing static maps, unremoved listeners, `ThreadLocal`s in pooled threads.",
    ],
    code: `class PriceCache {
    // A classic leak: a static map that only ever grows.
    private static final Map<String, BigDecimal> CACHE = new HashMap<>();

    BigDecimal price(String sku) {
        return CACHE.computeIfAbsent(sku, this::loadFromDb); // never evicted
    }
}
// Fix: bound it (e.g. Caffeine with maximumSize) or give entries an expiry.`,
    say: "The GC frees objects that are unreachable from GC roots, generationally because most objects die young — and a leak in Java is just a reference you forgot to drop.",
    trap: "“Can a Java app have a memory leak?” Yes. The GC can't collect what's still reachable, like entries in a static cache nobody evicts.",
  },
  {
    id: "generics",
    title: "Generics, erasure & PECS",
    emoji: "🏷️",
    simple:
      "Generics are labels on a box: `List<String>` means only strings go in, and the compiler checks the label. At runtime the labels are peeled off — that's type erasure.",
    points: [
      "Generics give **compile-time type safety** and remove casts.",
      "**Type erasure**: `List<String>` and `List<Integer>` are the same class at runtime, so no `new T()` and no `instanceof List<String>`.",
      "**PECS — Producer Extends, Consumer Super.** Read from `? extends T`; write into `? super T`.",
      "Bounded types: `<T extends Comparable<T>>` lets you call `compareTo` on T.",
    ],
    code: `// Producer extends: we only READ Numbers out of it
static double sum(List<? extends Number> nums) {
    double total = 0;
    for (Number n : nums) total += n.doubleValue();
    return total;
}

// Consumer super: we only WRITE Integers into it
static void addOnes(List<? super Integer> sink, int count) {
    for (int i = 0; i < count; i++) sink.add(1);
}

sum(List.of(1, 2.5, 3L));              // any Number subtype works
addOnes(new ArrayList<Number>(), 3);   // a List<Number> can take Integers`,
    say: "Generics are checked at compile time and erased at runtime; use extends when you read from a collection and super when you write into it — PECS.",
    trap: "“Why can't you add an Integer to `List<? extends Number>`?” It might really be a `List<Double>`, so the compiler only lets `null` in.",
  },
  {
    id: "streams",
    title: "Lambdas & the Stream API",
    emoji: "🌊",
    hot: true,
    simple:
      "A stream is a conveyor belt through a factory. Items pass stations (filter, map, sort), but the belt doesn't move until someone at the end asks for the finished product — the terminal operation.",
    points: [
      "A **lambda** implements a **functional interface** (one abstract method): `Predicate`, `Function`, `Consumer`, `Supplier`.",
      "**Intermediate** operations (`filter`, `map`, `sorted`, `distinct`) are **lazy**. **Terminal** operations (`collect`, `forEach`, `reduce`, `count`) run the pipeline.",
      "A stream **can't be reused** after a terminal operation.",
      "`map` turns one item into one item; `flatMap` turns one item into many and flattens them.",
      "Parallel streams share the common ForkJoinPool — measure before using, and never with blocking I/O.",
    ],
    code: `Map<String, Double> avgSalaryByDept = employees.stream()
    .filter(e -> e.salary() > 50_000)                     // lazy
    .collect(Collectors.groupingBy(
        Employee::dept,
        Collectors.averagingDouble(Employee::salary)));   // terminal: runs it

List<String> topThree = employees.stream()
    .sorted(Comparator.comparingDouble(Employee::salary).reversed())
    .limit(3)
    .map(Employee::name)
    .toList();`,
    say: "Streams are lazy pipelines: intermediate operations only describe the work, and nothing runs until a terminal operation like collect.",
    trap: "“What does `list.stream().peek(System.out::println).map(...)` print?” Nothing. With no terminal operation the pipeline never runs.",
  },
  {
    id: "optional-time",
    title: "Optional & java.time",
    emoji: "🎀",
    simple:
      "Optional is a gift box that might be empty. The type itself tells the caller “check before you unwrap”, instead of surprising them with a null later.",
    points: [
      "Create with `Optional.ofNullable(x)`. `Optional.of(null)` throws **NullPointerException**.",
      "Unwrap with `map`, `orElse`, `orElseGet`, `orElseThrow`, `ifPresent` — not `get()`.",
      "`orElse(x)` **always evaluates** x; `orElseGet(supplier)` only runs when empty.",
      "Use Optional for **return types**, not fields, parameters or collections.",
      "`LocalDate`, `LocalDateTime`, `ZonedDateTime`, `Instant` are **immutable and thread-safe** — unlike `Date` and `SimpleDateFormat`.",
    ],
    code: `Optional<User> user = userRepository.findByEmail(email);

String name = user.map(User::getName).orElse("Guest");
User found  = user.orElseThrow(() -> new UserNotFoundException(email));

user.orElse(createGuest());          // createGuest() runs every time
user.orElseGet(this::createGuest);   // runs only when there's no user`,
    say: "Optional makes “might be missing” part of the return type; prefer orElseGet for expensive defaults, and use java.time because it's immutable.",
    trap: "“orElse vs orElseGet?” `orElse(createDefault())` calls `createDefault()` even when a value is present.",
  },
  {
    id: "serialization",
    title: "Serialization & transient",
    emoji: "📮",
    simple:
      "Serialization packs an object flat into bytes so it can travel — to a file, a cache, another machine — and be unpacked later. `transient` fields stay behind, like leaving your house keys at home when you post a parcel.",
    points: [
      "Implement `Serializable` (a **marker interface** with no methods).",
      "Declare `serialVersionUID` yourself; a mismatch on read throws `InvalidClassException`.",
      "**`transient` and `static` fields are not serialized.**",
      "Native Java deserialization of untrusted data is a known security hole. Services talk JSON (Jackson) or Protobuf instead.",
    ],
    code: `class Session implements Serializable {
    private static final long serialVersionUID = 1L;

    private String userId;
    private transient String password;   // never written out
}`,
    say: "Serializable is a marker interface; pin serialVersionUID, mark secrets transient, and use JSON or Protobuf between services rather than native serialization.",
    trap: "“Are static fields serialized?” No — they belong to the class, not to the object being written.",
  },
  {
    id: "modern-java",
    title: "Records, sealed types & virtual threads",
    emoji: "🚀",
    simple:
      "Modern Java cuts the boilerplate. A record is a data class in one line. A sealed interface is a guest list: only the named types may implement it. Virtual threads are threads so cheap you can have a million.",
    points: [
      "**Records** (Java 16): immutable data carriers with constructor, accessors, `equals`, `hashCode` and `toString` generated.",
      "**Sealed** types (Java 17) restrict which classes may extend them, so `switch` can be checked for exhaustiveness.",
      "**Pattern matching** for `instanceof` and `switch` removes casts.",
      "**Virtual threads** (Java 21) are JVM-managed and cheap, so blocking I/O code scales without reactive rewrites.",
      "Text blocks (`\"\"\"`) and `var` for local type inference.",
    ],
    code: `record Money(BigDecimal amount, String currency) {}

sealed interface Payment permits Card, Upi {}
record Card(String last4) implements Payment {}
record Upi(String vpa) implements Payment {}

String describe(Payment p) {
    return switch (p) {                 // exhaustive: no default needed
        case Card c -> "Card ending " + c.last4();
        case Upi u  -> "UPI " + u.vpa();
    };
}

try (var pool = Executors.newVirtualThreadPerTaskExecutor()) {
    orders.forEach(o -> pool.submit(() -> notifyCustomer(o)));
}`,
    say: "Records remove data-class boilerplate, sealed types plus pattern matching give exhaustive switches, and virtual threads let plain blocking code scale.",
    trap: "“Are records mutable?” No: fields are private final, with no setters. And a record can't extend another class.",
  },
];

export const boss = [
  {
    q: "Integer a = 127, b = 127; Integer c = 128, d = 128; — what do (a == b) and (c == d) give?",
    options: ["true and true", "true and false", "false and false", "false and true"],
    answer: 1,
    why: "Integer.valueOf caches -128..127, so a and b are the same object. 128 is outside the cache, so c and d are two objects and == compares references.",
  },
  {
    q: "Inside a method you write Order order = new Order(). Where does the Order object live?",
    options: ["On the thread's stack", "On the heap", "In Metaspace", "In the String pool"],
    answer: 1,
    why: "The reference variable is in the stack frame; the object it points to is always on the heap.",
  },
  {
    q: "A service method throws IOException inside @Transactional. By default, what happens to the transaction?",
    options: ["It rolls back", "It commits", "Spring retries it", "It fails to compile"],
    answer: 1,
    why: "@Transactional rolls back on unchecked exceptions and Errors by default. For a checked exception like IOException, use rollbackFor = Exception.class.",
  },
  {
    q: "What does Optional.of(null) do?",
    options: ["Returns Optional.empty()", "Throws NullPointerException", "Returns an Optional holding null", "Doesn't compile"],
    answer: 1,
    why: "Optional.of insists on a value. Use Optional.ofNullable when the value might be null.",
  },
  {
    q: "A stream has filter() and map() but no terminal operation. How many elements get processed?",
    options: ["All of them", "Only the first one", "None", "It throws IllegalStateException"],
    answer: 2,
    why: "Intermediate operations are lazy. Without collect, forEach, count or another terminal operation, the pipeline never runs.",
  },
];
