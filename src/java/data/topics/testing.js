/* Testing — concept cards and the boss fight. */

export const concepts = [
  {
    id: "test-pyramid",
    title: "The test pyramid",
    emoji: "🔺",
    simple:
      "Picture a pyramid. At the bottom, lots of fast unit tests check single bricks. In the middle, fewer integration tests check the bricks fit together. At the top, a handful of end-to-end tests walk through the finished house.",
    points: [
      "**Unit tests**: one class, dependencies mocked, milliseconds each.",
      "**Integration tests**: real Spring wiring and a real database (Testcontainers).",
      "**Contract tests** check that services agree on their APIs (Spring Cloud Contract, Pact).",
      "**End-to-end tests**: few, slow, flaky-prone — keep them to the critical journeys.",
      "Good tests are **FIRST**: Fast, Independent, Repeatable, Self-validating, Timely. Structure them as *given / when / then*.",
    ],
    code: `@Test
void appliesTenPercentDiscountForGoldCustomers() {
    // given
    Customer gold = new Customer("asha", Tier.GOLD);

    // when
    BigDecimal price = pricing.priceFor(gold, new BigDecimal("200.00"));

    // then
    assertEquals(new BigDecimal("180.00"), price);
}`,
    say: "I keep a wide base of fast unit tests, a focused layer of integration tests against real infrastructure, and only a few end-to-end tests for critical journeys.",
    trap: "“Why not test mostly end to end?” They're slow and flaky, and a failure doesn't tell you which line broke — a unit test does.",
  },
  {
    id: "junit5",
    title: "JUnit 5 essentials",
    emoji: "🧑‍⚖️",
    simple:
      "JUnit is the referee. @Test marks each match, @BeforeEach sets up the pitch before every match, and assertions blow the whistle when something's wrong.",
    points: [
      "`@Test`, `@BeforeEach` / `@AfterEach`, `@BeforeAll` / `@AfterAll` (static by default), `@DisplayName`, `@Nested`, `@Disabled`.",
      "`assertEquals`, `assertTrue`, **`assertThrows`**, `assertAll` (reports every failure together), `assertTimeout`.",
      "**`@ParameterizedTest`** with `@ValueSource`, `@CsvSource` or `@MethodSource` — one test, many inputs.",
      "JUnit 5 = **Platform** (runs tests) + **Jupiter** (the new API) + **Vintage** (runs JUnit 4 tests).",
      "AssertJ's `assertThat(x).isEqualTo(y)` reads better and fails with clearer messages.",
    ],
    code: `class PasswordPolicyTest {

    private final PasswordPolicy policy = new PasswordPolicy();

    @ParameterizedTest
    @CsvSource({ "short1!, false", "longenough1!, true", "nodigits!!!!, false" })
    void validatesPasswords(String password, boolean expected) {
        assertEquals(expected, policy.isValid(password));
    }

    @Test
    void rejectsNull() {
        IllegalArgumentException ex =
            assertThrows(IllegalArgumentException.class, () -> policy.isValid(null));
        assertEquals("password is required", ex.getMessage());
    }
}`,
    say: "In JUnit 5 I use parameterized tests to cover many inputs, assertThrows for failure paths and assertAll when one scenario has several checks.",
    trap: "“Must `@BeforeAll` be static?” Yes, unless the class is annotated `@TestInstance(Lifecycle.PER_CLASS)`.",
  },
  {
    id: "mockito",
    title: "Mockito: mocks, spies & verify",
    emoji: "🎬",
    hot: true,
    lab: "mock-spy",
    simple:
      "A mock is a cardboard stunt double: it looks like the real actor but does nothing unless you script it. A spy is the real actor wearing an earpiece: they do their real job unless you whisper a different line.",
    points: [
      "**mock()**: every method returns a default — `0`, `false`, `null`, an empty collection — until you stub it.",
      "Stub with `when(x.call()).thenReturn(...)` or `thenThrow(...)`. Check interactions with `verify(x, times(1)).call()` and `never()`.",
      "**spy()** wraps a real object: **real methods run** unless stubbed.",
      "Stub a spy with **`doReturn(v).when(spy).call()`** — `when(spy.call())` runs the real method while you're still setting up.",
      "`@Mock` + `@InjectMocks` with `@ExtendWith(MockitoExtension.class)`. Capture arguments with `ArgumentCaptor`.",
    ],
    code: `@ExtendWith(MockitoExtension.class)
class CheckoutServiceTest {

    @Mock PaymentGateway gateway;
    @Mock OrderRepository orders;
    @InjectMocks CheckoutService checkout;

    @Test
    void chargesTheCustomerAndSavesAPaidOrder() {
        when(gateway.charge(any())).thenReturn(Receipt.ok("tx-1"));

        checkout.pay(cartWith("pen", 120));

        ArgumentCaptor<Order> saved = ArgumentCaptor.forClass(Order.class);
        verify(orders).save(saved.capture());
        assertEquals(Status.PAID, saved.getValue().status());
        verify(gateway, times(1)).charge(any());
    }
}`,
    say: "A mock returns defaults until stubbed, while a spy wraps a real object and runs real code unless stubbed; I stub with when/thenReturn, use doReturn for spies, and verify the interactions that matter.",
    trap: "“Why does `when(spy.loadFromDb()).thenReturn(x)` still hit the database?” Because `spy.loadFromDb()` really runs while the stub is being set up. Use `doReturn(x).when(spy).loadFromDb()`.",
  },
  {
    id: "spring-test-slices",
    title: "@SpringBootTest vs test slices",
    emoji: "🍰",
    hot: true,
    simple:
      "@SpringBootTest opens the whole restaurant just to taste one dish. Test slices open a single room: @WebMvcTest only the front counter, @DataJpaTest only the storeroom. They're faster, and you know exactly what broke.",
    points: [
      "**@SpringBootTest** loads the full context — for integration tests, often with `webEnvironment = RANDOM_PORT`.",
      "**@WebMvcTest(Controller.class)** loads only the MVC layer (controllers, advice, filters, converters) and gives you **MockMvc**. Services are replaced with `@MockitoBean`.",
      "**@DataJpaTest** loads JPA repositories, and **rolls back after each test**.",
      "Other slices: `@JsonTest`, `@RestClientTest`, `@WebFluxTest`.",
      "Spring caches contexts between tests; a different set of mock beans means a new context, which is slow.",
    ],
    code: `@WebMvcTest(OrderController.class)
class OrderControllerTest {

    @Autowired MockMvc mvc;
    @MockitoBean OrderService service;      // @MockBean before Spring Boot 3.4

    @Test
    void returns404WhenTheOrderDoesNotExist() throws Exception {
        when(service.find(7L)).thenThrow(new OrderNotFoundException(7L));

        mvc.perform(get("/api/orders/7"))
           .andExpect(status().isNotFound());
    }

    @Test
    void rejectsAnOrderWithNoItems() throws Exception {
        mvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\\"items\\": []}"))
           .andExpect(status().isBadRequest());
    }
}`,
    say: "I test controllers with @WebMvcTest and MockMvc, repositories with @DataJpaTest, and keep @SpringBootTest for a few end-to-end integration tests, because slices are faster and more focused.",
    trap: "“Does @WebMvcTest load my @Service beans?” No. Only web-layer beans are loaded — you provide services as mocks.",
  },
  {
    id: "testcontainers",
    title: "Testcontainers",
    emoji: "🐳",
    simple:
      "An in-memory H2 database is a cardboard cut-out of Postgres: it looks similar until you lean on it. Testcontainers starts the real Postgres in Docker for your tests, then throws it away.",
    points: [
      "H2's SQL dialect differs from Postgres and MySQL (JSONB, native queries, locking), so bugs hide until production.",
      "Testcontainers runs **real** Postgres, Kafka, Redis and more in throwaway Docker containers.",
      "Spring Boot 3.1+ **`@ServiceConnection`** wires connection details from the container automatically.",
      "Share one static container across tests for speed, and run your Flyway or Liquibase migrations against it.",
    ],
    code: `@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class OrderRepositoryTest {

    @Container
    @ServiceConnection                    // Boot points the DataSource at this container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired OrderRepository orders;

    @Test
    void findsOnlyPaidOrders() {
        orders.save(Order.paid("A-1"));
        orders.save(Order.pending("A-2"));

        assertEquals(1, orders.findByStatus(Status.PAID, Pageable.unpaged()).getTotalElements());
    }
}`,
    say: "I run repository and integration tests against real infrastructure with Testcontainers and @ServiceConnection, because an in-memory database hides dialect and locking differences.",
    trap: "“Does data saved in a @DataJpaTest leak into the next test?” No. Each test runs in a transaction that rolls back.",
  },
  {
    id: "tdd-coverage",
    title: "TDD & code coverage",
    emoji: "🚥",
    simple:
      "TDD is writing the exam question before the answer. Red: a failing test. Green: the simplest code that passes. Refactor: tidy up while the test watches your back. Coverage shows which lines ran during tests — not whether anyone checked the result.",
    points: [
      "**Red → green → refactor**, in small loops.",
      "TDD pushes you towards testable design and leaves a safety net behind for every change.",
      "**JaCoCo** measures line and branch coverage (`mvn verify`, then `target/site/jacoco`), and can fail the build under a threshold.",
      "Coverage measures *execution*, not *verification*: a test with no assertions still covers lines.",
      "**Mutation testing** (PIT) plants small bugs and checks whether your tests notice.",
    ],
    code: `mvn clean verify                               # tests + the JaCoCo coverage check
open target/site/jacoco/index.html             # line and branch coverage report
mvn org.pitest:pitest-maven:mutationCoverage   # do the tests catch injected bugs?`,
    lang: "shell",
    say: "TDD is red, green, refactor; I read JaCoCo coverage as a map of untested branches rather than a target, because coverage proves code ran, not that it was checked.",
    trap: "“Can 100% coverage still miss bugs?” Easily: a test that runs every line but asserts nothing covers everything and verifies nothing.",
  },
];

export const boss = [
  {
    q: "On a Mockito mock, an unstubbed method that returns int gives you…",
    options: ["null", "0", "The real method's result", "An exception"],
    answer: 1,
    why: "Mocks return type defaults: 0 for numbers, false for booleans, null for objects, empty for collections.",
  },
  {
    q: "Which annotation loads only the web layer and gives you MockMvc?",
    options: ["@SpringBootTest", "@DataJpaTest", "@WebMvcTest", "@JsonTest"],
    answer: 2,
    why: "@WebMvcTest is the MVC slice: controllers, advice and filters, with services mocked.",
  },
  {
    q: "You want a spy's method to return a canned value without its real code ever running. Use…",
    options: ["when(spy.method()).thenReturn(x)", "doReturn(x).when(spy).method()", "verify(spy).method()", "spy(x).method()"],
    answer: 1,
    why: "when(spy.method()) calls the real method while setting up the stub. doReturn never calls it.",
  },
  {
    q: "What does @DataJpaTest do with the data a test saved?",
    options: ["Commits it", "Rolls it back after the test", "Truncates every table", "Keeps it for the next test"],
    answer: 1,
    why: "Each @DataJpaTest method runs in a transaction that's rolled back, so tests stay independent.",
  },
  {
    q: "The TDD cycle, in order?",
    options: ["Refactor, red, green", "Green, red, refactor", "Red, green, refactor", "Red, refactor, green"],
    answer: 2,
    why: "Write a failing test, make it pass with the simplest code, then clean up with the test as your safety net.",
  },
];
