import React from 'react';
import { ChatPatternType } from '../types';

interface ChatBackgroundPatternProps {
  pattern: ChatPatternType;
  opacity?: number;
  className?: string;
}

export const ChatBackgroundPattern: React.FC<ChatBackgroundPatternProps> = ({
  pattern,
  opacity = 0.07,
  className = '',
}) => {
  if (pattern === 'none') {
    return (
      <div
        className={`absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-slate-500/[0.02] to-slate-900/[0.04] dark:to-black/[0.2] ${className}`}
      />
    );
  }

  if (pattern === 'dots') {
    return (
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${className}`}
        style={{
          opacity,
          backgroundImage:
            'radial-gradient(currentColor 1.25px, transparent 1.25px)',
          backgroundSize: '18px 18px',
        }}
      />
    );
  }

  if (pattern === 'grid') {
    return (
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${className}`}
        style={{
          opacity: opacity * 0.9,
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
      />
    );
  }

  if (pattern === 'waves') {
    return (
      <svg
        className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300 ${className}`}
        style={{ opacity: opacity * 1.2 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="chat-topo-pattern"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 20 Q15 5 30 20 T60 20 M0 40 Q15 25 30 40 T60 40 M0 60 Q15 45 30 60 T60 60"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#chat-topo-pattern)" />
      </svg>
    );
  }

  // Default: 'doodle' pattern with automotive and chat motifs (car, key, steering wheel, chat bubble, pin, spark)
  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300 ${className}`}
      style={{ opacity }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="chat-automotive-doodle"
          width="120"
          height="120"
          patternUnits="userSpaceOnUse"
        >
          {/* Mini Car Outline */}
          <g transform="translate(12, 14) scale(0.65)" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11h18l-2-5H5z" />
            <path d="M1 11h22v4H1z" />
            <circle cx="6" cy="15" r="2.2" />
            <circle cx="18" cy="15" r="2.2" />
          </g>

          {/* Steering Wheel */}
          <g transform="translate(82, 12) scale(0.6)" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3.5" />
            <path d="M12 2v6.5 M2 12h6.5 M15.5 12H22 M12 15.5V22" strokeLinecap="round" />
          </g>

          {/* Speech Bubble */}
          <g transform="translate(14, 76) scale(0.65)" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </g>

          {/* Location Pin */}
          <g transform="translate(84, 78) scale(0.65)" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </g>

          {/* Car Key / Sparkle Center */}
          <g transform="translate(52, 48) scale(0.55)" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l3 3 M15 15l3 3 M6 18l3-3 M15 9l3-3" />
          </g>

          {/* Parking 'P' badge */}
          <g transform="translate(54, 10) scale(0.5)" fill="none" stroke="currentColor" strokeWidth="1.7">
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <path d="M9 17V7h4a3 3 0 0 1 0 6H9" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          {/* Road / Lane lines */}
          <g transform="translate(48, 96) scale(0.6)" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M4 12h5 M15 12h5" strokeDasharray="3 3" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#chat-automotive-doodle)" />
    </svg>
  );
};
