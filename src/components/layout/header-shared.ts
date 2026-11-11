/** Styles and motion shared by the header and its panels. */
export const iconButton =
  "inline-flex size-11 items-center justify-center text-ink transition-transform duration-150 hover:scale-110";

export const panelMotion = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};
