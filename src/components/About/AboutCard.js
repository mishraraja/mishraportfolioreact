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
            "I hold a Master's degree in Computer Applications (MCA) and boast a formidable track record with over two years of experience in software development. My specialization revolves around Java, where I wield expertise in Spring Framework, Hibernate, and Spring Boot.
            I am driven by a relentless pursuit of excellence, thriving in the most intricate of technical landscapes. My true passion lies in the realm of microservices, where I architect solutions that not only meet but exceed expectations. If you seek a professional who excels in the art of precise and impactful software development, your quest ends here."</p>
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
