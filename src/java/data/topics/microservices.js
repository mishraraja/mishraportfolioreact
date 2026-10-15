/* Microservices — concept cards and the boss fight. */

export const concepts = [
  {
    id: "monolith-vs-micro",
    title: "Monolith vs microservices",
    emoji: "🏬",
    hot: true,
    simple:
      "A monolith is one big restaurant kitchen: easy to run while it's small, chaos at scale. Microservices are a food court: each stall owns its menu, staff and fridge, and you can expand the busy one — but now you need walkways, signs and a plan for when a stall shuts.",
    points: [
      "Microservices are **independently deployable** services built around business capabilities (orders, payments, inventory).",
      "Each service **owns its data**. No reaching into another service's tables.",
      "**Wins**: independent deploys and scaling, fault isolation, team autonomy, freedom of tech choice.",
      "**Costs**: network latency and partial failure, no cross-service transactions, harder testing, heavy monitoring and tracing needs.",
      "A **modular monolith** is often the right start. Split when team size or scaling needs justify the operational cost.",
    ],
    say: "Microservices trade in-process simplicity for independent deployment and scaling; I'd split a modular monolith only when team or scaling needs justify the operational cost.",
    trap: "“Can two services share one database?” They shouldn't. Shared tables couple their schemas and releases; each service owns its data and shares it through APIs or events.",
  },
  {
    id: "api-gateway",
    title: "API gateway",
    emoji: "🏨",
    simple:
      "An API gateway is a hotel reception. Guests talk to one desk, which checks their key card, sends them to the right floor and stops anyone hammering the bell.",
    points: [
      "One **entry point** for clients, routing each request to the right service.",
      "Handles **cross-cutting concerns**: authentication (JWT checks), rate limiting, TLS termination, CORS, request logging.",
      "Spring Cloud Gateway, Kong, NGINX or a cloud API gateway.",
      "**Backend for Frontend (BFF)**: a gateway per client type (web, mobile) that shapes responses for it.",
      "Keep business logic *out* of the gateway.",
    ],
    code: `spring:
  cloud:
    gateway:
      routes:
        - id: orders
          uri: lb://order-service      # lb:// = look the service up in discovery
          predicates:
            - Path=/api/orders/**
          filters:
            - StripPrefix=1            # /api/orders/7 -> /orders/7`,
    lang: "yaml",
    say: "The gateway is the single front door: it routes to services and centralises auth, rate limiting and TLS, while business logic stays in the services.",
    trap: "“Gateway vs load balancer?” A load balancer spreads traffic across instances of *one* service; a gateway routes across *many* services and applies policies on the way.",
  },
  {
    id: "service-discovery",
    title: "Service discovery",
    emoji: "🗺️",
    simple:
      "Service instances come and go like food trucks. Service discovery is the live map: every truck registers where it's parked, and customers look it up instead of memorising an address.",
    points: [
      "Containers and autoscaling mean **IP addresses keep changing**.",
      "Instances register with a **registry** (Eureka, Consul) and send heartbeats; dead ones get dropped.",
      "**Client-side** discovery: the caller asks the registry and load-balances itself (Spring Cloud LoadBalancer).",
      "**Server-side** discovery: a load balancer or platform does it for you.",
      "On **Kubernetes**, Services and DNS already provide discovery — usually no Eureka needed.",
    ],
    code: `@Configuration
class Clients {
    @Bean
    @LoadBalanced                          // resolve service names through discovery
    RestClient.Builder restClientBuilder() {
        return RestClient.builder();
    }
}

// "inventory-service" is a name, not a host: discovery picks a live instance
Stock stock = restClientBuilder.build().get()
    .uri("http://inventory-service/api/stock/{sku}", sku)
    .retrieve()
    .body(Stock.class);`,
    say: "Services register themselves with a registry and callers resolve logical names to healthy instances; on Kubernetes the platform's Services and DNS do that job.",
    trap: "“Do you need Eureka on Kubernetes?” Usually not — Kubernetes Services already give you a stable name and load balancing.",
  },
  {
    id: "circuit-breaker",
    title: "Circuit breaker & resilience",
    emoji: "⚡",
    hot: true,
    lab: "circuit-breaker",
    simple:
      "A circuit breaker is your home's fuse box. When the payment service keeps failing, the fuse trips (OPEN) and calls fail instantly with a fallback instead of piling up. After a cool-down it lets a few test calls through (HALF_OPEN). If they work, the power's back on (CLOSED).",
    points: [
      "**CLOSED**: calls flow while the breaker counts failures in a sliding window. Failure rate over the threshold → **OPEN**.",
      "**OPEN**: calls **fail fast** or return a fallback, giving the sick service room to recover.",
      "After a wait → **HALF_OPEN**: a few trial calls. Success → CLOSED; any failure → OPEN again.",
      "It stops **cascading failures**, where callers' threads all hang on one slow dependency.",
      "Combine with **timeouts**, **retries with backoff** (idempotent calls only) and **bulkheads**. Resilience4j is the library (Hystrix is retired).",
    ],
    code: `@Service
class PaymentClient {

    @CircuitBreaker(name = "payments", fallbackMethod = "chargeLater")
    @Retry(name = "payments")
    public Receipt charge(Order order) {
        return rest.post().uri("/charges").body(order).retrieve().body(Receipt.class);
    }

    private Receipt chargeLater(Order order, Throwable cause) {
        pendingCharges.add(order);                 // degrade gracefully
        return Receipt.pending(order.id());
    }
}`,
    say: "A circuit breaker counts failures in a sliding window, opens to fail fast with a fallback, then half-opens to test recovery — so one slow dependency can't exhaust every caller's threads.",
    trap: "“Why not just retry?” Retrying a service that's down multiplies its load. The breaker stops calling it, and retries should only wrap idempotent calls, with backoff.",
  },
  {
    id: "sync-async",
    title: "Sync vs async: REST & Kafka",
    emoji: "📨",
    hot: true,
    simple:
      "Synchronous is a phone call: you wait on the line for the answer. Asynchronous is a text message: you send it and get on with your day, and the reply arrives whenever it arrives.",
    points: [
      "**REST / gRPC**: simple, immediate answers — but both sides must be up, and latency adds up along a chain of calls.",
      "**Messaging** (Kafka, RabbitMQ): decouples services, absorbs traffic spikes and lets consumers catch up later. The price is **eventual consistency**.",
      "**Kafka**: topics split into partitions, **order only within a partition**, consumer groups share partitions, messages are retained and replayable.",
      "**RabbitMQ**: flexible routing to queues, with per-message acknowledgements.",
      "Delivery is usually **at-least-once**, so consumers must be **idempotent**.",
    ],
    code: `// Publish: the order service neither knows nor waits for its listeners
kafkaTemplate.send("orders.placed", order.id().toString(), new OrderPlaced(order.id()));

// Consume: inventory reacts in its own time, and must cope with duplicates
@KafkaListener(topics = "orders.placed", groupId = "inventory")
void reserveStock(OrderPlaced event) {
    if (processed.alreadyHandled(event.orderId())) return;   // at-least-once delivery
    stock.reserveFor(event.orderId());
}`,
    say: "I use synchronous calls when the caller needs an answer now and events when services can react later — Kafka keeps order per partition, so I key messages by entity id and make consumers idempotent.",
    trap: "“How does Kafka keep ordering?” Only inside a partition. Use the entity id as the message key so all of one order's events land in the same partition.",
  },
  {
    id: "saga-outbox",
    title: "Saga & transactional outbox",
    emoji: "🧳",
    hot: true,
    simple:
      "Booking a holiday means a flight, a hotel and a car from three different companies. There's no single undo button, so every booking has a matching cancellation. If the car falls through, you cancel the hotel and the flight. That's a saga.",
    points: [
      "There's **no ACID transaction across services**, and two-phase commit blocks and scales badly.",
      "A **saga** is a sequence of local transactions, each with a **compensating action** to undo it.",
      "**Choreography**: services react to each other's events. **Orchestration**: one coordinator directs every step.",
      "**Transactional outbox**: write the event into an outbox table *in the same database transaction*, and let a relay publish it. That solves the **dual-write problem**.",
      "Use idempotency keys so retries don't charge a customer twice.",
    ],
    code: `@Transactional
public Order place(CreateOrder cmd) {
    Order order = orders.save(Order.pending(cmd));
    outbox.save(new OutboxEvent("OrderPlaced", order.id(), toJson(order)));  // same transaction
    return order;           // a relay publishes the outbox rows to Kafka afterwards
}

@KafkaListener(topics = "payments.failed", groupId = "orders")
void compensate(PaymentFailed event) {
    orders.cancel(event.orderId());               // the saga's undo step
}`,
    say: "Across services I use sagas — local transactions with compensating actions — plus a transactional outbox so the database write and the event can never disagree.",
    trap: "“What's the dual-write problem?” Writing to the database and publishing to Kafka are two systems; if one succeeds and the other fails, you're inconsistent. The outbox turns it into one local transaction.",
  },
  {
    id: "config-observability",
    title: "Config & observability",
    emoji: "📹",
    simple:
      "A config server is a shared noticeboard every service reads its settings from, so changing a timeout doesn't mean redeploying twenty services. Observability is the building's CCTV: logs say what happened, metrics say how much, and traces follow one visitor through every room.",
    points: [
      "Centralised config: **Spring Cloud Config** (backed by Git), or Kubernetes ConfigMaps and Secrets.",
      "**Logs**: structured JSON with a correlation or trace id on every line.",
      "**Metrics**: Micrometer → Prometheus → Grafana. Watch p95/p99 latency, error rate and saturation.",
      "**Traces**: OpenTelemetry or Micrometer Tracing propagate a `traceId` across calls (Zipkin, Jaeger, Tempo).",
      "Actuator health groups feed Kubernetes **liveness** and **readiness** probes.",
    ],
    code: `management:
  endpoints:
    web:
      exposure:
        include: health, info, prometheus
  endpoint:
    health:
      probes:
        enabled: true        # /actuator/health/liveness and /readiness
  tracing:
    sampling:
      probability: 0.1       # trace 10% of requests`,
    lang: "yaml",
    say: "I externalise config, emit structured logs with trace ids, export Micrometer metrics to Prometheus and propagate traces with OpenTelemetry, so one request can be followed across every service.",
    trap: "“Liveness vs readiness?” A failing liveness probe restarts the container; a failing readiness probe only stops traffic reaching it, for example while it warms up.",
  },
];

export const boss = [
  {
    q: "A circuit breaker is OPEN. What happens to the next call?",
    options: [
      "It's sent, and the result is cached",
      "It fails fast or returns the fallback, without calling the service",
      "It waits until the service recovers",
      "It's retried three times",
    ],
    answer: 1,
    why: "Open means the breaker has given up on the dependency for now: calls short-circuit until the wait duration ends and it half-opens.",
  },
  {
    q: "Why should each microservice own its database?",
    options: ["Databases are cheap", "Shared tables couple schemas and releases between services", "SQL can't serve two services", "Spring Cloud requires it"],
    answer: 1,
    why: "If two services share tables, neither can change its schema or deploy independently — which defeats the point of splitting them.",
  },
  {
    q: "Kafka guarantees message order…",
    options: ["Across a whole topic", "Within a single partition", "Only with one consumer group", "Never"],
    answer: 1,
    why: "Ordering holds per partition. Key messages by entity id so one entity's events stay together.",
  },
  {
    q: "The order is saved, then the app crashes before publishing OrderPlaced. Which pattern prevents that?",
    options: ["Circuit breaker", "Transactional outbox", "API gateway", "Service discovery"],
    answer: 1,
    why: "The event row commits with the order in one local transaction, and a relay publishes it later — nothing is lost between the two.",
  },
  {
    q: "Which failing probe makes Kubernetes stop routing traffic to a pod without restarting it?",
    options: ["Liveness", "Readiness", "Startup", "Heartbeat"],
    answer: 1,
    why: "Readiness controls traffic; liveness controls restarts.",
  },
];
