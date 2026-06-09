export default function BrandLogo({ showText = true, size = "md", className = "" }) {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-9 w-9",
    lg: "h-12 w-12",
  };

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <img src="/viseo-mark.svg" alt="" aria-hidden="true" className={`${sizes[size] || sizes.md} rounded-md`} />
      {showText && <span className="font-bold tracking-tight text-white">Viseo</span>}
    </span>
  );
}
