export const DEPLOYMENT_MODES = {
  external: {
    label: "External server / WAR",
    title: "The server starts first",
    description: "An operating-system service or operator starts a Java process that hosts the web container. The container discovers and deploys the application package, then creates the web and framework contexts. The exact packaging and bootstrap hooks depend on the container and framework versions.",
    path: ["OS service", "JVM process", "Web container", "Application context", "Ready"],
    note: "A web container can host one or several applications. Its JVM process and the application share process resources, but their lifecycles are not identical."
  },
  embedded: {
    label: "Application package / embedded server",
    title: "The application starts its server",
    description: "A launcher starts the application on the JVM. Framework bootstrap creates the application context and starts an embedded server when that application uses one. Executable archives are common, but not mandatory; applications can also be packaged for an external container.",
    path: ["OS process", "JVM launcher", "Application bootstrap", "Embedded server", "Ready"],
    note: "Spring Boot can package an executable application or be deployed as a WAR. Boot is a configuration and packaging approach, not a different JVM."
  }
};

export const START_STEPS = [
  {
    title: "Write source and configuration",
    label: "Source",
    lane: "Project files",
    happens: "People write Java source, tests, configuration, templates, and resource files. Build files describe dependencies and how those inputs become an artifact.",
    memory: "These files are on disk. They are not Java objects in a running heap yet.",
    inspect: "Read the build file and identify source sets, dependencies, test tasks, resource folders, and the artifact type."
  },
  {
    title: "Build and compile",
    label: "Build",
    lane: "Build tool + compiler",
    happens: "A build tool resolves dependencies, runs configured checks, invokes the compiler, copies resources, and packages outputs. The Java compiler turns source into class-file bytecode; a successful build does not mean the application has started.",
    memory: "The compiler and build tool run in their own process or worker processes. Their memory is not the same heap as the later application JVM.",
    inspect: "Look in the build output for class files and the packaged artifact. Compare the process running the build with the process that serves requests."
  },
  {
    title: "The operating system starts a process",
    label: "Launch",
    lane: "Operating system",
    happens: "A service, container platform, IDE, script, or command starts a process. The Java launcher selects a JVM implementation and passes it the main class, module, or application archive plus runtime options.",
    memory: "The process reserves virtual address space and obtains native resources. JVM heap size is only one part of process memory; thread stacks, code, direct buffers, libraries, and runtime structures also matter.",
    inspect: "Record the process ID, executable, arguments, environment, working directory, and configured memory limits before diagnosing a runtime issue."
  },
  {
    title: "The JVM loads and initializes classes",
    label: "Class loading",
    lane: "JVM runtime",
    happens: "Class loaders find class bytes. The JVM links classes through verification, preparation, and resolution steps, then initializes a class when the language rules require it. Some work can be lazy, so not every class is initialized at process startup.",
    memory: "Class metadata and runtime structures are maintained by the JVM. The Java specification describes logical runtime areas; the JVM implementation decides their physical representation.",
    inspect: "Use startup logs and class-loading diagnostics available for your JVM. A missing class, incompatible method, or failed static initializer usually fails before the request reaches business logic."
  },
  {
    title: "Framework and server bootstrap",
    label: "Bootstrap",
    lane: "Application runtime",
    happens: "Application bootstrap reads configuration, creates managed components, connects their dependencies, and starts listeners or other runtime services. A servlet application uses a servlet container; a reactive application may use a different server and request model.",
    memory: "Managed objects, caches, pools, and framework metadata add to the live process footprint. A singleton-scoped Spring bean is commonly shared by request threads, so mutable fields need careful concurrency design.",
    inspect: "Find the first successful startup-ready message, then verify health checks, configuration sources, and which ports or sockets are actually listening."
  },
  {
    title: "A request enters the system",
    label: "Ingress",
    lane: "Network + server",
    happens: "A browser resolves a host, establishes a connection, and sends an HTTP request. A proxy, gateway, or load balancer may route it. The server parses the protocol and hands work to a request thread or event-driven runtime.",
    memory: "Request metadata and buffers are created. A request may share a worker thread with other requests over time, but each request must keep its own data isolated.",
    inspect: "Trace request ID, method, path, status, duration, and upstream target. Never log credentials, tokens, or sensitive request bodies by default."
  },
  {
    title: "Security and routing choose a handler",
    label: "Routing",
    lane: "Web framework",
    happens: "Filters or middleware can handle cross-cutting work such as authentication, authorization, CORS, and logging. In Spring MVC, DispatcherServlet coordinates handler mapping and an adapter that invokes the matched controller. Other Java web stacks route differently.",
    memory: "The current request and response live in framework-managed objects. Thread-local context may carry request state temporarily; it must be cleared or propagated correctly when execution changes threads.",
    inspect: "Check which route matched, which security rule ran, and whether validation rejected the request before application business logic."
  },
  {
    title: "Business logic runs",
    label: "Business logic",
    lane: "Application code",
    happens: "A controller or endpoint maps transport data into application operations. A service applies domain rules and coordinates work. A repository or client hides details of storage or another service. These are design roles, not mandatory classes in every application.",
    memory: "Method calls create stack frames for the executing thread. Objects may be allocated, reused, or optimized by the JVM; source-level variable placement is not a perfect map of physical memory.",
    inspect: "Follow one request ID through the call path. Keep transactions and remote calls at deliberate boundaries, and avoid mixing transport parsing with core business rules."
  },
  {
    title: "Data is read or written",
    label: "Persistence",
    lane: "Driver + database",
    happens: "A data-access layer obtains a connection, commonly from a pool, and uses a driver to exchange protocol messages with a database. An ORM may track entities and generate SQL, but the database still evaluates SQL and enforces its own constraints and transaction rules.",
    memory: "Connection pools, ORM persistence contexts, query results, and application caches consume resources. Returning a pooled connection usually returns it to the pool rather than closing the network socket.",
    inspect: "Capture query count and duration, inspect query plans, and check transaction boundaries. Watch for N+1 queries, long-held connections, and unbounded result sets."
  },
  {
    title: "The response is formed and sent back",
    label: "Response",
    lane: "Application → network",
    happens: "The framework converts a return value to a response body or renders a view. Error handlers map failures to status codes. The server writes headers and bytes; proxies and the network carry the response back to the client.",
    memory: "Response buffers and temporary objects become eligible for collection when no live references retain them. A completed request does not mean every object it created is immediately reclaimed.",
    inspect: "Check the status code, response size, latency at each layer, and whether a failed operation partially changed persistent state."
  }
];

export const MEMORY_AREAS = [
  {
    id: "heap",
    name: "Heap",
    scope: "Shared by JVM threads",
    stores: "Objects and arrays, in the specification's execution model.",
    detail: "The heap is where object allocation is modeled, and garbage collection can reclaim unreachable objects. Objects that remain reachable from roots cannot be reclaimed. The JVM may optimize allocation, so never infer exact physical placement from a single source line or assume every object has a simple visible lifetime.",
    symptom: "A rising live set after collection can suggest retained objects. A high allocation rate can cause frequent collection even when the live set is modest."
  },
  {
    id: "stack",
    name: "Thread stacks and frames",
    scope: "One logical stack per thread",
    stores: "Method-call frames, local slots, intermediate values, and return state as defined by the VM model.",
    detail: "Calling a method pushes a frame; returning removes it. A local reference can point to an object on the heap, but the reference and the object are different things. Deep recursion can exhaust a thread's stack; too many threads can consume substantial native memory even when heap use is low.",
    symptom: "StackOverflowError often indicates unbounded recursion or an unexpectedly deep call chain. Thread-count growth can reveal a thread leak or undersized/oversized pool."
  },
  {
    id: "method-area",
    name: "Method area / class metadata",
    scope: "Shared logical area",
    stores: "Class-level structures and runtime constant-pool information in the JVM specification.",
    detail: "The specification describes a method area as a logical runtime area; it does not require one physical implementation. HotSpot commonly stores class metadata in native-memory Metaspace. Metaspace is therefore an implementation term, not the name used by every JVM specification or vendor.",
    symptom: "Class-loader leaks or repeatedly creating classes can retain metadata. Metaspace exhaustion is different from Java heap exhaustion."
  },
  {
    id: "pc-native",
    name: "PC, native stack, and native memory",
    scope: "Per thread plus process-wide allocations",
    stores: "The current bytecode position for a thread, native method execution state, and memory requested outside the Java heap.",
    detail: "The JVM specification defines a per-thread program counter for Java execution and allows native method stacks. Real processes also use native libraries, thread stacks, direct byte buffers, memory-mapped files, and allocator overhead. These allocations may not appear in a Java heap dump.",
    symptom: "If process RSS is much larger than heap usage, inspect thread count, direct buffers, native libraries, mapped memory, and container limits."
  },
  {
    id: "code-cache",
    name: "Compiled code cache",
    scope: "JVM implementation detail",
    stores: "Native code produced by just-in-time compilation in JVMs that use such a cache.",
    detail: "A JVM can interpret bytecode and compile frequently executed paths to machine code. Compilation policy, tier names, cache layout, and diagnostic controls are implementation- and version-dependent. Treat C1/C2 as HotSpot terminology, not a universal JVM contract.",
    symptom: "Compilation and warm-up can change latency over time. Inspect JVM-specific compiler metrics before assuming a slow first request indicates slow business logic."
  }
];

export const LESSONS = [
  {
    id: "source-to-process",
    title: "1. From source code to a running process",
    summary: "Build output, bytecode, launcher, and what ‘Run’ really starts.",
    analogy: "A build is like preparing a kit; launching is opening the workshop and setting the machines in motion.",
    explanation: "Java source is compiled to class-file bytecode, often packaged with resources and dependencies. A build tool automates repeatable tasks such as compilation, tests, and packaging. At launch, the operating system starts a process and the Java launcher starts a JVM for the selected entry point or application archive. The JVM is a runtime implementation; Java is the language and class-file format is the portable hand-off between compiler and runtime.",
    internals: [
      "The JDK supplies development tools such as a compiler and diagnostic utilities; an application runtime may be a JDK image or a smaller runtime image, depending on how it was built.",
      "A build tool resolves declared dependencies and constructs an artifact. Dependency resolution and compilation are build-time work, not Spring startup.",
      "The OS process owns file handles, sockets, native memory, and one or more JVM threads. A container or service manager may impose additional CPU and memory limits."
    ],
    exampleTitle: "Keep these stages separate",
    example: "source + build configuration → compiled classes/resources → packaged artifact → OS process → JVM startup → application readiness",
    mistakes: ["A successful compile does not prove the application can start or connect to its dependencies.", "The JVM does not normally translate every class to native code before the first line runs.", "Build-process memory and application-process memory are separate unless a tool deliberately reuses a process."],
    exercise: "Draw the processes involved when an IDE starts a build and then starts a local server. Mark which process owns the application heap."
  },
  {
    id: "core-java-contracts",
    title: "2. Core Java: values, objects, collections, and contracts",
    summary: "Types, equality, generics, exceptions, immutability, and the contracts frameworks rely on.",
    analogy: "The language gives every part of a machine a shape and rules; libraries work reliably when every part follows those rules.",
    explanation: "Framework code still follows ordinary Java rules. Primitive values and reference values behave differently; classes define state and methods; interfaces define contracts; generics constrain types at compile time; and collections encode choices about order, lookup, mutability, and concurrency. equals and hashCode must agree when instances are keys in hash-based collections. Exceptions describe failure paths, but catching an exception without a recovery plan can hide a broken invariant.",
    internals: [
      "A variable declared with a class type holds a reference value. Assignment copies that value; it does not clone the referenced object.",
      "Generics provide compile-time type checking, with type erasure in many common Java generic forms. Runtime type checks and generic signatures therefore do not behave like reified templates in every language.",
      "HashMap-like structures rely on equality/hash contracts and stable keys. Mutating fields used by equals/hashCode while a key is stored can make an entry difficult to find.",
      "Prefer immutable value objects for shared data where practical. A final reference does not make the referenced object immutable."
    ],
    exampleTitle: "Why a database entity needs a careful identity rule",
    example: "If a mutable entity is placed in a HashSet and its hash-relevant ID changes, the set may search the wrong bucket. Choose identity rules deliberately and understand entity lifecycle before using persistence objects as keys.",
    mistakes: ["== compares primitive values but reference identity for objects; equals is a separate method contract.", "final prevents reassignment of a variable/reference; it does not freeze the reachable object graph.", "Catching Exception broadly is not a substitute for knowing which failures can be recovered from."],
    exercise: "Write two small value objects and define when they should be equal. Explain what happens to a hash-based lookup if a key changes after insertion."
  },
  {
    id: "class-loading",
    title: "3. Class loading, linking, and initialization",
    summary: "How bytecode becomes usable runtime types—and where startup failures occur.",
    analogy: "A library checks a book into a catalog, verifies its pages, connects its cross-references, then runs its opening instructions when needed.",
    explanation: "A class loader finds bytes and asks the JVM to define a runtime class. The JVM verifies structural and type-safety rules, prepares class-level storage, resolves symbolic references when required, and initializes the class according to language rules. Initialization runs static field initializers and static blocks in the specified order. Not all classes must initialize eagerly at application start.",
    internals: [
      "Class identity includes both the binary class name and the defining class loader. Two loaders can define distinct runtime types with the same name.",
      "Linking includes verification, preparation, and resolution. Resolution can happen lazily; failures may surface at the first use of a type or member.",
      "A class loader can keep classes and their static references reachable. In reloadable environments, a loader that remains referenced can prevent an application class set from being unloaded."
    ],
    exampleTitle: "A useful failure map",
    example: "ClassNotFoundException often means explicit lookup failed. NoClassDefFoundError often means a required definition was unavailable or a prior initialization failed. IncompatibleClassChangeError points toward a binary mismatch. Read the first causal exception, not just the final wrapper.",
    mistakes: ["Class loading and class initialization are related but different phases.", "A static initializer is not a reliable place for slow network calls; it can make type initialization fragile.", "A class name alone does not uniquely identify a runtime class across class loaders."],
    exercise: "Find one startup stack trace and classify the earliest failure: locating a class, verifying/linking it, initializing it, or constructing an application component."
  },
  {
    id: "bytecode-execution",
    title: "4. Bytecode execution, interpretation, and JIT",
    summary: "How the JVM executes class files and why performance can change after warm-up.",
    analogy: "An interpreter follows the recipe directly; a compiler notices repeated work and prepares a faster route for it.",
    explanation: "The JVM executes the class-file instruction set. A runtime can interpret instructions and may compile frequently used methods or paths to machine code. Compilation thresholds, tiers, optimizations, and deoptimization strategies are implementation details. The language and bytecode model provide behavior; the runtime decides how to execute it efficiently on a particular platform.",
    internals: [
      "The bytecode instruction set is defined independently from one processor's native instruction set. A JVM implementation maps execution to the host machine.",
      "A JIT compiler can use runtime observations such as types and branch frequency. If an assumption stops being true, the runtime may deoptimize and resume through a less specialized path.",
      "Warm-up effects can come from class loading, JIT compilation, caches, connection establishment, and application initialization. Do not attribute every first-request delay to one cause.",
      "Terms such as C1 and C2 describe HotSpot compiler tiers; other JVMs may use different compilers and names."
    ],
    exampleTitle: "Compare cold and steady-state behavior",
    example: "Measure repeated requests with realistic input. Record latency percentiles, CPU, allocation, and compilation events; separate application startup from warmed-up service behavior.",
    mistakes: ["The JVM does not need to compile every method before the program can run.", "Interpreted-versus-compiled is not a universal two-state switch for the whole process.", "A microbenchmark without warm-up, forks, and controlled measurement can report misleading results."],
    exercise: "Explain why the first request after startup may be slower even when that request follows the same Java code path as later requests."
  },
  {
    id: "memory-map",
    title: "5. JVM memory: the model and the implementation",
    summary: "Heap, thread stacks, metadata, code cache, direct buffers, and native memory.",
    analogy: "A process is a building with shared storage, private workbenches, reference books, and equipment outside the main room.",
    explanation: "The JVM specification names logical runtime areas; it does not prescribe the physical layout of every implementation. Heap and stacks have precise roles in the model. ‘Method area’ is a specification term, while HotSpot commonly uses native-memory Metaspace for class metadata. Process memory also includes areas outside the Java heap, such as thread stacks, compiled code, direct buffers, native libraries, and memory-mapped files.",
    internals: [
      "The heap is shared among Java threads in the JVM model. Each Java thread has its own logical stack of frames; a frame exists during method execution.",
      "A reference is a value that identifies an object; it is not the object itself. A local reference may be in a frame while its object is reachable on the heap.",
      "A PC register and native-method support are per-thread concepts in the JVM specification. The physical representation remains implementation-specific.",
      "Heap max is not process max. In a container, native allocations and all thread stacks must fit alongside heap inside the effective memory limit."
    ],
    exampleTitle: "Interpret a memory snapshot",
    example: "If heap use is stable but resident process memory rises with thread count, inspect stack and native allocations. If class metadata rises after reloads, investigate class loaders. If heap rises after each request and does not fall after collection, inspect what retains the objects.",
    mistakes: ["Metaspace is not the JVM specification’s universal name for the method area.", "A stack trace is not a full memory map.", "A heap dump cannot account for all process memory."],
    exercise: "Explain why an application can hit a container memory limit while its reported Java heap is below the configured maximum."
  },
  {
    id: "objects-references",
    title: "6. Objects, references, and reachability",
    summary: "Allocation, aliasing, escape, object lifetime, and the limits of source-level memory diagrams.",
    analogy: "A reference is an address on a library card; the card is not the book, and several cards can point to the same book.",
    explanation: "When code creates an object, variables and fields hold references to it. Assigning one reference to another creates an alias, not a copy of the object. The garbage collector reclaims objects that are no longer reachable from the JVM’s roots. The language-level model is useful for reasoning, but optimizing compilers may eliminate or transform allocations when behavior remains equivalent.",
    internals: [
      "Common GC roots include live thread stacks, static references, JNI handles, and other VM-owned references. The exact root set and analysis are collector/runtime details.",
      "A field can retain a large graph of objects indirectly. A small map, listener, cache, thread-local, or static collection can keep much more memory alive than its own size suggests.",
      "Escape analysis may let a JVM optimize an allocation or remove synchronization, but code should be correct without assuming a particular optimization occurs."
    ],
    exampleTitle: "Reason about the graph",
    example: "request → response DTO → list → entity graph. If a long-lived cache stores the response list, the whole reachable graph may remain live after the request ends.",
    mistakes: ["Setting one variable to null does not guarantee an object is collectible if another reference remains.", "Calling System.gc() is not a reliable way to free a particular object.", "Garbage collection reclaims unreachable memory; it does not close files, release transactions, or return pooled resources automatically."],
    exercise: "Draw references for two variables that point to one object. Remove one reference and explain why the object is still reachable."
  },
  {
    id: "garbage-collection",
    title: "7. Garbage collection and memory pressure",
    summary: "Reachability, allocation rate, pauses, live sets, and interpreting collector metrics.",
    analogy: "A cleanup crew can clear unused items, but it cannot discard anything still marked as needed.",
    explanation: "Garbage collection is automatic storage management for objects that are no longer reachable. Many collectors optimize for common object lifetimes and split work into regions or generations, but collector algorithms, names, defaults, and pause trade-offs vary by JVM and version. A low heap reading after collection and a high allocation rate are different situations: one measures retained live objects, the other how quickly objects are created.",
    internals: [
      "Frequent short collections can be normal when short-lived objects are allocated quickly. Long pauses, repeated promotion, or a steadily growing post-collection live set need investigation in context.",
      "OutOfMemoryError can indicate heap exhaustion, inability to create threads, direct-buffer/native allocation pressure, or other resource limits. Read the exact error message and process/container metrics.",
      "GC tuning is usually later than fixing unbounded caches, large result sets, excessive allocation, or a leak. Establish a baseline before changing flags."
    ],
    exampleTitle: "Three measurements to pair",
    example: "Compare allocation rate, post-GC live set, and pause/throughput metrics over the same time window. Add request rate and process memory; any one chart alone can mislead.",
    mistakes: ["A full heap is not automatically a leak; a stable live set can be healthy.", "A GC event does not mean all memory was reclaimed.", "Collector names and generation labels are not universal across runtimes."],
    exercise: "Given a graph where heap spikes during traffic and returns to the same baseline after collection, describe what additional evidence you need before calling it a leak."
  },
  {
    id: "threads",
    title: "8. Threads, executors, and safe shared state",
    summary: "Request workers, stacks, races, locks, visibility, and why pools need bounds.",
    analogy: "Several workers share a room and tools; clear ownership rules keep them from overwriting each other’s work.",
    explanation: "A Java thread is an execution path with its own stack. Web servers commonly reuse worker threads, while event-driven runtimes use different scheduling models. When threads share mutable state, operations need a visibility and atomicity plan. Synchronization, locks, immutable data, concurrent collections, and message passing solve different problems; choose the simplest mechanism matching the invariant.",
    internals: [
      "count++ is a read, add, and write sequence; it is not automatically atomic. volatile helps visibility and ordering for certain accesses but does not make compound updates atomic.",
      "Executors control task submission and worker reuse. Unbounded queues can hide overload; unbounded thread creation can exhaust memory and scheduler capacity.",
      "Deadlock requires a cycle of waiting. Thread dumps can reveal lock ownership and stacks; repeated dumps help distinguish a stable deadlock from temporary blocking."
    ],
    exampleTitle: "Pool capacity is a system budget",
    example: "request workers × average blocking time, database connections, CPU cores, downstream rate limits, and queue length constrain throughput together. Increasing only one pool can move the bottleneck and increase latency.",
    mistakes: ["More threads do not guarantee more throughput.", "A concurrent collection does not make a multi-step business invariant atomic.", "Never keep a request thread waiting indefinitely on a slow downstream dependency."],
    exercise: "Name the shared variable in a lost-update example, then describe one fix and what it guarantees."
  },
  {
    id: "spring-container",
    title: "9. Spring: the container, beans, and proxies",
    summary: "Dependency injection, bean lifecycle, scopes, configuration, and AOP boundaries.",
    analogy: "Instead of each room ordering its own tools, a workshop manager assembles the tools and gives each room what it needs.",
    explanation: "Spring’s IoC container reads configuration metadata and creates, configures, and connects managed objects called beans. Dependency injection makes collaborators explicit. An ApplicationContext adds application-level facilities on top of the bean factory. Spring can create proxies for selected cross-cutting behavior such as transactions, but proxy behavior depends on how a call enters the object and which proxy mechanism applies.",
    internals: [
      "Constructor injection exposes required dependencies and supports immutable components. Bean scopes control lifecycle and sharing; singleton is a common default scope, not a promise that the object is thread-safe.",
      "Bean creation can include instantiation, dependency resolution, post-processors, proxy wrapping, initialization callbacks, and later destruction callbacks.",
      "A self-invocation that calls another method on the same object can bypass proxy-based advice. Transaction and security behavior must be understood at the actual call boundary."
    ],
    exampleTitle: "Follow one dependency",
    example: "Controller constructor needs an application service → Spring resolves the service bean → service constructor needs a repository → container creates the dependency graph before serving the relevant request.",
    mistakes: ["Dependency injection is object assembly; it does not make domain logic correct by itself.", "A bean is not always one instance per request.", "Annotations do not explain every lifecycle step; inspect configuration, scopes, and proxies when behavior is surprising."],
    exercise: "Trace a controller’s constructor dependency to its implementation. Identify whether transaction behavior is applied by a proxy, annotation, explicit transaction API, or not at all."
  },
  {
    id: "request-lifecycle",
    title: "10. One HTTP request, from browser to response",
    summary: "Ingress, middleware, routing, validation, business logic, errors, serialization, and return path.",
    analogy: "A parcel passes through reception, identity checks, a department, specialist desks, and dispatch; each handoff adds information and responsibility.",
    explanation: "An HTTP request may cross DNS, TLS termination, a proxy or gateway, a server connector, middleware, security, routing, application code, and downstream systems. In Spring MVC, DispatcherServlet acts as a front controller for servlet-based request mapping. The exact route and thread model depend on the stack: a reactive application is not simply a servlet request with a different annotation.",
    internals: [
      "Authentication asks who the caller is; authorization asks whether that identity may perform this operation. Validate input at the boundary and enforce domain invariants inside the application as well.",
      "A request ID should connect logs and traces across boundaries. Trace time spent in queueing, application work, database calls, and downstream calls separately.",
      "Exceptions should be translated into stable, safe responses. Return useful status codes without leaking stack traces, internal SQL, secrets, or sensitive data."
    ],
    exampleTitle: "A Spring MVC-style path",
    example: "HTTP connector → servlet filters/security → DispatcherServlet → handler mapping/adapter → controller → service → repository/client → exception or view/message conversion → HTTP response. Optional layers are marked by the application, not guaranteed in every request.",
    mistakes: ["A controller is not the entire request pipeline.", "A successful controller return does not prove a database transaction committed.", "A 200 response does not prove every downstream side effect completed correctly."],
    exercise: "Pick an endpoint and annotate where authentication, validation, transaction begin, SQL, commit, serialization, and response status occur."
  },
  {
    id: "database-transactions",
    title: "11. JDBC, pools, ORM, and transactions",
    summary: "Connection borrowing, SQL execution, persistence contexts, dirty checking, flush, and commit.",
    analogy: "A connection pool is a shared fleet of reusable vehicles; a transaction is a trip whose changes are either committed together or rolled back.",
    explanation: "JDBC is the Java API boundary for relational database work. A pool limits and reuses physical connections. An ORM maps object state to SQL but does not remove the need to understand queries, indexes, isolation, locks, or database plans. In JPA-style persistence, a persistence context tracks managed entities; changes may be synchronized to SQL at flush time, while commit is the transaction boundary that makes a successful transaction durable according to database rules.",
    internals: [
      "A pooled connection is borrowed and returned. Holding one during long CPU work or remote calls can starve other requests.",
      "Dirty checking can detect changes to managed entities; detached objects are not automatically tracked in the same way. Flush sends pending SQL but is not itself equivalent to commit.",
      "N+1 queries often appear when code loads a collection of records and triggers a separate query for each item. Measure query count and inspect generated SQL.",
      "Transactions do not automatically cover every call in a service. Propagation, isolation, timeouts, rollback rules, and proxy boundaries matter."
    ],
    exampleTitle: "Write path at a glance",
    example: "request validated → transaction begins → repository loads entity → business rule changes state → ORM flushes SQL → database checks constraints → commit succeeds → response is returned. If an exception occurs, verify whether the configured rules roll back.",
    mistakes: ["Flush is not commit.", "An ORM does not guarantee one query per repository method.", "A connection-pool maximum is not necessarily the right size for the database or workload."],
    exercise: "Review one list endpoint. Count SQL statements, identify the transaction boundary, and note when a connection is borrowed and returned."
  },
  {
    id: "deployment",
    title: "12. WAR, executable archives, containers, and versions",
    summary: "What changes with packaging and runtime setup—and what remains Java.",
    analogy: "The same machine can arrive in a shared workshop or in a self-contained case; the workbench arrangement changes, not the laws of motion.",
    explanation: "Spring MVC is a web request-handling framework; Spring Boot is an application bootstrap, configuration, and packaging approach that can use Spring MVC. They are not mutually exclusive choices. Traditional deployment often packages a web application for an external servlet container. Spring Boot commonly supports executable archives with an embedded servlet server, and it can also support traditional WAR deployment for suitable applications. Neither approach changes Java bytecode, JVM memory fundamentals, or the HTTP protocol. Reactive applications may use a different server stack. Compatibility depends on the selected JDK, framework, servlet API, build plugins, and deployment target versions.",
    internals: [
      "External-container startup: the container process starts, deploys the app, and invokes its framework integration. Embedded-server startup: the application launcher creates the framework context and starts its configured server.",
      "Configuration can come from packaged defaults, environment variables, command-line arguments, config files, secret stores, and platform settings; precedence varies by framework.",
      "A container image packages an application and runtime environment, but it does not remove host limits, network policy, storage, identity, or observability concerns."
    ],
    exampleTitle: "Compare the startup boundary",
    example: "External WAR: service manager → JVM → container → deploy web app → framework context. Embedded package: service manager → JVM/application launcher → framework context → embedded server. The process model and exact order can vary by implementation.",
    mistakes: ["Spring Boot is not a new JVM.", "A JAR is not automatically executable unless its packaging and launcher support that mode.", "A version-neutral mental model still requires checking real compatibility matrices before choosing versions."],
    exercise: "Write both startup sequences for your chosen packaging. Circle the component responsible for process restart, health checks, logs, and secret injection."
  },
  {
    id: "quality-security",
    title: "13. Tests, security, configuration, and reliability",
    summary: "The production habits that protect a backend beyond ‘it starts on my laptop’.",
    analogy: "A bridge needs design calculations, material checks, inspection points, and maintenance plans—not just a successful first crossing.",
    explanation: "Testing is layered: focused unit tests exercise decisions; integration tests check real framework, persistence, or messaging boundaries; contract and end-to-end tests check communication and user-visible behavior. Security and reliability are part of the request path: least privilege, validation, authentication, authorization, secret handling, timeouts, bounded retries, idempotency, and graceful shutdown all affect correctness.",
    internals: [
      "Keep secrets outside source control and avoid exposing them in logs or diagnostics. Use the platform’s approved secret/configuration mechanism and limit access by role.",
      "Retries can multiply load and duplicate side effects. Use timeouts, retry only suitable failures, add backoff and jitter, and make operations idempotent where required.",
      "Health checks should represent the dependency needed for the decision being made. Liveness, readiness, and dependency diagnostics answer different questions.",
      "Database schema changes need an order that works during rolling deployment, when old and new application instances may overlap."
    ],
    exampleTitle: "A test pyramid is a guide, not a quota",
    example: "Test a pricing rule with fast unit tests; test repository mapping against the supported database; test the public API contract and critical end-to-end flow. Keep tests deterministic and isolate time, network, randomness, and shared state.",
    mistakes: ["A green unit suite cannot prove production networking or credentials are correct.", "A retry without a timeout can keep threads and connections occupied indefinitely.", "A health endpoint should not leak topology, credentials, or stack traces."],
    exercise: "For one endpoint, list the authorization check, input validation, database transaction, external timeout, retry rule, and test that proves each requirement."
  },
  {
    id: "diagnostics",
    title: "14. Diagnose symptoms instead of guessing",
    summary: "A safe sequence for latency, CPU, memory, threads, and database incidents.",
    analogy: "A doctor checks symptoms, timeline, and instruments before choosing treatment; changing the first setting they see can hide the cause.",
    explanation: "Start with impact and time range. Correlate request rate, latency percentiles, error rate, saturation, JVM/process metrics, thread behavior, database latency, and deployment events. Logs give event detail, metrics show trends, and traces show a request’s path. Use JVM diagnostic tools supported by the deployed runtime; commands and permissions vary by JDK, container, and operating system.",
    internals: [
      "High CPU: identify the process and hot stacks, then compare thread dumps or a profiler recording. Do not infer CPU cause from heap graphs.",
      "High latency: break it down by queueing, application, database, and downstream spans. Check timeouts and pool saturation before increasing limits.",
      "Memory: compare heap used after collection with process/container RSS, direct/native memory, thread count, and recent traffic. A heap dump can contain personal data; store it securely.",
      "Useful JVM tools include jcmd, JFR, and runtime-specific monitoring interfaces when supported. Prefer low-overhead, scoped captures and know how to protect the resulting files."
    ],
    exampleTitle: "A practical incident checklist",
    example: "What changed? Which requests fail? When did it begin? Which resource is saturated? Is the bottleneck inside this process or downstream? Can a small, reversible mitigation reduce impact while preserving evidence?",
    mistakes: ["Do not start by changing heap, GC, thread, or pool flags without a measured hypothesis.", "A thread dump is a point-in-time view; repeated samples are more informative for stuck work.", "Heap dumps and recordings can be large and sensitive. Check disk space, access, and retention before capturing them."],
    exercise: "Pick one hypothetical symptom (slow request, rising RSS, deadlock, or database timeout) and write the first three observations you need before changing configuration."
  }
];

export const GLOSSARY = [
  ["Artifact", "The built output deployed or run, such as a library, WAR, or application archive."],
  ["Bean", "An object created and managed by a Spring IoC container."],
  ["Bytecode", "Instructions in a class file that a compatible JVM can execute."],
  ["Class loader", "A JVM mechanism that finds and defines runtime classes; its identity affects class identity."],
  ["Connection pool", "A bounded or configured manager that reuses database connections."],
  ["Dependency injection", "Supplying an object with collaborators instead of having it locate or construct them directly."],
  ["DispatcherServlet", "Spring MVC’s front controller for servlet-based request dispatch."],
  ["Flush", "Synchronizing pending persistence-context changes to SQL; distinct from transaction commit."],
  ["GC root", "A VM-recognized starting reference used to determine which objects remain reachable."],
  ["Heap", "A JVM runtime area shared by threads in which object and array allocation is modeled."],
  ["JDK", "A Java development kit containing development tools and runtime components; exact packaging varies."],
  ["JIT", "Just-in-time compilation of selected bytecode to machine code by a JVM implementation."],
  ["JVM", "A virtual-machine implementation that loads and executes class files under the Java platform model."],
  ["Metaspace", "HotSpot’s native-memory implementation area for class metadata; not a universal JVM-spec term."],
  ["Persistence context", "The JPA identity map and change-tracking context for managed entity instances."],
  ["Process RSS", "Resident physical memory attributed to a process; it includes more than Java heap."],
  ["Singleton scope", "A Spring scope that normally provides one bean instance per bean definition per container."],
  ["Transaction", "A database/application boundary that groups operations under defined commit and rollback behavior."],
  ["Volatile", "A Java field modifier that gives visibility/order guarantees for accesses, but not atomic compound updates."],
  ["WAR", "A web-application archive format commonly deployable to a compatible servlet container."]
];

export const CHECK_QUESTIONS = [
  {
    question: "If a Spring Boot application uses an embedded server, does it use a different JVM memory model?",
    options: ["Yes, Boot replaces the JVM", "No, the JVM fundamentals are the same", "Only the heap changes to server memory"],
    answer: 1,
    explanation: "Boot changes application configuration and often packaging/startup. The selected JVM still runs the Java bytecode and provides its runtime areas."
  },
  {
    question: "A local variable contains a reference to an object. Which statement is safest?",
    options: ["The reference and object are the same thing", "The object must be inside the stack frame", "The reference and object are distinct; physical optimizations can vary"],
    answer: 2,
    explanation: "The source-level model distinguishes a reference from its object. JVM optimizations mean you should not treat every local variable as a literal physical address or fixed memory location."
  },
  {
    question: "What does ORM flush mean?",
    options: ["The database transaction definitely committed", "Pending persistence changes are synchronized as SQL", "The connection pool is emptied"],
    answer: 1,
    explanation: "Flush sends pending changes to the database inside the current transaction. Commit is a separate transaction outcome."
  },
  {
    question: "A container is near its memory limit while Java heap is below its maximum. What should you inspect?",
    options: ["Only lower the heap immediately", "Thread stacks, direct/native memory, mapped files, libraries, and process metrics", "Ignore it because Java manages all memory"],
    answer: 1,
    explanation: "The process uses native and off-heap resources in addition to the Java heap. Measure them before changing limits."
  }
];
