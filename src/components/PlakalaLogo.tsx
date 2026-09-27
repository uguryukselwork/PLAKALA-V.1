import React from 'react';

interface PlakalaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PlakalaLogo: React.FC<PlakalaLogoProps> = ({
  size = 'sm',
  className = '',
}) => {
  if (size === 'lg') {
    return (
      <div
        className={`relative inline-flex flex-col items-center justify-center bg-[#d8ff35] text-black px-8 py-3.5 rounded-[22px] border-[3.5px] border-black shadow-[5px_5px_0px_#000000] select-none transition-transform active:scale-95 ${className}`}
      >
        {/* TR in Top-Left */}
        <span className="absolute top-2 left-3.5 font-black text-xs tracking-widest text-black/90 font-mono-plate">
          TR
        </span>
        {/* 'plakala' in the Center */}
        <span className="font-black text-3xl tracking-tight text-black lowercase leading-none pt-2 font-sans">
          plakala
        </span>
      </div>
    );
  }

  if (size === 'md') {
    return (
      <div
        className={`relative inline-flex flex-col items-center justify-center bg-[#d8ff35] text-black px-6 py-2.5 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_#000000] select-none transition-transform active:scale-95 ${className}`}
      >
        {/* TR in Top-Left */}
        <span className="absolute top-1.5 left-2.5 font-black text-[10px] tracking-wider text-black/90 font-mono-plate">
          TR
        </span>
        {/* 'plakala' in the Center */}
        <span className="font-black text-2xl tracking-tight text-black lowercase leading-none pt-1.5 font-sans">
          plakala
        </span>
      </div>
    );
  }

  // Default 'sm' for Header
  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center bg-[#d8ff35] text-black px-4 py-1.5 rounded-xl border-[2.5px] border-black shadow-[3px_3px_0px_#000000] select-none transition-transform active:scale-95 ${className}`}
    >
      {/* TR in Top-Left */}
      <span className="absolute top-1 left-2 font-black text-[9px] tracking-wider text-black/90 font-mono-plate">
        TR
      </span>
      {/* 'plakala' in the Center */}
      <span className="font-black text-lg tracking-tight text-black lowercase leading-none pt-1 font-sans">
        plakala
      </span>
    </div>
  );
};
