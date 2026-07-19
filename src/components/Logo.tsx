interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const HEIGHTS = {
  sm: "h-10",
  md: "h-14",
  lg: "h-16",
};

// Logotipo real de WowSmart (public/logo.png).
export default function Logo({ size = "md", className = "" }: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt="WowSmart"
      className={`${HEIGHTS[size]} w-auto object-contain select-none ${className}`}
    />
  );
}
