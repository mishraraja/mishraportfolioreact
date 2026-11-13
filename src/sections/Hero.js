import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { profile } from "../data/profile";
import { Button } from "../components/ui/Button";
import { OrbitalSystem } from "../components/orbital/OrbitalSystem";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useExperience } from "../context/ExperienceContext";
import { sfx } from "../lib/sound";
import { RequestFlow } from "../components/orbital/RequestFlow";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { ObservatoryField } from "../components/orbital/ObservatoryField";
import "./Hero.css";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] } },
};

/** Live clock in his timezone. The page always knows what time it is for him. */
function LiveStatus() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  return (
    <div className="hero__status">
      <span className="hero__status-dot is-awake" aria-hidden="true" />
      <span className="hero__status-text">
        {time} IST
        <span className="hero__status-sep">/</span>
        Local time
      </span>
    </div>
  );
}

export function Hero() {
  const reduced = useReducedMotion();
  const { unlock } = useExperience();
  const [scene, setScene] = useState("orbit");
  const MotionDiv = reduced ? "div" : motion.div;
  const pageHeadline = `${profile.name} | ${profile.roles[0]}`;


  useEffect(() => {
    function onScroll() {
      if (window.scrollY > window.innerHeight * 0.5) {
        unlock("first-contact");
        window.removeEventListener("scroll", onScroll);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [unlock]);

  function jump(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: reduced ? "instant" : "smooth" });
    sfx.click();
  }

  return (
    <section id="home" className="hero section">
      <ObservatoryField />
      <div className="container hero__masthead">
        <div className="hero__edition"><span>INDEPENDENT MIND. SYSTEMS THINKING.</span><span>JAVA / CLOUD / ENGINEERING</span></div>
        <motion.div className="hero__name" initial={reduced ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .9, ease: [.16, 1, .3, 1] }}>Raja <span>Mishra</span><sup>PORTFOLIO / 26</sup></motion.div>
      </div>
      <div className="container hero__grid">
        <MotionDiv
          className="hero__copy"
          variants={reduced ? undefined : containerVariants}
          initial={reduced ? undefined : "hidden"}
          animate={reduced ? undefined : "show"}
        >
          <motion.div variants={reduced ? undefined : itemVariants} className="hero__badge">
            <span className="hero__badge-pulse" aria-hidden="true" />
            {profile.openToWork ? "Open to new opportunities" : "Building with Java & Spring Boot"}
          </motion.div>

          <motion.h1
            variants={reduced ? undefined : itemVariants}
            className="hero__headline"
            aria-label={pageHeadline}
          >
            {pageHeadline.split(" ").map((word, index) => (
              <motion.span key={index} className={word === "Developer" ? "hero__word hero__word--accent" : "hero__word"}
                initial={reduced ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: .4, delay: reduced ? 0 : .06 + index * .025 }} aria-hidden="true">{word}{" "}</motion.span>
            ))}
          </motion.h1>

          <motion.p variants={reduced ? undefined : itemVariants} className="hero__sub">
            {profile.headline}{" "}
            I build dependable backend systems with <strong>Java & Spring Boot</strong>.
            {" "}5+ years turning complex problems into software people can rely on.
          </motion.p>

          <motion.div variants={reduced ? undefined : itemVariants} className="hero__cta">
            <span className="hero__magnet">
              <Button
                as="a"
                href="#projects"
                variant="primary"
                onClick={(e) => {
                  e.preventDefault();
                  jump("projects");
                }}
              >
                Explore the work
              </Button>
            </span>
            <span className="hero__magnet">
              <Button
                as="a"
                href="#api"
                variant="secondary"
                onClick={(e) => {
                  e.preventDefault();
                  jump("api");
                }}
              >
                Try the API <span aria-hidden="true">↗</span>
              </Button>
            </span>
          </motion.div>

          <motion.dl variants={reduced ? undefined : itemVariants} className="hero__stats">
            <div>
              <dt>Years in production</dt>
              <dd>{profile.yearsExperience}+</dd>
            </div>
            <div>
              <dt>Core stack</dt>
              <dd>Java + Spring</dd>
            </div>
            <div>
              <dt>Approach</dt>
              <dd>Built to last</dd>
            </div>
          </motion.dl>

          <LiveStatus />
        </MotionDiv>

        <motion.div
          className="hero__visual"
          initial={reduced ? undefined : { opacity: 0, y: 18 }}
          animate={reduced ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: .6, delay: .12, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="hero__visual-head"><span><i />A LIVING STACK</span><span>01 / INTERACTIVE STUDY</span></div>
          <SegmentedControl label="System visualisation" value={scene} onChange={setScene}
            options={[{ id: "orbit", label: "Stack orbit" }, { id: "flow", label: "Request flow" }]} />
          <div className="hero__scene">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={scene} initial={{ opacity: 0, y: reduced ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : -8 }} transition={{ duration: .18 }}>
                {scene === "orbit" ? <OrbitalSystem /> : <RequestFlow />}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="hero__visual-foot"><span>EVERY PART CONNECTS.</span><span>SO DOES THE EXPERIENCE. ↗</span></div>
        </motion.div>
      </div>

      <nav className="container hero__index" aria-label="Explore the portfolio">
        {[["01", "Selected work", "Systems with a purpose", "projects"], ["02", "Enter the lab", "Explore. Test. Understand.", "mission-lab"], ["03", "Start a conversation", "Build something worthwhile", "contact"]].map(([number, title, detail, id]) => <a key={id} href={"#" + id}><span>{number}</span><div><strong>{title}</strong><small>{detail}</small></div><span aria-hidden="true">↗</span></a>)}
      </nav>
    </section>
  );
}
