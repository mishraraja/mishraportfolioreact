import React from "react";
import Card from "react-bootstrap/Card";
import { ImPointRight } from "react-icons/im";

function AboutCard() {
  return (
    <Card className="quote-card-view">
      <Card.Body>
        <blockquote className="blockquote mb-0">
          <p style={{ textAlign: "justify" }}>
            Greetings everyone, I'm <span className="purple">Raja Mishra</span>,
            based in <span className="purple">Ranchi, India.</span>
            <br /> I hold a Master's degree in Computer Applications (MCA) and I am presently an employed professional with hands-on experience.
            My expertise lies in classic programming languages like Java, and I have honed my skills in various related technologies, including Spring Framework, Hibernate, and Spring Boot.
            With a solid educational foundation in MCA, I am enthusiastic about applying my well-rounded skills and proficiency in microservices and Java to contribute effectively in a professional environment.
          </p>
          <p>Some of my hobbies include:</p>
          <ul>
            <li className="about-activity">
              <ImPointRight /> Playing games
            </li>
            <li className="about-activity">
              <ImPointRight /> Traveling
            </li>
            <li className="about-activity" >
              <ImPointRight /> Chess
            </li>
          </ul>
        </blockquote>
      </Card.Body>
    </Card>
  );
}

export default AboutCard;
