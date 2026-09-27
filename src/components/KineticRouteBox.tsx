import React from 'react';
import { Car, MapPin, User } from 'lucide-react';

export const KineticRouteBox: React.FC = () => {
  return (
    <div className="relative w-full h-16 bg-white dark:bg-[#1e2226] border border-slate-200 dark:border-zinc-800 rounded-3xl px-5 flex items-center mb-5 overflow-hidden shadow-xs">
      {/* Background Track */}
      <div className="absolute left-6 right-6 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full z-1" />

      {/* Animated Glowing Trail */}
      <div className="absolute left-6 h-1.5 bg-linear-to-r from-[#111315] via-[#a3cc00] to-[#d8ff35] rounded-full z-2 animate-flow-route" />

      {/* Animated Running Person (Chasing the car) */}
      <div className="absolute w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-300 z-3 animate-person-run">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 -scale-x-100">
          <circle cx="12" cy="4" r="2" />
          <path d="M12 6v6" />
          <path d="M12 8l-4 3" />
          <path d="M12 8l4 2" />
          <path d="M12 12l-3 5h-2" />
          <path d="M12 12l2 3 2 4" />
        </svg>
      </div>

      {/* Animated Car Orb */}
      <div className="absolute w-8 h-8 bg-[#111315] border-2 border-[#d8ff35] rounded-full text-[#d8ff35] flex items-center justify-center text-xs z-4 shadow-md animate-car-drive">
        <Car className="w-4 h-4" />
      </div>

      {/* Destination Pin */}
      <div className="absolute right-5 w-7 h-7 bg-[#d8ff35] text-[#111315] rounded-full flex items-center justify-center z-3 shadow-[0_2px_8px_rgba(216,255,53,0.5)]">
        <MapPin className="w-4 h-4" />
      </div>
    </div>
  );
};
