import { motion, useReducedMotion } from "framer-motion";
import { appRevealMotionProps } from "../motion/appReveal.js";
import "./AccountStatusPanelReveal.css";

/**
 * Same entrance as main layout outlet & settings: Framer Motion fade + slide from above.
 */
export default function AccountStatusPanelReveal({ className = "", style, children }) {
  const reducedMotion = useReducedMotion();
  const reveal = appRevealMotionProps(reducedMotion, { y: -14, duration: 0.45 });

  return (
    <motion.div className={`layout-outlet-reveal ${className}`.trim()} style={style} {...reveal}>
      {children}
    </motion.div>
  );
}
