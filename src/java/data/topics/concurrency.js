/* Multithreading — concept cards and the boss fight. */

export const concepts = [
  {
    id: "creating-threads",
    title: "Thread, Runnable & Callable",
    emoji: "🧑‍🍳",
    simple:
      "A Runnable is a job card with no box for a result. A Callable is a job card with a result box, and permission to report a problem. A Thread is a worker you'd hire yourself — but usually you hand job cards to an agency (an ExecutorService) instead.",
    points: [
      "**Runnable**: `void run()` — no result, no checked exceptions.",
      "**Callable<V>**: `V call() throws Exception` — submit it and get a **Future** back.",
      "`start()` creates a new thread that calls `run()`. Calling `run()` yourself just runs the code **on the current thread**.",
      "Extending `Thread` uses up your one superclass. Implement Runnable, or better, submit tasks to an executor.",
    ],
    code: `Runnable job = () -> System.out.println("on " + Thread.currentThread().getName());
new Thread(job).start();     // runs on a new thread
job.run();                   // runs right here, on the caller's thread

Callable<Integer> price = () -> pricingClient.fetch(sku);   // returns a value, may throw
ExecutorService pool = Executors.newFixedThreadPool(4);
Future<Integer> future = pool.submit(price);
int value = future.get(2, TimeUnit.SECONDS);   // blocks until done, or times out
pool.shutdown();`,
    say: "Runnable returns nothing, Callable returns a value and can throw; start() spawns a thread while run() is just a method call — and in production code I submit tasks to an ExecutorService.",
    trap: "“What if you call `start()` twice on the same Thread?” `IllegalThreadStateException`. A thread can only be started once.",
  },
  {
    id: "thread-lifecycle",
    title: "The thread lifecycle",
    emoji: "🔄",
    hot: true,
    lab: "thread-states",
    simple:
      "A thread's life story: born (NEW), ready to work (RUNNABLE), stuck outside a locked door (BLOCKED), waiting for someone to call (WAITING), napping with an alarm set (TIMED_WAITING), and retired (TERMINATED).",
    points: [
      "**NEW** → `start()` → **RUNNABLE**. Java doesn't separate “running” from “ready to run”.",
      "**BLOCKED**: waiting to enter a `synchronized` block whose monitor another thread holds.",
      "**WAITING**: `wait()`, `join()` or `LockSupport.park()` with no timeout — until another thread signals.",
      "**TIMED_WAITING**: `sleep(ms)`, `wait(ms)`, `join(ms)`. **TERMINATED**: `run()` returned or threw.",
      "`sleep()` **keeps** any locks it holds; `wait()` **releases** the monitor, and after `notify()` the thread must win the monitor back (BLOCKED) before it runs.",
    ],
    code: `Object lock = new Object();
Thread worker = new Thread(() -> {
    synchronized (lock) {
        try {
            lock.wait();                       // releases lock -> WAITING
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt(); // restore the flag, never swallow it
        }
    }
});
System.out.println(worker.getState());   // NEW
worker.start();                          // RUNNABLE, then WAITING inside wait()`,
    say: "The states are NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING and TERMINATED; BLOCKED means waiting for a monitor, WAITING means waiting for a signal — and sleep keeps locks while wait releases them.",
    trap: "“sleep() vs wait()?” `sleep` is a static Thread method that keeps locks. `wait` is an Object method, must be called while holding that object's monitor, releases it and waits for `notify`.",
  },
  {
    id: "race-synchronized",
    title: "Race conditions & synchronized",
    emoji: "🏁",
    hot: true,
    lab: "race",
    simple:
      "Two cashiers share one sales notebook. Both read “10”, both write “11”. One sale just vanished. `synchronized` hands out a single pen: only the cashier holding it may read and write.",
    points: [
      "`count++` is **three steps**: read, add, write. Two threads can interleave them and lose an update.",
      "A **race condition** is any bug where the result depends on thread timing. The code that must not interleave is the **critical section**.",
      "`synchronized` methods lock `this`; `static synchronized` locks the Class object; a synchronized block locks whatever object you name.",
      "Intrinsic locks are **reentrant**: a thread that holds a lock can enter it again.",
      "Lock on a `private final` object, so outside code can't grab your lock.",
    ],
    code: `class Counter {
    private int count = 0;
    private final Object lock = new Object();

    void unsafeIncrement() {
        count++;                      // read, add, write: threads can interleave
    }

    void safeIncrement() {
        synchronized (lock) {         // one thread at a time in here
            count++;
        }
    }
}`,
    say: "count++ is a read-modify-write, so unsynchronized threads can lose updates; synchronized makes that critical section mutually exclusive using the object's monitor.",
    trap: "“Do two synchronized methods on two *different* objects block each other?” No. Each object has its own monitor.",
  },
  {
    id: "volatile",
    title: "volatile & visibility",
    emoji: "👀",
    simple:
      "Each thread may be reading its own sticky-note copy of a variable from the CPU cache. `volatile` says “always read the whiteboard, never your sticky note.” It fixes *seeing* changes, not *coordinating* them: two threads can still write at once.",
    points: [
      "Without `volatile`, a thread might **never see** another thread's write (CPU caches, JIT optimisations).",
      "`volatile` guarantees every read sees the **latest write**.",
      "It does **not** make compound actions atomic: `volatile int n; n++` still races.",
      "Good for stop flags and the instance field in double-checked locking. Use atomics or locks for counters.",
    ],
    code: `class Poller implements Runnable {
    private volatile boolean running = true;   // written by one thread, read by another

    public void run() {
        while (running) {
            poll();
        }
    }

    void stop() {
        running = false;                       // the loop is guaranteed to see this
    }
}`,
    say: "volatile guarantees visibility of the latest write across threads, but not atomicity — perfect for a shutdown flag, wrong for a counter.",
    trap: "“Is `volatile int hits; hits++` thread-safe?” No. It's still read, add, write.",
  },
  {
    id: "atomics-cas",
    title: "Atomics & compare-and-swap",
    emoji: "⚛️",
    lab: "race",
    simple:
      "Compare-and-swap is editing a shared doc with a rule: “only save if nobody changed it since I opened it.” If someone did, you re-read and try again. No locks, and no queue.",
    points: [
      "`AtomicInteger`, `AtomicLong` and `AtomicReference` are built on **CAS**, a single CPU instruction.",
      "`incrementAndGet` loops: read, compute, `compareAndSet`, and retry if another thread got there first.",
      "Lock-free means no thread ever blocks. Under heavy contention, **LongAdder** scales better for counters.",
      "The **ABA problem**: the value goes A → B → A, so CAS succeeds even though something changed. `AtomicStampedReference` adds a version.",
    ],
    code: `AtomicInteger orders = new AtomicInteger();
orders.incrementAndGet();                          // an atomic ++

// Roughly what incrementAndGet does:
int current, next;
do {
    current = orders.get();
    next = current + 1;
} while (!orders.compareAndSet(current, next));    // someone beat us? try again

LongAdder pageViews = new LongAdder();             // best for very hot counters
pageViews.increment();`,
    say: "Atomic classes use compare-and-swap: read, compute, and write only if the value is unchanged, retrying otherwise — lock-free, and usually faster than synchronized for simple counters.",
    trap: "“What's the ABA problem?” CAS only checks the value, so A → B → A looks unchanged; a stamped reference adds a version number to catch it.",
  },
  {
    id: "executors",
    title: "ExecutorService & thread pools",
    emoji: "🍳",
    hot: true,
    lab: "thread-pool",
    simple:
      "A thread pool is a kitchen with a few permanent chefs and a ticket rail. A new order goes to a free chef, otherwise onto the rail. Only when the rail is full do you call in temporary chefs — and if they're busy too, the order is turned away.",
    points: [
      "Creating threads is expensive; a pool **reuses** them.",
      "`ThreadPoolExecutor(core, max, keepAlive, queue, handler)`: fewer than **core** threads → start one; else **queue** it; queue full → grow to **max**; still full → **reject**.",
      "`newFixedThreadPool` uses an **unbounded** queue: it never grows past core, and the queue can eat all your memory.",
      "Rejection policies: `AbortPolicy` (default, throws), `CallerRunsPolicy` (the caller runs it, which slows producers — backpressure).",
      "Always `shutdown()`. Size CPU-bound pools near the core count; I/O-bound pools can be larger, or use virtual threads.",
    ],
    code: `ThreadPoolExecutor pool = new ThreadPoolExecutor(
    4,                                   // core threads
    8,                                   // max threads
    30, TimeUnit.SECONDS,                // idle extra threads die after this
    new ArrayBlockingQueue<>(100),       // bounded queue: memory stays safe
    new ThreadPoolExecutor.CallerRunsPolicy());   // full? the caller runs it

pool.submit(() -> sendInvoice(orderId));

pool.shutdown();                                   // no new tasks; finish queued ones
pool.awaitTermination(30, TimeUnit.SECONDS);`,
    say: "A ThreadPoolExecutor fills core threads, then the queue, then grows to max, then rejects — so with an unbounded queue it never grows past core, which is why I configure bounded queues explicitly.",
    trap: "“How can `Executors.newFixedThreadPool` cause an OutOfMemoryError?” Its LinkedBlockingQueue is unbounded; if tasks arrive faster than they finish, the queue grows forever.",
  },
  {
    id: "locks-synchronizers",
    title: "Locks & synchronizers",
    emoji: "🚧",
    simple:
      "ReentrantLock is synchronized with extra buttons: “try for two seconds, then give up”, “let me be interrupted”, “serve in arrival order”. A CountDownLatch is a starting line, a Semaphore is a car park with N spaces, and a CyclicBarrier is friends waiting until everyone has arrived.",
    points: [
      "**ReentrantLock**: `tryLock(timeout)`, `lockInterruptibly()`, optional fairness, multiple `Condition`s. Always `unlock()` in `finally`.",
      "**ReadWriteLock**: many readers at once, or one writer.",
      "**CountDownLatch**: one thread waits until N others finish. One-shot.",
      "**CyclicBarrier**: N threads wait for *each other*, then all go. Reusable.",
      "**Semaphore**: at most N threads inside at once. **BlockingQueue**: the producer–consumer workhorse.",
    ],
    code: `private final ReentrantLock lock = new ReentrantLock();

boolean transfer(Account from, Account to, long amount) throws InterruptedException {
    if (!lock.tryLock(2, TimeUnit.SECONDS)) return false;   // don't wait forever
    try {
        from.debit(amount);
        to.credit(amount);
        return true;
    } finally {
        lock.unlock();                                        // always, in finally
    }
}

CountDownLatch warm = new CountDownLatch(3);
caches.forEach(c -> pool.submit(() -> { c.load(); warm.countDown(); }));
warm.await();                                                 // until all three are loaded

Semaphore dbSlots = new Semaphore(10);                        // at most 10 at once`,
    say: "I reach for ReentrantLock when I need tryLock, interruptible or fair locking, CountDownLatch to wait for N tasks, Semaphore to cap concurrency and BlockingQueue for producer–consumer.",
    trap: "“CountDownLatch vs CyclicBarrier?” A latch lets one thread wait for N others and can't be reset; a barrier makes N threads wait for each other and resets for another round.",
  },
  {
    id: "deadlock",
    title: "Deadlock",
    emoji: "🔐",
    hot: true,
    lab: "deadlock",
    simple:
      "Two people in a narrow corridor, each holding a door the other needs, each politely waiting for the other to move first — forever.",
    points: [
      "Deadlock needs **all four Coffman conditions**: mutual exclusion, hold and wait, no preemption, circular wait.",
      "Break **circular wait** with a global lock order — always lock the lower account id first.",
      "Break **hold and wait** with `tryLock(timeout)`: give up everything and retry.",
      "Diagnose with a thread dump (`jstack <pid>`), which reports “Found one Java-level deadlock”.",
      "**Livelock**: threads keep backing off for each other and stay busy without progress. **Starvation**: one thread never gets its turn.",
    ],
    code: `// Deadlock-prone: thread 1 locks A then B, thread 2 locks B then A
void transfer(Account from, Account to, long amount) {
    synchronized (from) {
        synchronized (to) { from.debit(amount); to.credit(amount); }
    }
}

// Fix: always lock in one global order (here, by account id)
void safeTransfer(Account from, Account to, long amount) {
    Account first = from.id() < to.id() ? from : to;
    Account second = first == from ? to : from;
    synchronized (first) {
        synchronized (second) { from.debit(amount); to.credit(amount); }
    }
}`,
    say: "A deadlock needs mutual exclusion, hold-and-wait, no preemption and circular wait; I break circular wait with a consistent lock order, or use tryLock with a timeout, and diagnose with a thread dump.",
    trap: "“Deadlock vs livelock?” In a deadlock threads sit waiting. In a livelock they keep reacting to each other, burning CPU without getting anywhere.",
  },
  {
    id: "completable-future",
    title: "CompletableFuture",
    emoji: "📲",
    simple:
      "A plain Future is a claim ticket: you keep going back to the counter to ask if it's ready. A CompletableFuture is “text me when it's ready, then start the next step” — you chain steps instead of waiting around.",
    points: [
      "`Future.get()` **blocks**. `CompletableFuture` lets you compose steps without blocking.",
      "`supplyAsync` starts work · `thenApply` transforms a result · `thenCompose` chains another async call · `thenCombine` joins two · `allOf` waits for many.",
      "`exceptionally` and `handle` recover from failures; `orTimeout` (Java 9) gives up.",
      "Pass your own executor — the default common ForkJoinPool is shared by the whole JVM.",
    ],
    code: `CompletableFuture<User> user =
    CompletableFuture.supplyAsync(() -> users.find(id), ioPool);
CompletableFuture<List<Order>> orders =
    CompletableFuture.supplyAsync(() -> orderClient.recent(id), ioPool);

CompletableFuture<Dashboard> dashboard = user
    .thenCombine(orders, Dashboard::new)        // both calls run in parallel
    .orTimeout(2, TimeUnit.SECONDS)
    .exceptionally(ex -> Dashboard.empty());    // fallback on error or timeout`,
    say: "CompletableFuture composes async steps with thenApply, thenCompose, thenCombine and allOf, recovers with exceptionally, and should run on an executor I choose rather than the common pool.",
    trap: "“thenApply vs thenCompose?” thenApply maps the value, like `map`; thenCompose flattens a function that itself returns a CompletableFuture, like `flatMap`.",
  },
];

export const boss = [
  {
    q: "Two threads each run count++ 1,000 times on a shared int, with no synchronization. What's the final count?",
    options: ["Always 2000", "Always 1000", "Anything up to 2000", "An exception is thrown"],
    answer: 2,
    why: "count++ is read, add, write. When threads interleave they overwrite each other's results, so updates are lost.",
  },
  {
    q: "A pool has core = 2, max = 4 and a queue of capacity 10. Two tasks are running. Where does the 3rd task go?",
    options: ["A 3rd thread starts", "Into the queue", "It's rejected", "It runs on the caller's thread"],
    answer: 1,
    why: "Core threads are all busy, so the task is queued. The pool only grows past core once the queue is full.",
  },
  {
    q: "Which statement about volatile is true?",
    options: ["It makes count++ atomic", "It guarantees threads see the latest written value", "It locks the variable while you use it", "It only works on object references"],
    answer: 1,
    why: "volatile is about visibility. Compound actions still need a lock or an atomic class.",
  },
  {
    q: "Which of these is NOT one of the four conditions for a deadlock?",
    options: ["Mutual exclusion", "Hold and wait", "Circular wait", "Priority inversion"],
    answer: 3,
    why: "The Coffman conditions are mutual exclusion, hold and wait, no preemption and circular wait. Break any one and deadlock becomes impossible.",
  },
  {
    q: "What's the key difference between sleep() and wait()?",
    options: [
      "sleep releases locks; wait keeps them",
      "wait releases the monitor; sleep keeps any locks it holds",
      "They're the same apart from the name",
      "wait can only be called on Thread objects",
    ],
    answer: 1,
    why: "wait() must be called while holding the monitor and gives it up until notified; sleep() just pauses, still holding every lock.",
  },
];
