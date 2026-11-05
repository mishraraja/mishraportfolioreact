import { createContext } from "react";

// Separate from ExperienceContext so animation hooks can also be used outside
// the app provider (for example, isolated labs and component tests).
export const MotionPreferenceContext = createContext(false);
