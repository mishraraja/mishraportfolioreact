/**
 * Guess the Output: short snippets with one surprising result. Each answer
 * was traced by hand against the JLS and the JDK source it depends on.
 * `ask` defaults to "What does this print?".
 */
export const PUZZLES = [
  {
    id: "integer-cache",
    world: "core-java",
    level: "Warm-up",
    code: `Integer a = 127, b = 127;
Integer c = 128, d = 128;
System.out.println((a == b) + " " + (c == d));`,
    options: ["true true", "true false", "false false", "false true"],
    answer: 1,
    why: "Autoboxing calls Integer.valueOf, which caches -128 to 127. 127 comes from the cache (one object); 128 doesn't (two objects), and == compares references.",
  },
  {
    id: "string-intern",
    world: "core-java",
    level: "Warm-up",
    code: `String s1 = "java";
String s2 = new String("java");
String s3 = s2.intern();
System.out.println((s1 == s2) + " " + (s1 == s3));`,
    options: ["true true", "false true", "false false", "true false"],
    answer: 1,
    why: "new String always creates a fresh heap object, so s1 == s2 is false. intern() returns the pooled copy — the very object s1 points to.",
  },
  {
    id: "compile-time-concat",
    world: "core-java",
    level: "Tricky",
    code: `String a = "hello";
String b = "hel" + "lo";
String part = "hel";
String c = part + "lo";
System.out.println((a == b) + " " + (a == c));`,
    options: ["true true", "true false", "false false", "false true"],
    answer: 1,
    why: "\"hel\" + \"lo\" is a compile-time constant, folded into the pooled \"hello\". part isn't final, so part + \"lo\" is built at runtime as a new String.",
  },
  {
    id: "finally-return",
    world: "core-java",
    level: "Tricky",
    code: `static int value() {
    try {
        return 1;
    } finally {
        return 2;
    }
}

System.out.println(value());`,
    options: ["1", "2", "Compile error", "1, then 2"],
    answer: 1,
    why: "finally always runs, and a return inside it replaces the try block's return value. That's exactly why you should never return from finally.",
  },
  {
    id: "finally-primitive",
    world: "core-java",
    level: "Evil",
    code: `static int count() {
    int x = 1;
    try {
        return x;
    } finally {
        x = 99;
    }
}

System.out.println(count());`,
    options: ["1", "99", "Compile error", "0"],
    answer: 0,
    why: "The return value is evaluated and saved before finally runs. Changing x afterwards doesn't change the saved value.",
  },
  {
    id: "concat-order",
    world: "core-java",
    level: "Warm-up",
    code: `System.out.println(1 + 2 + "3" + 4 + 5);`,
    options: ["12345", "3345", "3354", "15"],
    answer: 1,
    why: "+ is evaluated left to right. 1 + 2 is the int 3; then \"3\" makes it a String, \"33\"; after that, 4 and 5 are appended as text: \"3345\".",
  },
  {
    id: "char-math",
    world: "core-java",
    level: "Warm-up",
    code: `char c = 'A';
System.out.println(c + 1);
System.out.println((char) (c + 1));`,
    options: ["B, then B", "66, then B", "A1, then B", "66, then 66"],
    answer: 1,
    why: "char + int is promoted to int, so 'A' (65) + 1 prints 66. Casting back to char prints B.",
  },
  {
    id: "int-division",
    world: "core-java",
    level: "Warm-up",
    code: `double avg = 7 / 2;
System.out.println(avg);`,
    options: ["3.5", "3.0", "3", "Compile error"],
    answer: 1,
    why: "7 / 2 is integer division (3) before it's widened to a double. Write 7 / 2.0 for 3.5.",
  },
  {
    id: "math-round",
    world: "core-java",
    level: "Evil",
    code: `System.out.println(Math.round(-2.5) + " " + Math.round(2.5));`,
    options: ["-3 3", "-2 3", "-2 2", "-3 2"],
    answer: 1,
    why: "Math.round rounds halves towards positive infinity: it's floor(x + 0.5). So -2.5 becomes -2 and 2.5 becomes 3.",
  },
  {
    id: "floating-point",
    world: "core-java",
    level: "Tricky",
    code: `System.out.println(0.1 + 0.2 == 0.3);
System.out.println(new BigDecimal("0.1").add(new BigDecimal("0.2")));`,
    options: ["true, then 0.3", "false, then 0.3", "false, then 0.30000000000000004", "true, then 0.30000000000000004"],
    answer: 1,
    why: "Binary doubles can't represent 0.1 exactly, so the sum is 0.30000000000000004. BigDecimal built from Strings is exact — use it for money.",
  },
  {
    id: "short-compound",
    world: "core-java",
    level: "Tricky",
    code: `short s = 10;
s += 5;      // line A
s = s + 5;   // line B
System.out.println(s);`,
    options: ["20", "15", "Compile error on line B", "Compile error on line A"],
    answer: 2,
    why: "s + 5 is an int, and assigning an int to a short needs a cast. Compound assignment (+=) includes that cast implicitly, so line A compiles.",
  },
  {
    id: "pre-post-increment",
    world: "core-java",
    level: "Tricky",
    code: `int i = 5;
int result = i++ + ++i;
System.out.println(result + " " + i);`,
    options: ["11 6", "12 7", "11 7", "12 6"],
    answer: 1,
    why: "i++ yields 5 and makes i 6. ++i makes i 7 and yields 7. 5 + 7 = 12, and i ends at 7.",
  },
  {
    id: "switch-fallthrough",
    world: "core-java",
    level: "Warm-up",
    code: `int day = 2;
switch (day) {
    case 1: System.out.print("Mon ");
    case 2: System.out.print("Tue ");
    case 3: System.out.print("Wed ");
    default: System.out.print("Other");
}`,
    options: ["Tue", "Tue Wed Other", "Tue Other", "Mon Tue Wed Other"],
    answer: 1,
    why: "Without break, old-style case labels fall through into every case below. Arrow labels (case 2 ->) don't fall through.",
  },
  {
    id: "try-with-resources",
    world: "core-java",
    level: "Tricky",
    code: `class R implements AutoCloseable {
    private final String name;
    R(String name) { this.name = name; }
    public void close() { System.out.print("close-" + name + " "); }
}

try (R a = new R("a"); R b = new R("b")) {
    System.out.print("body ");
}`,
    options: ["body close-a close-b", "body close-b close-a", "close-a close-b body", "body"],
    answer: 1,
    why: "Resources are closed in reverse order of creation, so something opened later (which may depend on the earlier one) closes first.",
  },
  {
    id: "optional-orelse",
    world: "core-java",
    level: "Tricky",
    code: `static String fallback() {
    System.out.print("called ");
    return "guest";
}

String name = Optional.of("asha").orElse(fallback());
System.out.println(name);`,
    options: ["asha", "called asha", "called guest", "guest"],
    answer: 1,
    why: "orElse takes a value, so fallback() runs before orElse is even called. orElseGet(() -> fallback()) would only run it when the Optional is empty.",
  },
  {
    id: "stream-lazy",
    world: "core-java",
    level: "Tricky",
    code: `Stream.of("a", "b", "c")
      .peek(s -> System.out.print(s))
      .map(String::toUpperCase);
System.out.println("done");`,
    options: ["abcdone", "ABCdone", "done", "a b c done"],
    answer: 2,
    why: "There's no terminal operation, so the pipeline is only described, never run. peek never sees an element.",
  },
  {
    id: "stream-vertical",
    world: "core-java",
    level: "Evil",
    code: `Stream.of("x", "y")
      .map(s -> { System.out.print("m" + s + " "); return s; })
      .filter(s -> { System.out.print("f" + s + " "); return true; })
      .forEach(s -> System.out.print("e" + s + " "));`,
    options: ["mx my fx fy ex ey", "mx fx ex my fy ey", "ex ey", "fx fy mx my ex ey"],
    answer: 1,
    why: "Streams push each element through the whole pipeline before the next one starts — vertically, not stage by stage.",
  },
  {
    id: "overload-null",
    world: "oop",
    level: "Tricky",
    code: `static void print(Object o) { System.out.println("Object"); }
static void print(String s) { System.out.println("String"); }

print(null);`,
    options: ["Object", "String", "Compile error: ambiguous", "NullPointerException"],
    answer: 1,
    why: "null fits both, and the compiler picks the most specific overload. String is a subtype of Object, so it wins.",
  },
  {
    id: "static-hiding",
    world: "oop",
    level: "Tricky",
    code: `class Parent { static String who() { return "parent"; } }
class Child extends Parent { static String who() { return "child"; } }

Parent p = new Child();
System.out.println(p.who());`,
    options: ["parent", "child", "Compile error", "null"],
    answer: 0,
    why: "Static methods aren't overridden, only hidden. The call is bound at compile time to the reference type, Parent.",
  },
  {
    id: "field-hiding",
    world: "oop",
    level: "Evil",
    code: `class Animal { String name = "animal"; String speak() { return "..."; } }
class Dog extends Animal { String name = "dog"; String speak() { return "woof"; } }

Animal a = new Dog();
System.out.println(a.name + " " + a.speak());`,
    options: ["dog woof", "animal woof", "animal ...", "dog ..."],
    answer: 1,
    why: "Methods are polymorphic; fields aren't. a.name uses the reference type (Animal), while a.speak() dispatches to Dog at runtime.",
  },
  {
    id: "stringbuilder-equals",
    world: "oop",
    level: "Tricky",
    code: `StringBuilder a = new StringBuilder("hi");
StringBuilder b = new StringBuilder("hi");
System.out.println(a.equals(b) + " " + a.toString().equals(b.toString()));`,
    options: ["true true", "false true", "false false", "true false"],
    answer: 1,
    why: "StringBuilder doesn't override equals, so it inherits Object's identity check. Compare the Strings instead.",
  },
  {
    id: "record-vs-class-in-set",
    world: "oop",
    level: "Tricky",
    code: `record Point(int x, int y) {}
class Spot { int x, y; Spot(int x, int y) { this.x = x; this.y = y; } }

Set<Object> set = new HashSet<>();
set.add(new Point(1, 2)); set.add(new Point(1, 2));
set.add(new Spot(1, 2));  set.add(new Spot(1, 2));
System.out.println(set.size());`,
    options: ["2", "3", "4", "1"],
    answer: 1,
    why: "Records generate equals and hashCode, so the two Points are one entry. Spot keeps Object's identity versions, so both Spots stay: 1 + 2 = 3.",
  },
  {
    id: "list-remove-index",
    world: "collections",
    level: "Tricky",
    code: `List<Integer> nums = new ArrayList<>(List.of(10, 20, 30));
nums.remove(1);
nums.remove(Integer.valueOf(10));
System.out.println(nums);`,
    options: ["[30]", "[20, 30]", "[10]", "IndexOutOfBoundsException"],
    answer: 0,
    why: "remove(1) picks the remove(int index) overload and removes 20. remove(Integer.valueOf(10)) removes the value 10, leaving [30].",
  },
  {
    id: "cme-first",
    world: "collections",
    level: "Warm-up",
    code: `List<String> names = new ArrayList<>(List.of("asha", "bo", "cy"));
for (String n : names) {
    if (n.equals("asha")) names.remove(n);
}
System.out.println(names);`,
    options: ["[bo, cy]", "ConcurrentModificationException", "[asha, bo, cy]", "IllegalStateException"],
    answer: 1,
    why: "The for-each iterator notices the list changed on its next call to next(). Use removeIf instead.",
  },
  {
    id: "cme-second-to-last",
    world: "collections",
    level: "Evil",
    code: `List<String> names = new ArrayList<>(List.of("asha", "bo", "cy"));
for (String n : names) {
    if (n.equals("bo")) names.remove(n);
}
System.out.println(names);`,
    options: ["[asha, cy]", "ConcurrentModificationException", "[asha, bo, cy]", "[cy]"],
    answer: 0,
    why: "Removing the second-to-last element shrinks the list to exactly the iterator's cursor, so hasNext() returns false and the loop ends before next() can check. No exception — and \"cy\" is silently never visited.",
  },
  {
    id: "unboxing-null",
    world: "collections",
    level: "Warm-up",
    code: `Map<String, Integer> stock = new HashMap<>();
int pens = stock.get("pen");
System.out.println(pens);`,
    options: ["0", "null", "NullPointerException", "Compile error"],
    answer: 2,
    why: "get returns a null Integer, and unboxing null into an int throws. Use getOrDefault(\"pen\", 0).",
  },
  {
    id: "list-of-add",
    world: "collections",
    level: "Warm-up",
    code: `List<String> list = List.of("a", "b");
list.add("c");
System.out.println(list);`,
    options: ["[a, b, c]", "UnsupportedOperationException", "[a, b]", "Compile error"],
    answer: 1,
    why: "List.of returns an immutable list. It compiles fine — the add fails at runtime.",
  },
  {
    id: "run-vs-start",
    world: "concurrency",
    level: "Tricky",
    code: `Thread t = new Thread(() -> System.out.println(Thread.currentThread().getName()));
t.setName("worker");
t.run();`,
    options: ["worker", "main", "Thread-0", "Nothing"],
    answer: 1,
    why: "run() is an ordinary method call on the current thread. Only start() creates the new thread named worker.",
  },
  {
    id: "submit-swallows",
    world: "concurrency",
    level: "Evil",
    ask: "What appears in the console?",
    code: `Runnable task = () -> { throw new IllegalStateException("boom"); };

ExecutorService pool = Executors.newSingleThreadExecutor();
pool.submit(task);        // nobody ever calls get()
pool.shutdown();
System.out.println("done");`,
    options: ["done, and no stack trace anywhere", "A stack trace, then done", "IllegalStateException thrown in main", "Nothing at all"],
    answer: 0,
    why: "submit wraps the task in a Future, which captures the exception until someone calls get(). Nobody does, so it vanishes. execute() would have printed the stack trace.",
  },
  {
    id: "transactional-self-call",
    world: "spring",
    level: "Evil",
    ask: "placeAll(List.of(goodOrder, badOrder)) is called from a controller. How many orders end up in the database?",
    code: `@Service
class OrderService {
    @Transactional
    public void placeAll(List<Order> orders) {
        orders.forEach(this::place);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void place(Order order) {
        repo.save(order);
        if (order.total() < 0) throw new IllegalArgumentException("negative total");
    }
}`,
    options: ["2", "1 — just the good one", "0", "It depends on the isolation level"],
    answer: 2,
    why: "this::place bypasses the proxy, so REQUIRES_NEW is ignored and both saves share placeAll's transaction. The exception escapes placeAll, and the whole thing rolls back.",
  },
  {
    id: "n-plus-one-count",
    world: "database",
    level: "Tricky",
    ask: "How many SQL queries run? (books is a LAZY @OneToMany, no batch fetching)",
    code: `@Transactional(readOnly = true)
public void report() {
    List<Author> authors = authorRepository.findAll();   // 10 authors
    for (Author a : authors) {
        System.out.println(a.getName() + ": " + a.getBooks().size());
    }
}`,
    options: ["1", "2", "10", "11"],
    answer: 3,
    why: "One query loads the authors, then each getBooks() fires its own query: 1 + 10 = 11. A fetch join or @EntityGraph makes it 1.",
  },
  {
    id: "left-join-count",
    world: "database",
    level: "Warm-up",
    ask: "employee has 5 rows, 2 with a NULL dept_id; every other dept_id matches exactly one department. What's the count?",
    code: `SELECT COUNT(*)
FROM employee e
LEFT JOIN department d ON d.id = e.dept_id;`,
    lang: "sql",
    options: ["3", "5", "8", "15"],
    answer: 1,
    why: "A LEFT JOIN keeps every employee, and each matches at most one department, so there are exactly 5 rows. An INNER JOIN would give 3.",
  },
  {
    id: "reset-soft",
    world: "git",
    level: "Tricky",
    ask: "Each commit changed a different file. Where are B's and C's changes now?",
    code: `git commit -m "A"
git commit -m "B"
git commit -m "C"
git reset --soft HEAD~2
git status`,
    lang: "shell",
    options: ["Gone for good", "Staged, ready to commit again", "Unstaged in the working tree", "In the stash"],
    answer: 1,
    why: "--soft moves the branch back to A but leaves the index as it was at C, so B's and C's changes show up as staged.",
  },
];
