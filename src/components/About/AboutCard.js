import React from "react";
import Card from "react-bootstrap/Card";
import { ImPointRight } from "react-icons/im";

function AboutCard() {
  return (
    <Card className="quote-card-view">
      <Card.Body>
        <blockquote className="blockquote mb-0">
          <p style={{ textAlign: "justify" }}>
            Hi Everyone, I am <span className="purple">Raja Mishra </span>
            from <span className="purple"> Ranchi, India.</span>
            <br /> I am a Third Year student pursuing B.E.
            in Artificial intelligence & Data Science from Pune University.
            <br />
            Additionally, I am enthusiastic about Machine Learning.
            <br />
            <br />
            Some of my hobbies are 
          </p>
          <ul>
            <li className="about-activity">
              <ImPointRight /> Playing games
            </li>
            <li className="about-activity">
              <ImPointRight /> Travelling  
            </li>
            <li className="about-activity">
              <ImPointRight /> Chess
            </li>
          </ul>
          
        </blockquote>
      </Card.Body>
    </Card>
  );
}

export default AboutCard;
