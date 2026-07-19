interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const HEIGHTS = {
  sm: "h-8",
  md: "h-10",
  lg: "h-14",
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
