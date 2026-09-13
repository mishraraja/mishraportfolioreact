import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import GitHubCalendar from "react-github-calendar";
import { SectionHeading } from "../components/ui/SectionHeading";
import { Reveal } from "../components/ui/Reveal";
import { useGithubData } from "../hooks/useGithubData";
import { sfx } from "../lib/sound";
import "./GithubActivity.css";

const calendarTheme = {
  dark: ["#111116", "#2a2350", "#4a3aa8", "#6f57f0", "#a597ff"],
};

/** Counts up to a value when it scrolls into view. Numbers deserve a moment. */
function CountUp({ value, duration = 1100 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView || typeof value !== "number") return undefined;
    let raf;
    const start = performance.now();

    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      // Ease-out cubic, so the number decelerates into place.
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return <span ref={ref}>{typeof value === "number" ? display : "—"}</span>;
}

function relativeTime(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return mins + "m ago";
  const hours = Math.round(mins / 60);
  if (hours < 24) return hours + "h ago";
  const days = Math.round(hours / 24);
  if (days < 30) return days + "d ago";
  const months = Math.round(days / 30);
  return months + "mo ago";
}

/**
 * Everything in this section refreshes itself: the stats come live from the
 * GitHub API with a nightly-committed snapshot as the floor, so the page is
 * accurate without anyone editing a data file.
 */
export function GithubActivity() {
  const { data, status, username } = useGithubData();
  if (!username) return null;

  const totals = data?.totals;
  const user = data?.user;

  return (
    <section id="github" className="gh section">
      <div className="container">
        <SectionHeading
          index="07"
          eyebrow="Proof of work"
          title="Still building, most days."
          description="These numbers are pulled live from GitHub every time this page loads. Nobody types them in."
        />

        {/* Live stat row */}
        <div className="gh__stats">
          {[
            { label: "Public repos", value: user?.publicRepos, suffix: "" },
            { label: "Original repos", value: totals?.repos, suffix: "" },
            { label: "Stars earned", value: totals?.stars, suffix: "" },
            { label: "Followers", value: user?.followers, suffix: "" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="gh__stat"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="gh__stat-value">
                <CountUp value={stat.value} />
              </span>
              <span className="gh__stat-label">{stat.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Language mix */}
        {data?.languages?.length ? (
          <Reveal className="gh__langs">
            <span className="gh__block-label">Languages across public work</span>
            <div className="gh__lang-bar">
              {data.languages.map((lang, i) => {
                const total = data.languages.reduce((n, l) => n + l.count, 0);
                return (
                  <motion.span
                    key={lang.name}
                    className="gh__lang-seg"
                    style={{ "--i": i, "--n": Math.max(data.languages.length - 1, 1) }}
                    initial={{ width: 0 }}
                    whileInView={{ width: (lang.count / total) * 100 + "%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.1 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                    title={lang.name + ": " + lang.count + " repos"}
                  />
                );
              })}
            </div>
            <ul className="gh__lang-key">
              {data.languages.map((lang, i) => (
                <li key={lang.name} style={{ "--i": i, "--n": Math.max(data.languages.length - 1, 1) }}>
                  <span className="gh__lang-dot" aria-hidden="true" />
                  {lang.name}
                  <span className="text-muted"> {lang.count}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        ) : null}

        {/* Contribution calendar */}
        <Reveal className="gh__card">
          <GitHubCalendar
            username={username}
            theme={calendarTheme}
            colorScheme="dark"
            fontSize={13}
            blockSize={11}
          />
        </Reveal>

        {/* Latest repositories, straight from the API */}
        {data?.repos?.length ? (
          <div className="gh__repos">
            <span className="gh__block-label">Most recently pushed</span>
            <div className="gh__repo-grid">
              {data.repos.map((repo, i) => (
                <motion.a
                  key={repo.id}
                  href={repo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="gh__repo"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.45, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  onPointerEnter={sfx.hover}
                  data-cursor="open"
                >
                  <span className="gh__repo-head">
                    <span className="gh__repo-name">{repo.name}</span>
                    <span className="gh__repo-time">{relativeTime(repo.pushedAt)}</span>
                  </span>
                  <span className="gh__repo-desc">
                    {repo.description || "No description on this one."}
                  </span>
                  <span className="gh__repo-foot">
                    {repo.language ? (
                      <span className="gh__repo-lang">
                        <span className="gh__lang-dot" aria-hidden="true" />
                        {repo.language}
                      </span>
                    ) : null}
                    {repo.stars > 0 ? <span>★ {repo.stars}</span> : null}
                    {repo.forks > 0 ? <span>⑂ {repo.forks}</span> : null}
                  </span>
                </motion.a>
              ))}
            </div>
          </div>
        ) : null}

        <p className="gh__stamp text-muted">
          <span className={"gh__stamp-dot gh__stamp-dot--" + status} aria-hidden="true" />
          {status === "loading"
            ? "Fetching live data from GitHub…"
            : status === "offline"
            ? "GitHub rate limit reached — showing the latest committed snapshot."
            : data?.source === "live"
            ? "Live from the GitHub API, just now."
            : "From the nightly snapshot."}
        </p>
      </div>
    </section>
  );
}
