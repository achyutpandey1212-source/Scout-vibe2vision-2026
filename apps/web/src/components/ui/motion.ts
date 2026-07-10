import { Transition, Variants } from 'framer-motion';

// Premium spring & ease transitions per Design Manifesto (150-300ms, calm, no bounce)
export const transitionNormal: Transition = {
  type: 'tween',
  ease: [0.16, 1, 0.3, 1], // easeOutExpo
  duration: 0.25,
};

export const transitionFast: Transition = {
  type: 'tween',
  ease: [0.16, 1, 0.3, 1],
  duration: 0.15,
};

export const transitionSlow: Transition = {
  type: 'tween',
  ease: [0.16, 1, 0.3, 1],
  duration: 0.35,
};

// standard spring for modals / interactive cards
export const transitionSpring: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 1,
};

// Standard animation variants
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitionNormal },
  exit: { opacity: 0, transition: transitionFast },
};

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: transitionNormal },
  exit: { opacity: 0, y: -10, transition: transitionFast },
};

export const slideDownVariants: Variants = {
  hidden: { opacity: 0, y: -15 },
  visible: { opacity: 1, y: 0, transition: transitionNormal },
  exit: { opacity: 0, y: 10, transition: transitionFast },
};

export const cardRevealVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: transitionNormal },
};

export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: transitionNormal },
  exit: { opacity: 0, scale: 0.97, y: 10, transition: transitionFast },
};

export const drawerVariants: Variants = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: transitionNormal },
  exit: { x: '100%', transition: transitionFast },
};

export const bottomSheetVariants: Variants = {
  hidden: { y: '100%' },
  visible: { y: 0, transition: transitionNormal },
  exit: { y: '100%', transition: transitionFast },
};

// List staggering utility
export const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

export const listChildVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: transitionNormal },
};

// Micro-interaction presets
export const pressAnimation = {
  tap: { scale: 0.98 },
  hover: { scale: 1.01 },
};
