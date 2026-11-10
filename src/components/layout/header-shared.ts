/** Styles and motion shared by the header and its panels. */
export const iconButton =
  "inline-flex size-11 items-center justify-center rounded-full text-ink/80 transition-colors hover:bg-black/5 hover:text-ink";

export const panelMotion = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};
