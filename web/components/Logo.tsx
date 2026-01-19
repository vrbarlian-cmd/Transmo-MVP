'use client';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  // Venmo-style: simple, clean text logo
  return (
    <div className={className}>
      <span className={`${sizeClasses[size]} font-bold text-venmo-primary tracking-tight`}>
        Transmo
      </span>
    </div>
  );
}