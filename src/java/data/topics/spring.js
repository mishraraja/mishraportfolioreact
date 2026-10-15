/* Spring Boot — concept cards and the boss fight. */

export const concepts = [
  {
    id: "ioc-di",
    title: "IoC & dependency injection",
    emoji: "🪄",
    hot: true,
    simple:
      "Without IoC, your class goes shopping for its own tools before it can work. With IoC, it arrives and the tools are already on the desk. Spring's container is the office manager who puts them there.",
    points: [
      "**Inversion of control**: the container (`ApplicationContext`) creates your objects and wires them together.",
      "**Constructor injection** (recommended): dependencies are explicit and `final`, and the class is trivial to unit test. A single constructor needs no `@Autowired`.",
      "**Setter injection** suits optional dependencies. **Field injection** hides dependencies and blocks `final` — avoid it.",
      "Several beans of one type? Mark one `@Primary`, or pick with `@Qualifier`.",
      "`ApplicationContext` extends `BeanFactory` with events, AOP, i18n and eager singleton creation. Boot 2.6+ rejects circular dependencies by default.",
    ],
    code: `@Service
public class CheckoutService {
    private final PaymentGateway gateway;
    private final OrderRepository orders;

    // Constructor injection: explicit, final, and easy to mock in tests
    public CheckoutService(@Qualifier("upiGateway") PaymentGateway gateway,
                           OrderRepository orders) {
        this.gateway = gateway;
        this.orders = orders;
    }
}`,
    say: "Inversion of control means the container creates and wires my objects; I use constructor injection so dependencies are explicit, final and easy to mock.",
    trap: "“Why avoid field injection?” Fields can't be final, the dependencies are hidden, and you can't build the class in a plain unit test without reflection.",
  },
  {
    id: "stereotypes",
    title: "@Component, @Service, @Repository, @Bean",
    emoji: "📛",
    simple:
      "Stereotype annotations are name badges: @Controller works the front desk, @Service does the thinking, @Repository talks to the database. @Configuration with @Bean is how you hire someone who didn't arrive with a badge — a class from a library you don't own.",
    points: [
      "`@Component` is the generic badge. `@Service` marks business logic.",
      "`@Repository` also **translates persistence exceptions** into Spring's `DataAccessException` hierarchy.",
      "`@RestController` = `@Controller` + `@ResponseBody`: return values are written as JSON.",
      "`@Bean` methods in a `@Configuration` class register objects you can't annotate yourself.",
      "`@SpringBootApplication` scans its **own package and sub-packages** for components.",
    ],
    code: `@Configuration
public class HttpClients {

    @Bean
    public RestClient paymentsClient(RestClient.Builder builder) {   // a class we don't own
        return builder
            .baseUrl("https://payments.internal")
            .build();
    }
}`,
    say: "@Component, @Service, @Repository and @Controller are specialised component-scan badges — @Repository adds exception translation — and @Bean registers third-party objects from a @Configuration class.",
    trap: "“My @Service isn't being picked up — why?” It's probably outside the main application class's package, so component scanning never sees it.",
  },
  {
    id: "bean-lifecycle",
    title: "Bean scopes & lifecycle",
    emoji: "🫘",
    hot: true,
    lab: "bean-lifecycle",
    simple:
      "A singleton bean is the office coffee machine: one, shared by everyone. A prototype bean is a paper cup: a fresh one each time you ask. The lifecycle is a bean's first day at work: built, given its tools, trained (@PostConstruct), put to work — and given a leaving party (@PreDestroy).",
    points: [
      "**Scopes**: `singleton` (default, one per container), `prototype` (new each time), and for web apps `request`, `session`, `application`.",
      "**Lifecycle**: instantiate → inject dependencies → Aware callbacks → `BeanPostProcessor` before-init → **`@PostConstruct`** → `afterPropertiesSet` → init-method → `BeanPostProcessor` after-init (**proxies are created here**) → ready → **`@PreDestroy`** → destroy.",
      "Spring **never calls destroy callbacks on prototype beans** — you own their clean-up.",
      "A prototype injected into a singleton is injected *once*. Use `ObjectProvider<T>` to get a fresh one each time.",
      "Singletons are shared by every request thread, so keep them **stateless**.",
    ],
    code: `@Component
public class RateCache {
    private final Map<String, BigDecimal> rates = new ConcurrentHashMap<>();

    @PostConstruct
    void warmUp() { rates.putAll(loadRates()); }   // dependencies are injected by now

    @PreDestroy
    void flush() { saveSnapshot(rates); }          // on shutdown (singletons only)
}

@Component
@Scope("prototype")
public class ReportBuilder { }                     // a new instance per request for the bean`,
    say: "Beans are singletons by default; the container instantiates, injects, runs post-processors and @PostConstruct, wraps proxies and calls @PreDestroy on shutdown — never for prototypes.",
    trap: "“Where does `@Transactional`'s proxy come from?” A BeanPostProcessor wraps the bean *after* initialisation, so the object you get injected is the proxy.",
  },
  {
    id: "auto-configuration",
    title: "Auto-configuration & starters",
    emoji: "🛋️",
    hot: true,
    simple:
      "Spring Boot is a flat that comes furnished. It sees what's in your build (a JPA starter, a Postgres driver) and sets up a sensible DataSource, EntityManager and transaction manager. The moment you bring your own sofa — your own bean — it steps aside.",
    points: [
      "`@SpringBootApplication` = `@Configuration` + `@EnableAutoConfiguration` + `@ComponentScan`.",
      "Auto-configurations are listed in `META-INF/spring/…AutoConfiguration.imports` (Boot 3; `spring.factories` in Boot 2).",
      "They're **conditional**: `@ConditionalOnClass`, `@ConditionalOnProperty`, and **`@ConditionalOnMissingBean`** — which is why your own bean wins.",
      "**Starters** are curated dependency bundles, like `spring-boot-starter-web` (Spring MVC, Jackson, embedded Tomcat).",
      "See what applied and why with `--debug` or `/actuator/conditions`.",
    ],
    code: `# Boot already built a DataSource because a driver is on the classpath.
# These properties only tune it.
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/shop
    username: shop
    password: \${DB_PASSWORD}
  jpa:
    open-in-view: false
server:
  port: 8081`,
    lang: "yaml",
    say: "@SpringBootApplication enables auto-configuration, which registers beans conditionally — on classes present, properties set and beans missing — so defining my own bean switches the default off.",
    trap: "“How do you find out why an auto-configuration didn't apply?” Run with `--debug` for the condition evaluation report, or call `/actuator/conditions`.",
  },
  {
    id: "rest-controllers",
    title: "REST controllers & mappings",
    emoji: "🛎️",
    hot: true,
    simple:
      "A controller is a restaurant's front counter. GET reads the menu, POST places a new order, PUT replaces an order, DELETE cancels one. @PathVariable is the table number in the URL, @RequestParam is “no onions”, and @RequestBody is the whole written order.",
    points: [
      "`@GetMapping`, `@PostMapping`, `@PutMapping`, `@PatchMapping`, `@DeleteMapping` under a class-level `@RequestMapping`.",
      "`@PathVariable` — `/orders/{id}` · `@RequestParam` — `?status=PAID` · `@RequestBody` — JSON into an object (Jackson).",
      "Return `ResponseEntity` to control the status and headers; add `@Valid` for Bean Validation (`@NotBlank`, `@Positive`).",
      "**GET, PUT and DELETE are idempotent**; POST isn't. PATCH updates part of a resource.",
      "Status codes: 200 OK · 201 Created · 204 No Content · 400 · 401 · 403 · 404 · 409 Conflict · 500.",
    ],
    code: `@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService service;
    public OrderController(OrderService service) { this.service = service; }

    @GetMapping("/{id}")
    public OrderDto get(@PathVariable long id) {
        return service.find(id);
    }

    @GetMapping
    public List<OrderDto> list(@RequestParam(defaultValue = "PAID") Status status) {
        return service.byStatus(status);
    }

    @PostMapping
    public ResponseEntity<OrderDto> create(@Valid @RequestBody CreateOrder body) {
        OrderDto created = service.create(body);
        return ResponseEntity.created(URI.create("/api/orders/" + created.id())).body(created);
    }
}`,
    say: "I map resources with @GetMapping/@PostMapping and friends, bind @PathVariable, @RequestParam and a validated @RequestBody, and return ResponseEntity when the status code matters — like 201 with a Location header.",
    trap: "“PUT vs PATCH?” PUT replaces the whole resource and is idempotent; PATCH changes only the fields you send.",
  },
  {
    id: "controller-advice",
    title: "Global exception handling",
    emoji: "🧯",
    lab: "request-journey",
    simple:
      "Instead of every chef handling their own kitchen fires, the restaurant has one fire marshal. @RestControllerAdvice catches exceptions from every controller and turns them into tidy, consistent error responses.",
    points: [
      "`@ExceptionHandler` inside a controller handles that controller only; in a **`@RestControllerAdvice`** it handles every controller.",
      "Map domain exceptions to status codes: `OrderNotFoundException` → 404, a validation failure → 400.",
      "A failed `@Valid @RequestBody` throws **`MethodArgumentNotValidException`**.",
      "Spring 6 ships **`ProblemDetail`** (RFC 9457) for a standard error body.",
      "Never leak stack traces or SQL to API clients.",
    ],
    code: `@RestControllerAdvice
public class ApiErrors {

    @ExceptionHandler(OrderNotFoundException.class)
    public ProblemDetail notFound(OrderNotFoundException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail invalid(MethodArgumentNotValidException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setProperty("fields",
            ex.getFieldErrors().stream().map(FieldError::getField).toList());
        return problem;
    }
}`,
    say: "I centralise error handling in a @RestControllerAdvice that maps exceptions to status codes and returns ProblemDetail bodies, so every endpoint fails the same way.",
    trap: "“Will a @RestControllerAdvice catch an exception thrown in a servlet filter?” No. Filters run before DispatcherServlet, so their errors never reach the advice.",
  },
  {
    id: "transactional",
    title: "@Transactional, really",
    emoji: "✉️",
    hot: true,
    lab: "request-journey",
    simple:
      "@Transactional is an all-or-nothing envelope: every database change inside it is posted together, or, if anything goes wrong, the whole envelope is torn up. Spring wraps your bean in a proxy that opens and seals the envelope around the method call.",
    points: [
      "It's **proxy-based**: begin before the method, commit after it, **roll back on RuntimeException or Error by default**. Checked exceptions need `rollbackFor`.",
      "**Self-invocation bypasses the proxy**: `this.otherMethod()` gets no transactional behaviour of its own.",
      "Propagation: **REQUIRED** (default — join or start one), **REQUIRES_NEW** (suspend the caller's, start a fresh one), `MANDATORY`, `NESTED`.",
      "Use `readOnly = true` for queries. Keep transactions short; no slow remote calls inside.",
    ],
    code: `@Service
public class TransferService {
    private final AccountRepository accounts;
    private final AuditService audit;

    public TransferService(AccountRepository accounts, AuditService audit) {
        this.accounts = accounts;
        this.audit = audit;
    }

    @Transactional
    public void transfer(long fromId, long toId, BigDecimal amount) {
        Account from = accounts.findById(fromId).orElseThrow();
        Account to = accounts.findById(toId).orElseThrow();
        from.debit(amount);                  // dirty checking saves both at commit
        to.credit(amount);                   // an exception here undoes the debit
        audit.record(fromId, toId, amount);  // another bean, so the proxy applies
    }
}

@Service
class AuditService {
    @Transactional(propagation = Propagation.REQUIRES_NEW)   // survives the caller's rollback
    public void record(long from, long to, BigDecimal amount) { /* insert an audit row */ }
}`,
    say: "@Transactional works through a proxy: it rolls back on unchecked exceptions by default, REQUIRED joins an existing transaction while REQUIRES_NEW suspends it, and a self-call skips the proxy entirely.",
    trap: "“A method calls a REQUIRES_NEW method in the *same* class — do you get a new transaction?” No. The self-call bypasses the proxy, so both run in one transaction.",
  },
  {
    id: "profiles-config",
    title: "Profiles & configuration",
    emoji: "👔",
    simple:
      "Profiles are outfits. The same app wears “dev” (an in-memory database, chatty logs) at home and “prod” (Postgres, secrets from a vault) at work. Properties are the labels sewn inside, read best through a typed @ConfigurationProperties class.",
    points: [
      "`application-{profile}.yml` files, activated with `spring.profiles.active` or `SPRING_PROFILES_ACTIVE`.",
      "`@Profile(\"dev\")` registers a bean only when that profile is active.",
      "Precedence, highest first: command-line arguments → environment variables → profile-specific files → `application.yml`.",
      "**`@ConfigurationProperties`** gives typed, validated, grouped config; `@Value` is fine for a single value.",
      "Secrets come from environment variables, Vault or a secrets manager — never from the repo.",
    ],
    code: `@ConfigurationProperties(prefix = "payments")
public record PaymentProps(String baseUrl, Duration timeout, int retries) {}

// application-prod.yml:
//   payments:
//     base-url: https://payments.internal
//     timeout: 2s
//     retries: 3

@Configuration
class Gateways {
    @Bean
    @Profile("dev")
    PaymentGateway fakeGateway() { return new FakeGateway(); }   // only in dev
}`,
    say: "I keep environment differences in profile-specific files, bind them into typed @ConfigurationProperties, and pull secrets from the environment or a vault.",
    trap: "“The same property is in application.yml and an environment variable — which wins?” The environment variable.",
  },
  {
    id: "filters-security",
    title: "Filters, interceptors & Spring Security",
    emoji: "🛂",
    simple:
      "A request passes security at the building gate (servlet filters — Spring Security lives here), then the floor receptionist (a HandlerInterceptor), then reaches your desk (the controller). Turn a bad badge away at the gate and nobody upstairs even hears about it.",
    points: [
      "**Filters** run *before* DispatcherServlet: authentication, CORS, request logging.",
      "**HandlerInterceptors** run around a controller call and know which handler was chosen.",
      "Spring Security is a **SecurityFilterChain**. Authentication = *who are you*; authorization = *what may you do*.",
      "Stateless APIs validate a **JWT** on every request; no server session.",
      "**401** = not authenticated. **403** = authenticated, but not allowed.",
    ],
    code: `@Bean
SecurityFilterChain api(HttpSecurity http) throws Exception {
    return http
        .csrf(csrf -> csrf.disable())                       // stateless API, no cookies
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/actuator/health").permitAll()
            .requestMatchers(HttpMethod.DELETE, "/api/**").hasRole("ADMIN")
            .anyRequest().authenticated())
        .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))   // validate JWTs
        .build();
}`,
    say: "Spring Security is a chain of servlet filters in front of DispatcherServlet; for APIs I go stateless with JWT validation, and 401 means unauthenticated while 403 means forbidden.",
    trap: "“Filter vs interceptor?” A filter is servlet-level and doesn't know which controller will run; an interceptor is Spring MVC-level and gets the handler.",
  },
];

export const boss = [
  {
    q: "Which injection style does the Spring team recommend for required dependencies?",
    options: ["Field injection with @Autowired", "Constructor injection", "Setter injection", "A static service locator"],
    answer: 1,
    why: "Constructor injection makes dependencies explicit and final, and the class can be built in a plain unit test.",
  },
  {
    q: "What's the default scope of a Spring bean?",
    options: ["prototype", "request", "singleton", "session"],
    answer: 2,
    why: "One shared instance per application context — which is why beans should be stateless.",
  },
  {
    q: "A @Transactional method calls this.audit(), which is annotated REQUIRES_NEW. What happens?",
    options: [
      "audit() gets its own new transaction",
      "audit() runs inside the caller's transaction — the self-call skips the proxy",
      "Spring throws an exception at startup",
      "audit() runs with no transaction at all",
    ],
    answer: 1,
    why: "Transaction attributes are applied by the proxy. A call on this never passes through it, so audit() joins the transaction that's already active.",
  },
  {
    q: "You define your own DataSource bean. What makes Boot's auto-configured one step aside?",
    options: ["@ConditionalOnMissingBean", "@Primary", "@Lazy", "@DependsOn"],
    answer: 0,
    why: "Auto-configured beans are guarded by @ConditionalOnMissingBean, so your bean takes their place.",
  },
  {
    q: "A @Valid @RequestBody fails validation. Which exception reaches your @RestControllerAdvice?",
    options: ["HttpMessageNotReadableException", "MethodArgumentNotValidException", "EntityNotFoundException", "DataIntegrityViolationException"],
    answer: 1,
    why: "Bean Validation failures on a request body raise MethodArgumentNotValidException — map it to a 400 with the field errors.",
  },
];
