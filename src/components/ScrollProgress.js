import { motion, useScroll, useSpring } from "framer-motion";
import "./ScrollProgress.css";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 40, mass: 0.2 });

  return <motion.div className="scroll-progress" style={{ scaleX }} aria-hidden="true" />;
}
