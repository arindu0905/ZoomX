"use client";

/**
 * Flies a copy of a product image into the header bag icon, then gives the
 * icon a little bounce. Resolves when the flight lands (immediately under
 * reduced motion or when either element is missing), so callers can open
 * the bag drawer afterwards.
 */
export function flyToBag(source: Element | null | undefined): Promise<void> {
  const target = document.querySelector<HTMLElement>("[data-bag-target]");
  const img = source instanceof HTMLImageElement ? source : source?.querySelector("img");
  if (!target || !img || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return Promise.resolve();

  const from = img.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (!from.width || !to.width) return Promise.resolve();

  const size = Math.min(from.width, from.height, 220);
  const ghost = img.cloneNode() as HTMLImageElement;
  ghost.removeAttribute("srcset");
  ghost.src = img.currentSrc || img.src;
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${from.left + from.width / 2 - size / 2}px`,
    top: `${from.top + from.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    objectFit: "contain",
    zIndex: "9999",
    pointerEvents: "none",
    filter: "drop-shadow(0 12px 20px rgba(0,0,0,.2))",
  });
  document.body.appendChild(ghost);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const flight = ghost.animate(
    [
      { transform: "translate(0,0) scale(1) rotate(0deg)", opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 120}px) scale(0.55) rotate(-12deg)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.08) rotate(8deg)`, opacity: 0.6 },
    ],
    { duration: 750, easing: "cubic-bezier(.5,0,.25,1)" },
  );

  return flight.finished
    .catch(() => undefined)
    .then(() => {
      ghost.remove();
      target.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.3) rotate(-8deg)" }, { transform: "scale(1)" }],
        { duration: 420, easing: "cubic-bezier(.3,1.6,.5,1)" },
      );
    });
}
