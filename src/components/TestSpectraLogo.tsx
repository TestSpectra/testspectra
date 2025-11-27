interface TestSpectraLogoProps {
  className?: string;
  size?: number;
}

export function TestSpectraLogo({ className = "", size = 40 }: TestSpectraLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Circle */}
      <circle cx="50" cy="50" r="48" fill="url(#bgGradient)" opacity="0.1" />
      
      {/* Main Spectrum Prism Shape */}
      <path
        d="M50 15 L75 45 L50 55 L25 45 Z"
        fill="url(#prismGradient1)"
        opacity="0.9"
      />
      
      {/* Spectrum Rays - Multiple colored rays emanating */}
      <path
        d="M50 55 L58 75 L62 73 L54 53 Z"
        fill="url(#ray1)"
        opacity="0.85"
      />
      <path
        d="M50 55 L50 78 L54 78 L54 55 Z"
        fill="url(#ray2)"
        opacity="0.85"
      />
      <path
        d="M50 55 L42 75 L38 73 L46 53 Z"
        fill="url(#ray3)"
        opacity="0.85"
      />
      
      {/* Check Mark Integration - subtle check in the center */}
      <path
        d="M44 42 L48 47 L58 35"
        stroke="url(#checkGradient)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.95"
      />
      
      {/* Accent Dots - data points */}
      <circle cx="30" cy="50" r="2.5" fill="#3b82f6" opacity="0.6" />
      <circle cx="70" cy="50" r="2.5" fill="#8b5cf6" opacity="0.6" />
      <circle cx="50" cy="82" r="2.5" fill="#14b8a6" opacity="0.6" />
      
      {/* Orbital Ring - subtle */}
      <circle
        cx="50"
        cy="50"
        r="35"
        stroke="url(#ringGradient)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.3"
        strokeDasharray="4 8"
      />
      
      {/* Gradients */}
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        
        <linearGradient id="prismGradient1" x1="25" y1="15" x2="75" y2="55">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        
        <linearGradient id="ray1" x1="50" y1="55" x2="62" y2="73">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.9" />
        </linearGradient>
        
        <linearGradient id="ray2" x1="50" y1="55" x2="54" y2="78">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.9" />
        </linearGradient>
        
        <linearGradient id="ray3" x1="50" y1="55" x2="38" y2="73">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.9" />
        </linearGradient>
        
        <linearGradient id="checkGradient" x1="44" y1="35" x2="58" y2="47">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e0e7ff" />
        </linearGradient>
        
        <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
    </svg>
  );
}
