// A small burst of crumbs from a vote button: a quick "it counted" moment.
// Drawn into `host` (an empty, absolutely positioned layer the caller owns) so nothing clips it,
// animated with WAAPI and removed when done. Skipped entirely under reduced motion.
export function burst(host: HTMLElement | null, from: HTMLElement, colors: string[]) {
  if (!host || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const h = host.getBoundingClientRect();
  const b = from.getBoundingClientRect();
  const x = b.left - h.left + b.width / 2;
  const y = b.top - h.top + b.height / 2;
  const count = 10;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const distance = 22 + Math.random() * 16;
    const size = 4 + Math.round(Math.random() * 3);
    const crumb = document.createElement("span");
    Object.assign(crumb.style, {
      position: "absolute",
      left: `${x - size / 2}px`,
      top: `${y - size / 2}px`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: i % 3 ? "999px" : "1.5px",
      background: colors[i % colors.length],
      pointerEvents: "none",
    });
    host.append(crumb);
    const anim = crumb.animate(
      [
        { transform: "translate(0, 0) scale(1) rotate(0deg)", opacity: 1 },
        {
          transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0.4) rotate(${(Math.random() - 0.5) * 240}deg)`,
          opacity: 0,
        },
      ],
      { duration: 480 + Math.random() * 120, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
    );
    anim.onfinish = anim.oncancel = () => crumb.remove();
  }
}

export const AGREE_CRUMBS = ["var(--mustard)", "var(--spotlight)", "#ffd97a"];
export const DISAGREE_CRUMBS = ["var(--ketchup)", "var(--spotlight)", "#ff8a7a"];
