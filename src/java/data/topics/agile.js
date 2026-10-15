/* Agile & delivery — concept cards and the boss fight. */

export const concepts = [
  {
    id: "agile-waterfall",
    title: "Agile vs Waterfall",
    emoji: "🌊",
    simple:
      "Waterfall builds the whole house from blueprints before anyone moves in — if the family wanted a bigger kitchen, you find out at handover. Agile builds one livable room at a time and asks the family after each one.",
    points: [
      "**Waterfall**: requirements → design → build → test → deploy, in order. Change late is expensive. Suits fixed scope and heavy regulation.",
      "**Agile**: short iterations that each deliver working software, with feedback steering what comes next.",
      "The Agile Manifesto values individuals and interactions, working software, customer collaboration and responding to change — *over* processes, documentation, contracts and plans.",
      "**Scrum** and **Kanban** are frameworks under the Agile umbrella.",
    ],
    say: "Waterfall runs phases in sequence with scope fixed up front; Agile delivers working increments in short cycles and adapts to feedback, which is why most product teams use it.",
    trap: "“Does Agile mean no documentation?” No. It values working software *more than* comprehensive documentation — not instead of it.",
  },
  {
    id: "scrum",
    title: "Scrum: roles, events, artifacts",
    emoji: "🏉",
    hot: true,
    lab: "sprint",
    simple:
      "Scrum is a sports season played in short rounds. The Product Owner picks what matters most, the Developers play, and the Scrum Master is the coach who clears obstacles. Every round (a sprint) has a game plan, daily huddles, a showcase and a team talk.",
    points: [
      "**Roles** — Product Owner orders the backlog for value · Scrum Master facilitates and removes impediments · Developers self-manage to deliver the sprint goal.",
      "**Events** — Sprint (1–4 weeks) · Sprint Planning · Daily Scrum (15 minutes) · Sprint Review · Sprint Retrospective.",
      "**Artifacts** — Product Backlog · Sprint Backlog · Increment, checked against the **Definition of Done**.",
      "Backlog refinement is an ongoing activity, not a formal event.",
    ],
    say: "Scrum has three roles — Product Owner, Scrum Master, Developers — five events from Planning through Retrospective, and three artifacts, with the Definition of Done deciding when an increment is really finished.",
    trap: "“Sprint Review vs Retrospective?” The Review inspects the *product* with stakeholders; the Retrospective inspects *how the team works*.",
  },
  {
    id: "stories-estimation",
    title: "User stories, points & velocity",
    emoji: "🃏",
    simple:
      "A user story is a wish written from the customer's seat: “As a shopper, I want to save my cart, so I can buy later.” Story points measure how big the job feels — effort, complexity and uncertainty — not hours.",
    points: [
      "Format: **As a** …, **I want** …, **so that** … — plus acceptance criteria (Given / When / Then).",
      "Good stories are **INVEST**: Independent, Negotiable, Valuable, Estimable, Small, Testable.",
      "Points are **relative**, often Fibonacci (1, 2, 3, 5, 8, 13), estimated together with **planning poker**.",
      "**Velocity** = points finished per sprint — a forecasting tool, never a performance score.",
      "Epic → story → sub-task. A **spike** is a time-boxed investigation.",
    ],
    code: `Story: Save cart for later
  As a signed-in shopper
  I want my cart saved when I leave
  So that I can finish buying on another device

  Scenario: the cart survives a new session
    Given I have 2 items in my cart
    When I sign in on another device
    Then I see the same 2 items`,
    lang: "gherkin",
    say: "We write user stories with testable acceptance criteria, size them in relative story points with planning poker, and use velocity only to forecast.",
    trap: "“How many hours is a story point?” There's no conversion. Points are relative size; turning them into hours invites false precision.",
  },
  {
    id: "kanban",
    title: "Kanban",
    emoji: "🎫",
    simple:
      "Kanban is a restaurant's order rail. Tickets move from left to right, and there's a limit on how many can be on the grill at once. Stop starting, start finishing.",
    points: [
      "**Visualise** the workflow as columns: To do → In progress → Review → Done.",
      "**WIP limits** cap work in each column and expose bottlenecks.",
      "It's a **pull** system with continuous flow — no fixed sprints required.",
      "Metrics: **lead time** (request → done), **cycle time** (start → done), **throughput**.",
      "A great fit for support and operations teams; **Scrumban** mixes both approaches.",
    ],
    say: "Kanban visualises flow and limits work in progress, and we improve it by watching cycle time and throughput rather than by planning sprints.",
    trap: "“Why limit work in progress?” Starting more doesn't finish more. Context switching and queues grow, and a WIP limit makes the team swarm on blockers.",
  },
  {
    id: "jira-confluence",
    title: "Jira & Confluence",
    emoji: "📋",
    simple:
      "Jira is the team's to-do board, with receipts. Confluence is the team's wiki: where decisions, designs and runbooks live, so nobody has to ask twice.",
    points: [
      "Jira hierarchy: **Epic → Story / Task / Bug → Sub-task**, moving through a workflow like To Do → In Progress → In Review → Done.",
      "Scrum and Kanban boards, the backlog, sprints, and **JQL** filters such as `project = SHOP AND sprint in openSprints()`.",
      "Put the **issue key** (like `SHOP-142`) in branch names and commits so the code links to the ticket.",
      "Confluence holds requirements, design docs, architecture decision records, runbooks and retro notes.",
    ],
    code: `git switch -c feature/SHOP-142-save-cart
git commit -m "SHOP-142 persist the cart on sign-out"   # links the commit to the issue`,
    lang: "shell",
    say: "We track epics, stories and bugs in Jira with the issue key in every branch and commit, and keep designs, decisions and runbooks in Confluence.",
    trap: "“Story vs task vs bug?” A story delivers user value, a task is technical work with no direct user value, and a bug is broken existing behaviour.",
  },
  {
    id: "devops-cicd",
    title: "DevOps & CI/CD",
    emoji: "🚀",
    hot: true,
    simple:
      "CI/CD is airport security for code. Every change is scanned (build), checked (tests) and cleared (quality gates) automatically before it can board (deploy). DevOps is the culture that makes the people who build the plane and the people who fly it one crew.",
    points: [
      "**Continuous integration**: every push builds and tests (GitHub Actions, Jenkins, GitLab CI).",
      "**Continuous delivery**: every green build *could* go to production at the press of a button. **Continuous deployment**: it goes automatically.",
      "Typical pipeline: compile → unit tests → static analysis (SonarQube) → Docker image → integration tests → staging → smoke tests → production.",
      "Release strategies: **rolling**, **blue-green**, **canary**. Infrastructure as code with Terraform; run on Kubernetes.",
      "**DORA metrics**: deployment frequency, lead time for changes, change failure rate, time to restore.",
    ],
    code: `name: ci
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21
          cache: maven
      - run: mvn -B verify      # compile, tests, coverage check
      - run: docker build -t shop/orders:\${{ github.sha }} .`,
    lang: "yaml",
    say: "Every push runs our pipeline — build, tests, static analysis, image, deploy to staging — and we release with canary or blue-green deployments, measuring ourselves with the DORA metrics.",
    trap: "“Continuous delivery vs continuous deployment?” Delivery keeps every build releasable behind a manual approval; deployment ships every green build automatically.",
  },
];

export const boss = [
  {
    q: "Who owns and orders the product backlog?",
    options: ["The Scrum Master", "The Product Owner", "The Developers", "The project manager"],
    answer: 1,
    why: "The Product Owner is accountable for maximising value, which means deciding what's most important next.",
  },
  {
    q: "Which Scrum event inspects how the team works rather than the product?",
    options: ["Sprint Review", "Sprint Planning", "Sprint Retrospective", "Daily Scrum"],
    answer: 2,
    why: "The Retrospective is the team improving its own process. The Review looks at the product increment with stakeholders.",
  },
  {
    q: "What do story points measure?",
    options: ["Hours of work", "Relative size: effort, complexity and uncertainty", "Lines of code", "Business value"],
    answer: 1,
    why: "Points compare stories with each other; the team's velocity then turns them into a forecast.",
  },
  {
    q: "What's the main purpose of a WIP limit in Kanban?",
    options: ["To keep everyone busy", "To expose bottlenecks and finish work before starting more", "To track hours", "To replace sprints with deadlines"],
    answer: 1,
    why: "Limiting work in progress reduces context switching and makes blockers visible, so work flows faster overall.",
  },
  {
    q: "Every green build goes to production automatically. That's…",
    options: ["Continuous integration", "Continuous delivery", "Continuous deployment", "Waterfall"],
    answer: 2,
    why: "Continuous delivery stops at “releasable” with a manual approval; continuous deployment removes that step.",
  },
];
