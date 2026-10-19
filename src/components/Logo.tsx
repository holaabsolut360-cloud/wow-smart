interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const HEIGHTS = {
  sm: "h-10",
  md: "h-11 md:h-12",
  lg: "h-16",
};

// Logotipo real de WowSmart (public/logo-trim.png: mismo logo sin márgenes vacíos,
// para que se vea más grande y nítido, sobre todo en celular).
export default function Logo({ size = "md", className = "" }: LogoProps) {
  return (
    <img
      src="/logo-trim.png"
      loading="eager"
      decoding="async"
      alt="WowSmart"
      className={`${HEIGHTS[size]} w-auto object-contain select-none ${className}`}
    />
  );
}
