/* SQL, JPA & Hibernate — concept cards and the boss fight. */

export const concepts = [
  {
    id: "acid",
    title: "ACID transactions",
    emoji: "🧪",
    hot: true,
    simple:
      "A bank transfer in a sealed envelope. Atomic: all of it happens or none of it. Consistent: the rules (no negative balances) hold before and after. Isolated: other people's transfers never see yours half-done. Durable: once the bank says “done”, a power cut can't undo it.",
    points: [
      "**Atomicity**: every statement commits, or everything rolls back.",
      "**Consistency**: constraints, foreign keys and checks stay valid.",
      "**Isolation**: concurrent transactions don't see each other's intermediate state — how much depends on the isolation level.",
      "**Durability**: committed data survives crashes, thanks to the write-ahead log.",
    ],
    code: `BEGIN;
UPDATE account SET balance = balance - 500 WHERE id = 1;
UPDATE account SET balance = balance + 500 WHERE id = 2;
-- a failure anywhere above -> ROLLBACK, as if nothing happened
COMMIT;   -- durable from here: written to the log before it returns`,
    lang: "sql",
    say: "ACID means a transaction is all-or-nothing, keeps constraints valid, is isolated from concurrent work to a chosen level, and survives crashes once committed.",
    trap: "“Is ACID's C the same as CAP's C?” No. ACID consistency means constraints hold; CAP consistency means every replica returns the latest write.",
  },
  {
    id: "isolation-levels",
    title: "Isolation levels & read anomalies",
    emoji: "🪟",
    hot: true,
    lab: "isolation",
    simple:
      "Two people editing one spreadsheet. A dirty read: you see their typing before they hit save. A non-repeatable read: you read a cell twice and it changed in between. A phantom read: you count the rows twice and a new row appeared. Each isolation level blocks one more of these.",
    points: [
      "**READ UNCOMMITTED** allows dirty reads.",
      "**READ COMMITTED** stops dirty reads, but a re-read can change. The default in Postgres, Oracle and SQL Server.",
      "**REPEATABLE READ** also stops non-repeatable reads. The SQL standard still allows phantoms (InnoDB and Postgres prevent most of them). The default in MySQL InnoDB.",
      "**SERIALIZABLE** behaves as if transactions ran one at a time: safest, slowest, and may abort with serialization failures you must retry.",
      "**Lost updates** — two read-then-write transactions overwriting each other — are usually fixed with optimistic locking (`@Version`) or `SELECT … FOR UPDATE`.",
    ],
    code: `@Entity
class Seat {
    @Id Long id;
    boolean booked;

    @Version Long version;   // UPDATE seat SET ... WHERE id = ? AND version = ?
}                            // 0 rows updated -> OptimisticLockException: someone else won

@Transactional(isolation = Isolation.REPEATABLE_READ)
public Report monthlyReport() { /* reads that must agree with each other */ }`,
    say: "Read uncommitted allows dirty reads, read committed stops them, repeatable read also stops non-repeatable reads and serializable stops phantoms — each step trades throughput for correctness, and I handle lost updates with @Version.",
    trap: "“Default isolation in Postgres and MySQL?” Postgres uses READ COMMITTED; MySQL InnoDB uses REPEATABLE READ.",
  },
  {
    id: "joins",
    title: "Joins, visualised",
    emoji: "🔗",
    hot: true,
    lab: "joins",
    simple:
      "Two lists: employees and departments. An INNER JOIN keeps only the people matched to a department. A LEFT JOIN keeps every employee and writes NULL where there's no department. RIGHT is the mirror image. FULL keeps everyone from both lists.",
    points: [
      "**INNER** — only matching rows. **LEFT** — every left row, NULLs where the right side has no match. **RIGHT** — the mirror.",
      "**FULL OUTER** — every row from both sides (MySQL doesn't have it; emulate with `UNION`).",
      "**CROSS** — every combination. **SELF** — a table joined to itself, like employee → manager.",
      "**Anti-join**: `LEFT JOIN … WHERE right.id IS NULL` finds rows with no match.",
      "On an outer join, a condition in `ON` behaves differently from the same condition in `WHERE`.",
    ],
    code: `-- Employees with no department (anti-join)
SELECT e.name
FROM employee e
LEFT JOIN department d ON d.id = e.dept_id
WHERE d.id IS NULL;

-- Each employee with their manager (self join)
SELECT e.name AS employee, m.name AS manager
FROM employee e
LEFT JOIN employee m ON m.id = e.manager_id;`,
    lang: "sql",
    say: "INNER keeps matches only, LEFT keeps every left row with NULLs for missing matches, FULL keeps both sides, and a LEFT JOIN with WHERE right.id IS NULL finds the rows that have no match.",
    trap: "“In a LEFT JOIN, what if `d.name = 'Sales'` goes in WHERE instead of ON?” It quietly becomes an inner join: rows with a NULL department are filtered out.",
  },
  {
    id: "indexes",
    title: "Indexes",
    emoji: "📇",
    hot: true,
    simple:
      "An index is the index at the back of a textbook. Instead of reading every page to find “Hibernate”, you jump straight to the right pages. Reads get fast — but every new page means updating the index too.",
    points: [
      "A **B-tree index** makes lookups O(log n) instead of a full table scan.",
      "**Clustered** index: rows are stored in key order (InnoDB's primary key). **Non-clustered**: a separate structure pointing at the rows.",
      "**Composite indexes follow the leftmost-prefix rule**: `(customer_id, created_at)` helps `WHERE customer_id = ?`, not `WHERE created_at > ?` alone.",
      "A **covering index** holds every column the query needs, so the table is never touched.",
      "Costs: slower writes and more storage. Wrapping a column in a function (`LOWER(email)`) prevents index use unless the index is on that expression. Check with `EXPLAIN`.",
    ],
    code: `CREATE INDEX idx_orders_customer_created ON orders (customer_id, created_at);

-- Seeks with the index: its leftmost column is filtered
EXPLAIN SELECT * FROM orders
WHERE customer_id = 42 ORDER BY created_at DESC LIMIT 10;

-- Can't seek with it: the leftmost column isn't filtered
EXPLAIN SELECT * FROM orders WHERE created_at > '2026-01-01';`,
    lang: "sql",
    say: "Indexes turn scans into B-tree lookups; I design composite indexes around the leftmost-prefix rule, check plans with EXPLAIN, and remember every index slows down writes.",
    trap: "“Why not index every column?” Every insert, update and delete has to maintain every index, and the optimiser ignores low-selectivity ones anyway.",
  },
  {
    id: "normalization",
    title: "Normalization (1NF → BCNF)",
    emoji: "🧹",
    simple:
      "Normalization is tidying a messy spreadsheet so each fact lives in exactly one place. When a customer moves, you change their address once — not in 400 order rows.",
    points: [
      "**1NF**: atomic values, no repeating groups (no `phone1, phone2`, no comma-separated lists).",
      "**2NF**: 1NF, and no column depends on only *part* of a composite key.",
      "**3NF**: 2NF, and no transitive dependencies (a non-key column depending on another non-key column, like zip → city).",
      "**BCNF**: every column that determines another is a candidate key.",
      "**Denormalization** is deliberate duplication for read speed (reports, read models), accepting update anomalies.",
    ],
    code: `-- Before: order_line(order_id, product_id, product_name, qty)
-- product_name depends only on product_id, part of the key: breaks 2NF

CREATE TABLE product (
  id    BIGINT PRIMARY KEY,
  name  VARCHAR(200) NOT NULL,
  price NUMERIC(10, 2) NOT NULL
);

CREATE TABLE order_line (
  order_id   BIGINT REFERENCES orders(id),
  product_id BIGINT REFERENCES product(id),
  qty        INT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,   -- the price at the time of sale
  PRIMARY KEY (order_id, product_id)
);`,
    lang: "sql",
    say: "Normalization stores each fact once — atomic columns, no partial or transitive dependencies — and I denormalize only deliberately, for read-heavy paths.",
    trap: "“Isn't copying `unit_price` into order_line a normalization mistake?” No. It's a different fact: the price when the order was placed, which must not change with the catalogue.",
  },
  {
    id: "sql-essentials",
    title: "SQL essentials & classic queries",
    emoji: "🧾",
    simple:
      "SQL has five toolboxes. DDL builds the shelves, DML puts things on them and takes them off, DQL looks at them, DCL hands out keys, and TCL says “save” or “undo”.",
    points: [
      "**DDL** `CREATE`, `ALTER`, `DROP`, `TRUNCATE` · **DML** `INSERT`, `UPDATE`, `DELETE` · **DQL** `SELECT` · **DCL** `GRANT`, `REVOKE` · **TCL** `COMMIT`, `ROLLBACK`, `SAVEPOINT`.",
      "**WHERE** filters rows *before* grouping; **HAVING** filters groups *after*.",
      "Logical order: `FROM` → `WHERE` → `GROUP BY` → `HAVING` → `SELECT` → `ORDER BY` → `LIMIT`.",
      "Window functions — `ROW_NUMBER`, `RANK`, `DENSE_RANK` — rank inside groups without collapsing rows.",
    ],
    code: `-- Second-highest salary
SELECT MAX(salary) FROM employee
WHERE salary < (SELECT MAX(salary) FROM employee);

-- Top earner(s) in each department
SELECT name, dept_id, salary
FROM (
  SELECT name, dept_id, salary,
         DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rnk
  FROM employee
) ranked
WHERE rnk = 1;

-- Departments with more than five people
SELECT dept_id, COUNT(*) FROM employee GROUP BY dept_id HAVING COUNT(*) > 5;`,
    lang: "sql",
    say: "WHERE filters rows before grouping and HAVING filters groups after, and for “top N per group” I reach for a window function like DENSE_RANK.",
    trap: "“DELETE vs TRUNCATE vs DROP?” DELETE removes chosen rows and fires triggers; TRUNCATE empties the whole table fast; DROP removes the table itself.",
  },
  {
    id: "jdbc",
    title: "JDBC & PreparedStatement",
    emoji: "🔌",
    simple:
      "A plain Statement glues user input straight into the SQL sentence, so a clever user can finish the sentence for you. A PreparedStatement keeps the sentence fixed and sends values separately, like filling in the blanks on a form.",
    points: [
      "Borrow a `Connection` from a pool (**HikariCP**, Boot's default), prepare the statement, bind parameters, execute, read the `ResultSet`, close with try-with-resources.",
      "**PreparedStatement prevents SQL injection** — parameters are values, never SQL — and lets the database reuse the plan.",
      "Use `addBatch` / `executeBatch` for bulk inserts.",
      "Spring's `JdbcTemplate` / `JdbcClient` remove the boilerplate.",
    ],
    code: `String sql = "SELECT id, email FROM users WHERE email = ?";
try (Connection con = dataSource.getConnection();
     PreparedStatement ps = con.prepareStatement(sql)) {
    ps.setString(1, email);                  // a value, never part of the SQL text
    try (ResultSet rs = ps.executeQuery()) {
        while (rs.next()) {
            users.add(new User(rs.getLong("id"), rs.getString("email")));
        }
    }
}

// Never: "... WHERE email = '" + email + "'"   ->   ' OR '1'='1`,
    say: "I always bind parameters with PreparedStatement — it prevents SQL injection and lets the database cache the plan — and take connections from a pool like HikariCP.",
    trap: "“Can you bind a table or column name as a parameter?” No, only values. Whitelist identifiers in code.",
  },
  {
    id: "jpa-lifecycle",
    title: "Entity states & dirty checking",
    emoji: "📝",
    hot: true,
    simple:
      "The persistence context is a waiter's notepad. Once an entity is on the notepad (managed), the waiter watches it. Change the order and the kitchen hears about it at the end of the transaction — no need to shout “save”.",
    points: [
      "States: **transient** (new, untracked) → **managed** (in the persistence context) → **detached** (context closed) or **removed**.",
      "**Dirty checking**: at flush or commit, Hibernate compares managed entities with their snapshots and writes the UPDATEs. No `save()` needed.",
      "**First-level cache** = the persistence context itself: per transaction, always on.",
      "**Second-level cache** is shared across sessions and optional — for data that rarely changes.",
      "Touch a lazy association on a detached entity → **LazyInitializationException**.",
    ],
    code: `@Transactional
public void rename(long id, String name) {
    Customer c = customers.findById(id).orElseThrow();   // managed
    c.setName(name);                                     // no save() needed:
}                                                        // dirty checking UPDATEs at commit

@Transactional(readOnly = true)
public boolean sameInstance(long id) {
    Customer a = customers.findById(id).orElseThrow();   // SQL SELECT
    Customer b = customers.findById(id).orElseThrow();   // first-level cache: no SQL
    return a == b;                                       // true
}`,
    say: "Managed entities are tracked by the persistence context, so changes are flushed by dirty checking at commit; the context doubles as the first-level cache, and a second-level cache is optional and shared.",
    trap: "“`findById` twice in one transaction — two queries?” No. The second comes from the persistence context, and it's the very same instance.",
  },
  {
    id: "n-plus-one",
    title: "The N+1 query problem",
    emoji: "🐌",
    hot: true,
    lab: "n-plus-one",
    simple:
      "You ask the librarian for a list of 50 authors — one trip. Then you walk back separately for each author's books — 50 more trips. One query for the list, plus N for the details: N+1.",
    points: [
      "Caused by touching a **lazy association inside a loop**.",
      "**EAGER doesn't fix it**: for a JPQL or derived query, Hibernate still loads each collection with its own SELECT — just straight away.",
      "Fixes: **`JOIN FETCH`**, **`@EntityGraph`**, **batch fetching** (`@BatchSize` or `default_batch_fetch_size`: 1 + N/size queries), or DTO projections.",
      "Defaults: `@ManyToOne` and `@OneToOne` are EAGER, `@OneToMany` and `@ManyToMany` are LAZY — set the to-one side LAZY too.",
      "Catch it early with SQL logging, Hibernate statistics or query-count assertions in tests.",
    ],
    code: `public interface AuthorRepository extends JpaRepository<Author, Long> {

    // Fix 1: a fetch join loads authors and books in one query
    @Query("select distinct a from Author a left join fetch a.books")
    List<Author> findAllWithBooks();

    // Fix 2: an entity graph on a derived query
    @EntityGraph(attributePaths = "books")
    List<Author> findByCountry(String country);
}

// The N+1 version: findAll() is 1 query, then 1 more per author
authorRepository.findAll().forEach(a -> System.out.println(a.getBooks().size()));`,
    say: "N+1 is one query for the parents plus one per parent for a lazy association; I spot it in the SQL logs and fix it with a fetch join, an entity graph or batch fetching — EAGER doesn't fix it.",
    trap: "“Does switching @OneToMany to EAGER fix N+1?” No. With a JPQL query Hibernate still fires one SELECT per collection — it just does it immediately.",
  },
  {
    id: "spring-data",
    title: "Spring Data JPA repositories",
    emoji: "🪄",
    simple:
      "Spring Data reads your method names like a sentence — findByEmailAndStatus — and writes the query for you. You write the interface; it writes the class.",
    points: [
      "`CrudRepository` → `PagingAndSortingRepository` → **`JpaRepository`**.",
      "**Derived queries** from method names: `findBy`, `existsBy`, `countBy`, with `And`, `Or`, `Between`, `LessThan`, `Containing`, `OrderBy`.",
      "`@Query` for JPQL (or `nativeQuery = true`); `Pageable` and `Sort` for paging.",
      "**Projections** (interfaces or records) load only the columns you need.",
      "Update and delete queries need `@Modifying`, inside a transaction.",
    ],
    code: `public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByCustomerIdAndStatusOrderByCreatedAtDesc(long customerId, Status status);

    boolean existsByReference(String reference);

    Page<Order> findByStatus(Status status, Pageable pageable);

    @Query("select o.id as id, o.total as total from Order o where o.total > :min")
    List<OrderSummary> bigOrders(@Param("min") BigDecimal min);   // interface projection

    @Modifying(clearAutomatically = true)
    @Query("update Order o set o.status = :to where o.status = :from and o.createdAt < :cutoff")
    int expire(@Param("from") Status from, @Param("to") Status to, @Param("cutoff") Instant cutoff);
}`,
    say: "Spring Data generates repository implementations from method names or @Query, supports paging and projections, and needs @Modifying for bulk updates.",
    trap: "“After a @Modifying bulk update, why do entities you already loaded still show old values?” The update bypasses the persistence context — use `clearAutomatically = true`.",
  },
];

export const boss = [
  {
    q: "Which isolation level stops dirty reads but still allows non-repeatable reads?",
    options: ["READ UNCOMMITTED", "READ COMMITTED", "REPEATABLE READ", "SERIALIZABLE"],
    answer: 1,
    why: "READ COMMITTED only shows committed data, but a second read can see another transaction's newly committed change.",
  },
  {
    q: "You load 50 authors, then call author.getBooks().size() for each one (LAZY). How many queries run?",
    options: ["1", "2", "50", "51"],
    answer: 3,
    why: "One query for the authors, plus one per author for their books: N+1 = 51.",
  },
  {
    q: "There's an index on (last_name, first_name). Which WHERE clause can seek with it?",
    options: ["first_name = 'Asha'", "last_name = 'Rao'", "UPPER(last_name) = 'RAO'", "None of them"],
    answer: 1,
    why: "The leftmost-prefix rule: the index is sorted by last_name first. Wrapping the column in a function hides it from the index.",
  },
  {
    q: "Inside @Transactional you load an entity and call setName(), but never save(). What happens at commit?",
    options: ["Nothing — you have to call save()", "Hibernate writes an UPDATE through dirty checking", "An exception is thrown", "It's saved only if the entity is EAGER"],
    answer: 1,
    why: "Managed entities are compared with their snapshots at flush time, and any changes are written automatically.",
  },
  {
    q: "Why use a PreparedStatement instead of concatenating values into SQL?",
    options: ["It's shorter", "Parameters are sent as values, which prevents SQL injection", "It doesn't need a connection", "It avoids transactions"],
    answer: 1,
    why: "User input never becomes SQL text, so ' OR '1'='1 stays a harmless string. The database can also reuse the plan.",
  },
];
