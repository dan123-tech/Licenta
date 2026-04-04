"use client";

/**
 * Horizontal SVG wordmark (tiny embedded tagline). Prefer `FleetShareBrandBlock` for auth/landing.
 * Optional `height` prop (default 40) if you use this asset standalone.
 */

const SRC = {
  dark: "/brand/fleetshare-logo-dark.svg",
  light: "/brand/fleetshare-logo-light.svg",
};

/**
 * Horizontal FleetShare wordmark (SVG). Aspect ratio 480:160 (3:1).
 * @param {"dark" | "light"} variant — dark for navy/sidebar backgrounds; light for white forms.
 */
export default function FleetShareLogo({
  variant = "dark",
  className = "",
  height = 40,
  priority = false,
}) {
  const src = SRC[variant] ?? SRC.dark;
  const w = Math.round((height * 480) / 160);
  return (
    <img
      src={src}
      width={w}
      height={height}
      alt="FleetShare"
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      className={`block shrink-0 object-left object-contain ${className}`}
      style={{ height, width: "auto" }}
    />
  );
}
