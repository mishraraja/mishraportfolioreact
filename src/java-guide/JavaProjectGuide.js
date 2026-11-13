import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTitle } from "../dsa/useTitle";
import { CHECK_QUESTIONS, DEPLOYMENT_MODES, GLOSSARY, LESSONS, MEMORY_AREAS, START_STEPS } from "./content";
import "./JavaProjectGuide.css";

const PROGRESS_KEY = "rm.java-project-guide.reviewed.v1";

function readReviewed() {
  try {
    const value = JSON.parse(window.localStorage.getItem(PROGRESS_KEY) || "[]");
    return Array.isArray(value) ? value.filter((id) => LESSONS.some((lesson) => lesson.id === id)) : [];
  } catch {
    return [];
  }
}

function InlineCode({ children }) {
  return <code>{children}</code>;
}

function ProgressBar({ reviewed }) {
  const percent = Math.round((reviewed.length / LESSONS.length) * 100);
  return (
    <div className="jguide-progress" aria-label={`${reviewed.length} of ${LESSONS.length} lessons reviewed`}>
      <div className="jguide-progress__copy">
        <span>Review progress</span>
        <strong>{reviewed.length} / {LESSONS.length}</strong>
      </div>
      <div className="jguide-progress__track" role="progressbar" aria-valuenow={reviewed.length} aria-valuemin={0} aria-valuemax={LESSONS.length} aria-label="Lessons reviewed">
        <span style={{ width: `${percent}%` }} />
      </div>
      <p>Saved only in this browser. “Reviewed” means you worked through a lesson; it does not claim mastery.</p>
    </div>
  );
}

export default function JavaProjectGuide() {
  useTitle(
    "How Java projects work: JVM, Spring, memory and requests",
    "A practical, interactive guide to Java builds, JVM memory, Spring, HTTP requests, databases, deployment, and production troubleshooting."
  );
  const [reviewed, setReviewed] = useState(readReviewed);
  const [stepIndex, setStepIndex] = useState(0);
  const [deployment, setDeployment] = useState("external");
  const [memoryId, setMemoryId] = useState("heap");
  const [glossaryQuery, setGlossaryQuery] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(reviewed));
    } catch {
      // The guide remains usable when storage is blocked or full.
    }
  }, [reviewed]);

  const deploymentMode = DEPLOYMENT_MODES[deployment];
  const memoryArea = MEMORY_AREAS.find((area) => area.id === memoryId) || MEMORY_AREAS[0];
  const step = START_STEPS[stepIndex];
  const question = CHECK_QUESTIONS[questionIndex];
  const visibleTerms = useMemo(() => {
    const search = glossaryQuery.trim().toLowerCase();
    return GLOSSARY.filter(([term, definition]) => !search || `${term} ${definition}`.toLowerCase().includes(search));
  }, [glossaryQuery]);

  function toggleReviewed(id) {
    setReviewed((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function changeQuestion(index) {
    setQuestionIndex(index);
    setAnswer(null);
  }

  return (
    <article className="jguide container">
      <header className="jguide-hero">
        <span className="jguide-eyebrow">A practical Java systems guide</span>
        <h1>How a Java project works, from code to response</h1>
        <p className="jguide-hero__lede">
          Follow one application from source code, through the JVM and framework, to a database and back to a user. Learn the stable ideas first, then see where deployment choices and versions change the details.
        </p>
        <p className="jguide-hero__note">
          This is a reading and investigation guide, separate from the Java Arcade. No single server, JDK version, database, or Spring packaging style is assumed.
        </p>
        <div className="jguide-hero__actions">
          <a className="jguide-button jguide-button--primary" href="#walkthrough">Start the walkthrough <span aria-hidden="true">↓</span></a>
          <a className="jguide-button" href="#curriculum">Browse the {LESSONS.length} lessons</a>
        </div>
      </header>

      <div className="jguide-top-grid">
        <ProgressBar reviewed={reviewed} />
        <aside className="jguide-callout" aria-labelledby="jguide-method-title">
          <span className="jguide-label">A way to study</span>
          <h2 id="jguide-method-title">Observe before you memorize</h2>
          <p>For each idea, ask: what starts it, what owns it, what can fail, and what evidence would prove your explanation?</p>
        </aside>
      </div>

      <nav className="jguide-toc" aria-label="On this guide">
        <a href="#walkthrough">Run and request path</a>
        <a href="#memory-map">JVM memory</a>
        <a href="#curriculum">Core lessons</a>
        <a href="#knowledge-check">Knowledge check</a>
        <a href="#glossary">Glossary</a>
      </nav>

      <section className="jguide-section" id="walkthrough" aria-labelledby="walkthrough-title">
        <div className="jguide-section__heading">
          <span className="jguide-label">Interactive walkthrough · 01</span>
          <h2 id="walkthrough-title">From “Run” to an HTTP response</h2>
          <p>Select a stage to see what it does, where its work happens, and what to inspect when it fails.</p>
        </div>

        <div className="jguide-mode" aria-label="Choose a deployment shape">
          <span className="jguide-mode__label">Compare application startup:</span>
          {Object.entries(DEPLOYMENT_MODES).map(([id, item]) => (
            <button key={id} type="button" className={deployment === id ? "is-selected" : ""} aria-pressed={deployment === id} onClick={() => setDeployment(id)}>
              {item.label}
            </button>
          ))}
        </div>

        <div className="jguide-deployment" aria-live="polite">
          <div>
            <span className="jguide-label">{deploymentMode.label}</span>
            <h3>{deploymentMode.title}</h3>
            <p>{deploymentMode.description}</p>
            <p className="jguide-muted">{deploymentMode.note}</p>
          </div>
          <ol className="jguide-boot-flow" aria-label={`${deploymentMode.label} startup stages`}>
            {deploymentMode.path.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span>{item}</li>)}
          </ol>
        </div>

        <div className="jguide-walkthrough">
          <ol className="jguide-stage-list" aria-label="Application execution stages">
            {START_STEPS.map((item, index) => (
              <li key={item.label}>
                <button type="button" className={stepIndex === index ? "is-active" : ""} aria-current={stepIndex === index ? "step" : undefined} onClick={() => setStepIndex(index)}>
                  <span className="jguide-stage-list__number">{String(index + 1).padStart(2, "0")}</span>
                  <span><strong>{item.label}</strong><small>{item.lane}</small></span>
                </button>
              </li>
            ))}
          </ol>
          <div className="jguide-stage-detail" aria-live="polite" aria-atomic="true">
            <span className="jguide-label">Stage {String(stepIndex + 1).padStart(2, "0")} · {step.lane}</span>
            <h3>{step.title}</h3>
            <p>{step.happens}</p>
            <div className="jguide-stage-detail__facts">
              <div><strong>What memory/resources are involved?</strong><p>{step.memory}</p></div>
              <div><strong>What would I inspect?</strong><p>{step.inspect}</p></div>
            </div>
            <div className="jguide-pager">
              <button type="button" onClick={() => setStepIndex((index) => Math.max(0, index - 1))} disabled={stepIndex === 0}>← Previous</button>
              <span>{stepIndex + 1} of {START_STEPS.length}</span>
              <button type="button" onClick={() => setStepIndex((index) => Math.min(START_STEPS.length - 1, index + 1))} disabled={stepIndex === START_STEPS.length - 1}>Next →</button>
            </div>
          </div>
        </div>
        <p className="jguide-caption">The drawing is a learning model. Real systems may add gateways, queues, caches, asynchronous work, multiple services, or different server runtimes.</p>
      </section>

      <section className="jguide-section" id="memory-map" aria-labelledby="memory-title">
        <div className="jguide-section__heading">
          <span className="jguide-label">Interactive walkthrough · 02</span>
          <h2 id="memory-title">Where does the work live?</h2>
          <p>Choose a memory area. The JVM specification defines a logical execution model; each JVM implementation decides how to realize it.</p>
        </div>
        <div className="jguide-memory">
          <div className="jguide-memory__map" role="group" aria-label="Select a JVM memory area">
            {MEMORY_AREAS.map((area) => (
              <button key={area.id} type="button" className={`jguide-memory__tile jguide-memory__tile--${area.id} ${area.id === memoryId ? "is-active" : ""}`} aria-pressed={area.id === memoryId} onClick={() => setMemoryId(area.id)}>
                <strong>{area.name}</strong><span>{area.scope}</span>
              </button>
            ))}
            <p className="jguide-memory__caption">Logical JVM areas and common implementation details</p>
          </div>
          <article className="jguide-memory__detail" aria-live="polite">
            <span className="jguide-label">{memoryArea.scope}</span>
            <h3>{memoryArea.name}</h3>
            <p className="jguide-memory__stores">{memoryArea.stores}</p>
            <p>{memoryArea.detail}</p>
            <div className="jguide-note"><strong>Diagnostic clue</strong><p>{memoryArea.symptom}</p></div>
          </article>
        </div>
      </section>

      <section className="jguide-section" id="curriculum" aria-labelledby="curriculum-title">
        <div className="jguide-section__heading">
          <span className="jguide-label">The learning path · {LESSONS.length} lessons</span>
          <h2 id="curriculum-title">Build the model one layer at a time</h2>
          <p>Open a lesson, read the internal model, check the common traps, then do the investigation with a small program or a real service. Mark lessons reviewed as you go.</p>
        </div>
        <div className="jguide-lessons">
          {LESSONS.map((lesson) => {
            const done = reviewed.includes(lesson.id);
            return (
              <details className={`jguide-lesson ${done ? "is-reviewed" : ""}`} id={lesson.id} key={lesson.id}>
                <summary>
                  <span className="jguide-lesson__summary">
                    <strong>{lesson.title}</strong>
                    <span>{lesson.summary}</span>
                  </span>
                  <span className="jguide-lesson__status">{done ? "Reviewed" : "Open lesson"}</span>
                </summary>
                <div className="jguide-lesson__body">
                  <p className="jguide-analogy"><strong>Start with an analogy</strong>{lesson.analogy}</p>
                  <p>{lesson.explanation}</p>
                  <h3>What happens inside</h3>
                  <ul>{lesson.internals.map((item) => <li key={item}>{item}</li>)}</ul>
                  <aside className="jguide-example">
                    <h3>{lesson.exampleTitle}</h3>
                    <p>{lesson.example}</p>
                  </aside>
                  <h3>Common misunderstandings</h3>
                  <ul className="jguide-mistakes">{lesson.mistakes.map((item) => <li key={item}>{item}</li>)}</ul>
                  <div className="jguide-exercise"><strong>Investigate it</strong><p>{lesson.exercise}</p></div>
                  <button type="button" className="jguide-review" aria-pressed={done} onClick={() => toggleReviewed(lesson.id)}>
                    {done ? "Mark as not reviewed" : "Mark lesson reviewed"}
                  </button>
                </div>
              </details>
            );
          })}
        </div>
      </section>

      <section className="jguide-section" id="knowledge-check" aria-labelledby="check-title">
        <div className="jguide-section__heading">
          <span className="jguide-label">Quick knowledge check</span>
          <h2 id="check-title">Can you explain the system?</h2>
          <p>Choose the strongest answer. The explanation matters more than the score.</p>
        </div>
        <div className="jguide-check">
          <div className="jguide-check__select" role="group" aria-label="Choose a knowledge-check question">
            {CHECK_QUESTIONS.map((item, index) => (
              <button key={item.question} type="button" className={questionIndex === index ? "is-active" : ""} aria-pressed={questionIndex === index} onClick={() => changeQuestion(index)}>
                Question {index + 1}
              </button>
            ))}
          </div>
          <h3>{question.question}</h3>
          <div className="jguide-check__options">
            {question.options.map((option, index) => {
              const selected = answer === index;
              const correct = answer !== null && index === question.answer;
              return (
                <button key={option} type="button" className={`${selected ? "is-selected" : ""} ${correct ? "is-correct" : ""} ${selected && !correct ? "is-incorrect" : ""}`} aria-pressed={selected} onClick={() => setAnswer(index)}>
                  <span>{String.fromCharCode(65 + index)}</span>{option}
                </button>
              );
            })}
          </div>
          {answer !== null && <p className={`jguide-check__feedback ${answer === question.answer ? "is-correct" : "is-incorrect"}`} role="status"><strong>{answer === question.answer ? "That is the strongest answer." : "Review the distinction."}</strong> {question.explanation}</p>}
        </div>
      </section>

      <section className="jguide-section" id="glossary" aria-labelledby="glossary-title">
        <div className="jguide-section__heading">
          <span className="jguide-label">Quick lookup</span>
          <h2 id="glossary-title">Java backend glossary</h2>
          <p>Search terms as they appear in logs, code reviews, and JVM discussions.</p>
        </div>
        <label className="jguide-search">
          <span>Filter glossary terms</span>
          <input type="search" value={glossaryQuery} onChange={(event) => setGlossaryQuery(event.target.value)} placeholder="Try ‘heap’, ‘transaction’, or ‘volatile’" />
        </label>
        <dl className="jguide-glossary">
          {visibleTerms.map(([term, definition]) => <div key={term}><dt><InlineCode>{term}</InlineCode></dt><dd>{definition}</dd></div>)}
          {visibleTerms.length === 0 && <p role="status">No term matches that search. Try a shorter word.</p>}
        </dl>
      </section>

      <section className="jguide-section jguide-next" aria-labelledby="jguide-next-title">
        <div>
          <span className="jguide-label">Keep going</span>
          <h2 id="jguide-next-title">Turn the model into practice</h2>
          <p>Use the Java Arcade for short coding drills and labs. Return to this guide when you want to understand why the runtime behaves the way it does.</p>
        </div>
        <div className="jguide-next__links">
          <Link to="/java">Open the Java Arcade <span aria-hidden="true">→</span></Link>
          <Link to="/engineering">Read how this learning site is built <span aria-hidden="true">→</span></Link>
          <a href="https://docs.oracle.com/javase/specs/jvms/se27/html/index.html" target="_blank" rel="noreferrer">Java Virtual Machine Specification <span aria-hidden="true">↗</span></a>
          <a href="https://docs.spring.io/spring-framework/reference/core/beans.html" target="_blank" rel="noreferrer">Spring container reference <span aria-hidden="true">↗</span></a>
          <a href="https://docs.spring.io/spring-framework/reference/web/webmvc.html" target="_blank" rel="noreferrer">Spring Web MVC reference <span aria-hidden="true">↗</span></a>
          <a href="https://tomcat.apache.org/tomcat-10.1-doc/architecture/overview.html" target="_blank" rel="noreferrer">Tomcat architecture example <span aria-hidden="true">↗</span></a>
          <a href="https://docs.oracle.com/en/java/javase/27/troubleshoot/diagnostic-tools.html" target="_blank" rel="noreferrer">JVM diagnostic tools <span aria-hidden="true">↗</span></a>
        </div>
        <p className="jguide-next__note">Official docs can be version-specific. Use the documentation that matches the JDK, framework, database, and server actually selected for a project.</p>
      </section>
    </article>
  );
}
