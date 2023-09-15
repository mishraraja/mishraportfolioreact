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
            <br />
            "I am a seasoned Software Developer, with over two years of hands-on experience, crafting exceptional digital solutions. My primary expertise revolves around Java, a canvas upon which I skillfully weave the intricate threads of Spring Framework, Hibernate, and Spring Boot.

            In the world of software, I am more than a professional; I am a connoisseur of elegant code. I take pride in engineering solutions that not only meet your needs but also exemplify sophistication and innovation.

            If you're in search of a professional who brings a touch of refinement to software development, your quest concludes here. Together, we'll engineer software solutions that seamlessly blend technology and style, leaving a lasting mark in the digital landscape."</p>
          <p>Some of my hobbies include:</p>
          <ul>
            <li className="about-activity">
              <ImPointRight /> Reading
            </li>
            <li className="about-activity">
              <ImPointRight /> Traveling
            </li>
            <li className="about-activity" >
              <ImPointRight /> Playing Chess
            </li>
          </ul>
        </blockquote>
      </Card.Body>
    </Card>
  );
}

export default AboutCard;
