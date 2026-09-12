import { profile } from "../data/profile";
import { Button } from "../components/ui/Button";
import { Reveal } from "../components/ui/Reveal";
import "./Contact.css";

export function Contact() {
  const primaryHref = profile.social.email ? `mailto:${profile.social.email}` : profile.social.linkedin;
  const primaryLabel = profile.social.email ? "Send an Email" : "Message on LinkedIn";

  return (
    <section id="contact" className="contact section">
      <div className="container contact__inner">
        <Reveal>
          <span className="eyebrow">Contact</span>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="contact__headline">
            Let's build <span className="text-gradient">something great.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="contact__sub text-muted">
            Have a project in mind, or just want to talk shop about Java, Spring Boot or system design? I'm
            always up for a conversation.
          </p>
        </Reveal>

        <Reveal delay={0.22} className="contact__cta">
          <Button as="a" href={primaryHref} variant="primary" target={profile.social.email ? undefined : "_blank"} rel="noreferrer">
            {primaryLabel} →
          </Button>
          {profile.resumeUrl ? (
            <Button as="a" href={profile.resumeUrl} variant="secondary" download>
              Download Resume
            </Button>
          ) : null}
        </Reveal>

        <Reveal delay={0.28} className="contact__links">
          {profile.social.github ? (
            <a href={profile.social.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
          ) : null}
          <a href={profile.social.linkedin} target="_blank" rel="noreferrer">
            LinkedIn
          </a>
          <a href={profile.social.twitter} target="_blank" rel="noreferrer">
            Twitter
          </a>
          <a href={profile.social.instagram} target="_blank" rel="noreferrer">
            Instagram
          </a>
        </Reveal>
      </div>
    </section>
  );
}
