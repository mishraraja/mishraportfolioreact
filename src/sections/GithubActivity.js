import GitHubCalendar from "react-github-calendar";
import { profile } from "../data/profile";
import { SectionHeading } from "../components/ui/SectionHeading";
import { Reveal } from "../components/ui/Reveal";
import "./GithubActivity.css";

const calendarTheme = {
  level0: "#111116",
  level1: "#2a2350",
  level2: "#4a3aa8",
  level3: "#6f57f0",
  level4: "#a597ff",
};

const username = profile.social.github?.split("/").filter(Boolean).pop();

export function GithubActivity() {
  if (!username) return null;

  return (
    <section id="activity" className="github-activity section">
      <div className="container">
        <SectionHeading index="05" eyebrow="Proof of Work" title="Still building, most days." />
        <Reveal className="github-activity__card">
          <GitHubCalendar username={username} theme={calendarTheme} fontSize={13} blockSize={11} />
        </Reveal>
      </div>
    </section>
  );
}
