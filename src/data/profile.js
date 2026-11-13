// Central source of truth for personal content shown across the site.
// Sourced from the original portfolio copy plus the real professional
// details Raja shared from his own LinkedIn profile — company name,
// place of study and current location/place of work are deliberately
// left out at his request.

function completedYearsSince(start, today = new Date()) {
  let years = today.getFullYear() - start.getFullYear();
  const anniversaryHasPassed =
    today.getMonth() > start.getMonth() ||
    (today.getMonth() === start.getMonth() && today.getDate() >= start.getDate());
  if (!anniversaryHasPassed) years -= 1;
  return Math.max(0, years);
}

const experienceStart = "2022-04-01";
const [startYear, startMonth, startDay] = experienceStart.split("-").map(Number);
const careerStart = new Date(startYear, startMonth - 1, startDay);

export const profile = {
  name: "Raja Mishra",
  initials: "RM",
  roles: ["Java Backend Developer", "Spring Boot & Microservices", "Kafka · AWS · PostgreSQL"],
  headline: "I build Java backend services and the APIs around them.",
  positioning:
    "Java backend developer working with Spring Boot, Spring Security, Hibernate/JPA, PostgreSQL, Kafka, and AWS.",
  bio: [
    "I work mainly on Java backend services. My day-to-day tools include Spring Boot, Spring Security, Hibernate/JPA, PostgreSQL, and MySQL. I also work with Kafka and AWS, and have built Angular features for web applications.",
    "I like following a feature from its API through the database and into production, then making it easier for the next person to maintain. Away from work, I read, travel, and play chess.",
  ],
  hobbies: ["Reading", "Traveling", "Playing Chess"],
  openToWork: true,
  education: {
    degree: "Master of Computer Applications (MCA), Computer Science",
    period: "2018 – 2021",
  },
  social: {
    github: "https://github.com/mishraraja",
    linkedin: "https://www.linkedin.com/in/rajakrmishra/",
    twitter: "https://twitter.com/mishraja_",
    instagram: "https://www.instagram.com/mishra_rajakr/",
    email: "rajamishra131297@gmail.com",
  },
  resumeRequestUrl: "mailto:rajamishra131297@gmail.com?subject=Request%20resume%20access&body=Hi%20Raja%2C%0A%0AI%27d%20like%20to%20request%20access%20to%20your%20resume.%0A%0AThank%20you.",
  experienceStart,
  yearsExperience: completedYearsSince(careerStart),
};

export const resumeRequestUrl = profile.resumeRequestUrl;

export const focusAreas = [
  {
    label: "Backend Engineering",
    detail: "Java, Spring Boot, Spring Security, Hibernate/JPA",
  },
  {
    label: "Data & Messaging",
    detail: "PostgreSQL, MySQL, Apache Kafka",
  },
  {
    label: "Full Stack Delivery",
    detail: "React, Angular, Node.js, AWS",
  },
];
