import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { profile } from "../data/profile";
import { Button } from "../components/ui/Button";
import { Reveal } from "../components/ui/Reveal";
import { useMagnetic } from "../hooks/useMagnetic";
import { useExperience } from "../context/ExperienceContext";
import { sfx } from "../lib/sound";
import "./Contact.css";

export function Contact() {
  const { unlock, fireConfetti } = useExperience();
  const [copied, setCopied] = useState(false);
  const primaryRef = useMagnetic(0.28, 70);

  const email = profile.social.email;
  const primaryHref = email ? "mailto:" + email : profile.social.linkedin;
  const primaryLabel = email ? "Send an Email" : "Message on LinkedIn";

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      sfx.success();
      fireConfetti();
      unlock("closer");
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // Clipboard blocked (insecure context, permissions) — fall back to mail.
      window.location.href = primaryHref;
    }
  }

  return (
    <section id="contact" className="contact section">
      <div className="container contact__inner">
        <Reveal>
          <span className="eyebrow">Contact</span>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="contact__headline">
            Have a <span className="text-gradient">Java project?</span>
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="contact__sub text-muted">
            Email me about a backend role, a project, or a question about Java and Spring.
          </p>
        </Reveal>

        {/* The email itself, as a button. One click, nothing to type. */}
        {email ? (
          <Reveal delay={0.2}>
            <button
              type="button"
              className={"contact__email " + (copied ? "contact__email--copied" : "")}
              onClick={copyEmail}
              onPointerEnter={sfx.hover}
              aria-label={"Copy email address " + email}
            >
              <span className="contact__email-text">{email}</span>
              <span className="contact__email-action">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={copied ? "done" : "copy"}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                  >
                    {copied ? "Copied" : "Copy"}
                  </motion.span>
                </AnimatePresence>
              </span>
            </button>
          </Reveal>
        ) : null}

        <Reveal delay={0.26} className="contact__cta">
          <span ref={primaryRef} className="contact__magnet">
            <Button
              as="a"
              href={primaryHref}
              variant="primary"
              target={email ? undefined : "_blank"}
              rel="noreferrer"
              onClick={() => {
                sfx.click();
                fireConfetti();
              }}
            >
              {primaryLabel} →
            </Button>
          </span>
          {profile.resumeRequestUrl ? (
            <div className="contact__resume-gate">
              <div className="contact__resume-preview" aria-hidden="true">
                <strong>Raja Mishra</strong><span>Java Backend Developer</span><span>Experience · Skills · Projects</span>
              </div>
              <Button as="a" href={profile.resumeRequestUrl} variant="secondary" onClick={sfx.click}>
                🔒 Request Resume Access
              </Button>
            </div>
          ) : null}
        </Reveal>

        <Reveal delay={0.32} className="contact__links">
          {profile.social.github ? (
            <a href={profile.social.github} target="_blank" rel="noreferrer" onPointerEnter={sfx.hover}>
              GitHub
            </a>
          ) : null}
          <a href={profile.social.linkedin} target="_blank" rel="noreferrer" onPointerEnter={sfx.hover}>
            LinkedIn
          </a>
          <a href={profile.social.twitter} target="_blank" rel="noreferrer" onPointerEnter={sfx.hover}>
            Twitter
          </a>
          <a href={profile.social.instagram} target="_blank" rel="noreferrer" onPointerEnter={sfx.hover}>
            Instagram
          </a>
        </Reveal>
      </div>
    </section>
  );
}
