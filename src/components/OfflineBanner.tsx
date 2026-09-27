import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-[#ba1a1a] text-white text-xs font-bold text-center py-2 px-3 flex items-center justify-center gap-1.5 sticky top-0 z-50 animate-fadeIn">
      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
      <span>İnternet bağlantısı yok — Plakala çevrimdışı</span>
    </div>
  );
};
