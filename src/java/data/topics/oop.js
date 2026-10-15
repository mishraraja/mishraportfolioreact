/* OOP & design patterns — concept cards and the boss fight. */

export const concepts = [
  {
    id: "four-pillars",
    title: "The four pillars",
    emoji: "🏛️",
    hot: true,
    simple:
      "Think of a car. Encapsulation hides the engine under the bonnet. Abstraction hands you a steering wheel instead of a manual on combustion. Inheritance means an electric car is still a car. Polymorphism means you press “accelerate” and each car does it its own way.",
    points: [
      "**Encapsulation** — private state behind methods that protect its rules (a balance that can't go negative).",
      "**Abstraction** — expose *what* something does, hide *how*: interfaces and abstract classes.",
      "**Inheritance** — reuse through an IS-A relationship with `extends`. One superclass, many interfaces.",
      "**Polymorphism** — one call, many behaviours. *Compile-time* = overloading; *runtime* = overriding (dynamic dispatch).",
    ],
    code: `interface PaymentGateway {                    // abstraction
    Receipt charge(Money amount);
}

class StripeGateway implements PaymentGateway {
    private final String apiKey;               // encapsulation
    StripeGateway(String apiKey) { this.apiKey = apiKey; }
    public Receipt charge(Money amount) { return new Receipt("stripe"); }
}

class RazorpayGateway implements PaymentGateway {
    public Receipt charge(Money amount) { return new Receipt("razorpay"); }
}

PaymentGateway gateway = gatewayFor(country); // polymorphism: chosen at runtime
gateway.charge(total);`,
    say: "Encapsulation protects state, abstraction hides implementation behind a contract, inheritance reuses an IS-A relationship, and polymorphism lets one call behave differently depending on the runtime type.",
    trap: "“Encapsulation vs abstraction?” Encapsulation hides *data* and guards its rules; abstraction hides *complexity* so callers only see what they need.",
  },
  {
    id: "overload-override",
    title: "Overloading vs overriding",
    emoji: "🎭",
    hot: true,
    simple:
      "Overloading is one restaurant with different menus for different party sizes — picked the moment you walk in (compile time). Overriding is a franchise branch changing the house recipe — which one you get depends on the branch you're actually in (runtime).",
    points: [
      "**Overloading**: same name, *different parameter list*, usually in one class. Resolved at **compile time**. A different return type alone isn't enough.",
      "**Overriding**: a subclass redefines a method with the *same signature*. Resolved at **runtime** by the object's actual class.",
      "An override can't **reduce visibility** or **throw broader checked exceptions**; it *may* return a subtype (covariant return).",
      "`static`, `private` and `final` methods can't be overridden. Always add `@Override` — it turns typos into compile errors.",
    ],
    code: `class Notifier {
    void send(String to) { }                   // overload 1
    void send(String to, String subject) { }   // overload 2: different params
    String channel() { return "generic"; }
}

class SmsNotifier extends Notifier {
    @Override
    String channel() { return "sms"; }         // override: same signature
}

Notifier n = new SmsNotifier();
n.channel();   // "sms" – the runtime type decides`,
    say: "Overloading is compile-time polymorphism chosen by parameter types; overriding is runtime polymorphism chosen by the object's actual class.",
    trap: "“Given `print(Object o)` and `print(String s)`, what does `print(null)` call?” The String version — the compiler picks the most specific overload.",
  },
  {
    id: "interface-abstract",
    title: "Interface vs abstract class",
    emoji: "📐",
    hot: true,
    simple:
      "An interface is a job description: “must be able to drive”. You can meet many job descriptions at once. An abstract class is a half-built house: some rooms are finished, some are left for you — and you can only inherit one house.",
    points: [
      "**Interface**: a contract. A class can implement many. Since Java 8 it can have `default` and `static` methods; fields are always `public static final`.",
      "**Abstract class**: can hold **state**, constructors and partly finished logic. A class can extend only one.",
      "Use an interface for a *capability* unrelated classes share (`Comparable`, `Runnable`). Use an abstract class for a shared *base with state* (Template Method).",
      "An interface with exactly one abstract method is a **functional interface** — a lambda can implement it.",
    ],
    code: `interface Shippable {
    double weightKg();
    default boolean needsFreight() { return weightKg() > 30; }  // Java 8 default
}

abstract class Report {                                // Template Method
    private final Instant createdAt = Instant.now();   // state
    public final String render() { return header() + body(); }
    protected String header() { return "Generated " + createdAt + "\\n"; }
    protected abstract String body();                  // subclasses fill this in
}`,
    say: "An interface defines a capability a class can have many of; an abstract class shares state and partial implementation, and a class can extend only one.",
    trap: "“Two interfaces give you the same default method?” The class must override it, and can call one explicitly with `A.super.method()`.",
  },
  {
    id: "equals-hashcode",
    title: "The equals & hashCode contract",
    emoji: "🔑",
    hot: true,
    lab: "equals-hashcode",
    simple:
      "hashCode picks the drawer; equals checks the item inside it. If two equal objects land in different drawers, a HashMap searches the wrong drawer and swears your key isn't there.",
    points: [
      "**If `a.equals(b)` then `a.hashCode() == b.hashCode()`** — mandatory. The reverse isn't required (that's a collision).",
      "Default `equals` is identity (`==`); default `hashCode` is identity-based. Override **both**, from the **same fields**.",
      "Don't mutate a field used in `hashCode` while the object is a key: the entry becomes unreachable.",
      "Records generate a correct `equals` and `hashCode` for you.",
    ],
    code: `final class Employee {
    private final int id;
    private final String email;

    Employee(int id, String email) { this.id = id; this.email = email; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Employee other)) return false;
        return id == other.id && email.equals(other.email);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, email);   // the same fields equals() uses
    }
}`,
    say: "Equal objects must have equal hash codes, because hash-based collections use hashCode to find the bucket and equals to confirm the match — so override both from the same fields.",
    trap: "“Override equals but not hashCode?” `set.contains(new Employee(7, \"a@x.com\"))` returns false, and the set happily stores “duplicates”.",
  },
  {
    id: "composition",
    title: "Composition over inheritance",
    emoji: "🧱",
    simple:
      "Inheritance says a SportsCar IS-A Car and welds it to the Car forever. Composition says a Car HAS-A Engine — swap in an electric one tomorrow without rebuilding the car.",
    points: [
      "Inheritance ties a subclass to its parent's internals: change the parent and subclasses break (the **fragile base class** problem).",
      "Composition holds a reference and **delegates**. It's easier to test (inject a mock) and to change at runtime.",
      "Spring's dependency injection *is* composition.",
      "Inherit only for a true, stable IS-A relationship where the subclass can stand in for the parent anywhere.",
    ],
    code: `// Inheritance: you inherit every ArrayList behaviour, even the ones you didn't want
class AuditedList<E> extends ArrayList<E> { /* override add... and addAll... and set... */ }

// Composition: hold the parts, expose only what you mean to
@Service
class OrderService {
    private final PaymentGateway gateway;     // HAS-A, injected
    private final OrderRepository orders;

    OrderService(PaymentGateway gateway, OrderRepository orders) {
        this.gateway = gateway;
        this.orders = orders;
    }
}`,
    say: "I prefer composition: holding collaborators and delegating keeps classes loosely coupled and testable, and I reserve inheritance for genuine, stable IS-A relationships.",
    trap: "“Why is extending HashSet to count additions risky?” `addAll` calls `add` internally, so you double-count — you depend on the parent's implementation details.",
  },
  {
    id: "solid",
    title: "SOLID principles",
    emoji: "🧭",
    hot: true,
    simple:
      "Five habits of code that's easy to change: every class has one job, you add features without editing old code, subtypes never surprise, interfaces stay small, and you depend on contracts, not concrete classes.",
    points: [
      "**S — Single responsibility**: one reason to change. `InvoicePdfRenderer`, not `InvoiceManagerHelperUtil`.",
      "**O — Open/closed**: open for extension, closed for modification. A new payment method is a new class, not a new `if`.",
      "**L — Liskov substitution**: a subclass must work anywhere its parent does.",
      "**I — Interface segregation**: many small interfaces beat one fat one.",
      "**D — Dependency inversion**: depend on abstractions; let the container inject implementations.",
    ],
    code: `// O + D: a new gateway is a new class; OrderService never changes
interface PaymentGateway { Receipt charge(Money amount); }

@Component class UpiGateway implements PaymentGateway { /* ... */ }
@Component class CardGateway implements PaymentGateway { /* ... */ }

@Service
class OrderService {
    private final Map<String, PaymentGateway> gateways;   // Spring injects every bean by name
    OrderService(Map<String, PaymentGateway> gateways) { this.gateways = gateways; }

    Receipt pay(String method, Money amount) {
        return gateways.get(method + "Gateway").charge(amount);
    }
}`,
    say: "SOLID is single responsibility, open/closed, Liskov substitution, interface segregation and dependency inversion — and Spring's DI makes the last two the default.",
    trap: "“Give a Liskov violation.” Square extends Rectangle: `setWidth` on a Square also changes the height, breaking code written for Rectangles.",
  },
  {
    id: "singleton",
    title: "Singleton, done safely",
    emoji: "👑",
    hot: true,
    simple:
      "One CEO per company: everyone who asks gets the same person. The hard part is making sure two threads don't both hire a CEO at the same moment.",
    points: [
      "Private constructor plus a static accessor.",
      "**Holder idiom**: lazy *and* thread-safe, because class loading is thread-safe.",
      "**Enum singleton**: the simplest version, and safe against serialization and reflection attacks.",
      "**Double-checked locking** only works if the field is `volatile`.",
      "Spring beans are singletons **per container**, not per JVM — and you rarely need a hand-written singleton in a Spring app.",
    ],
    code: `public final class IdGenerator {
    private IdGenerator() {}

    private static class Holder {                     // loaded on first use only
        static final IdGenerator INSTANCE = new IdGenerator();
    }

    public static IdGenerator getInstance() {
        return Holder.INSTANCE;                       // class init is thread-safe
    }
}

public enum AppClock { INSTANCE; }                    // the bulletproof version`,
    say: "For a thread-safe lazy singleton I'd use the holder idiom or an enum; double-checked locking needs a volatile field. In Spring, singleton scope means one instance per application context.",
    trap: "“Why `volatile` in double-checked locking?” Without it, another thread can see the reference before the constructor has finished.",
  },
  {
    id: "factory-builder",
    title: "Factory & Builder",
    emoji: "🏭",
    simple:
      "A factory is a vending machine: say “cola” and get the right can without knowing how it was made. A builder is a burger counter: add cheese, skip onions, then build() — no nine-argument constructor.",
    points: [
      "**Factory** centralises creation and returns an interface: `List.of`, `LocalDate.of`, Spring's `BeanFactory`.",
      "**Builder** handles many optional fields readably and produces an immutable object: `HttpRequest.newBuilder()`, Lombok's `@Builder`.",
      "A builder beats **telescoping constructors** (`new Pizza(true, false, true, null, 2)` — which boolean was cheese?).",
    ],
    code: `// Factory: callers ask for a kind, not a class
static Notifier notifierFor(Channel channel) {
    return switch (channel) {
        case EMAIL -> new EmailNotifier();
        case SMS   -> new SmsNotifier();
    };
}

// Builder: readable, optional parts, immutable result
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.example.com/orders"))
    .header("Content-Type", "application/json")
    .timeout(Duration.ofSeconds(5))
    .POST(HttpRequest.BodyPublishers.ofString(json))
    .build();`,
    say: "A factory hides which concrete class gets created; a builder makes objects with many optional fields readable and immutable.",
    trap: "“Factory method vs abstract factory?” A factory method creates one product; an abstract factory creates a *family* of related products that belong together.",
  },
  {
    id: "spring-patterns",
    title: "Observer, Strategy & Proxy",
    emoji: "📡",
    simple:
      "Observer is a YouTube subscription: the channel doesn't know you, it just notifies subscribers. Strategy is picking a route in Maps — same trip, swappable algorithm. Proxy is a receptionist who handles things before and after you meet the boss.",
    points: [
      "**Observer**: publishers notify listeners without knowing them — Spring's `ApplicationEvent` and `@EventListener`. Kafka is the same idea at system scale.",
      "**Strategy**: interchangeable algorithms behind one interface — a `Comparator`, or injected `PaymentGateway` beans.",
      "**Proxy**: a stand-in that adds behaviour — Spring AOP wraps beans for `@Transactional`, `@Cacheable` and `@Async`.",
      "**Template Method**: `JdbcTemplate` and `RestTemplate` do the boilerplate and call your code for the part that varies.",
    ],
    code: `public record OrderPlaced(long orderId) {}

@Service
class OrderService {
    private final ApplicationEventPublisher events;
    OrderService(ApplicationEventPublisher events) { this.events = events; }

    @Transactional                                  // Proxy: begin/commit around this
    public void place(Order order) {
        // ...save the order...
        events.publishEvent(new OrderPlaced(order.id()));   // Observer
    }
}

@Component
class ConfirmationEmail {
    @EventListener
    void on(OrderPlaced event) { /* send the email */ }
}`,
    say: "Spring is a pattern catalogue: singleton beans, factories, proxies for @Transactional, templates like JdbcTemplate, observers through application events and strategies through injected implementations.",
    trap: "“Why doesn't @Transactional work when a method calls another method in the same class?” The call never goes through the proxy — it's a plain `this.method()` call.",
  },
];

export const boss = [
  {
    q: "a.equals(b) returns true. What must be true about their hash codes?",
    options: ["They must be equal", "They must be different", "Nothing — the two methods are unrelated", "They're only equal for Strings"],
    answer: 0,
    why: "The contract: equal objects must have equal hash codes, or hash-based collections look in the wrong bucket.",
  },
  {
    q: "When is an overloaded method chosen?",
    options: ["At compile time, from the argument types", "At runtime, from the object's class", "When the JIT compiles the method", "At random if two overloads match"],
    answer: 0,
    why: "Overloading is static polymorphism — the compiler picks the most specific signature. Overriding is resolved at runtime.",
  },
  {
    q: "Which singleton is lazy and thread-safe without any synchronized keyword?",
    options: ["A public static field assigned in main()", "The initialization-on-demand holder class", "Double-checked locking without volatile", "Returning new Instance() from getInstance()"],
    answer: 1,
    why: "The JVM initialises the nested Holder class on first use, and class initialisation is guaranteed to be thread-safe.",
  },
  {
    q: "Square extends Rectangle, and setWidth on a Square also changes its height. Which principle breaks?",
    options: ["Single responsibility", "Open/closed", "Liskov substitution", "Interface segregation"],
    answer: 2,
    why: "Code that expects a Rectangle's width and height to change independently breaks when handed a Square, so Square can't substitute for Rectangle.",
  },
  {
    q: "An object has a dozen optional fields and must be immutable. Which pattern fits best?",
    options: ["Singleton", "Builder", "Observer", "Adapter"],
    answer: 1,
    why: "A builder collects the optional values step by step, then build() produces one immutable object.",
  },
];
