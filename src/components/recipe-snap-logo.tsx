import type { SVGProps } from 'react';

export function RecipeSnapLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 50"
      width="150"
      height="37.5"
      aria-label="Recipe Snap Logo"
      {...props}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "hsl(var(--accent))", stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <rect width="200" height="50" rx="5" fill="transparent" />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="28"
        fontFamily="var(--font-geist-sans), Arial, sans-serif"
        fontWeight="bold"
        fill="url(#logoGradient)"
      >
        RecipeSnap
      </text>
      {/* Optional: A small camera shutter icon */}
      <circle cx="25" cy="25" r="8" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
      <path d="M 25 17 L 25 21 M 25 33 L 25 29 M 17 25 L 21 25 M 33 25 L 29 25" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}