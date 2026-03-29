import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function Logo({ size = "medium" }) {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.Settings.list(),
  });

  const setting = settings?.[0];
  
  const sizeClasses = {
    small: "h-12 w-12",
    medium: "h-20 w-20",
    large: "h-32 w-32"
  };

  const textSizes = {
    small: "text-lg",
    medium: "text-2xl",
    large: "text-4xl"
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {setting?.logo_url ? (
        <img 
          src={setting.logo_url} 
          alt="לוגו" 
          className={`${sizeClasses[size]} object-contain rounded-xl`}
        />
      ) : (
        <div className={`${sizeClasses[size]} bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8a] rounded-xl flex items-center justify-center shadow-lg`}>
          <span className="text-white font-bold text-2xl">ת"ת</span>
        </div>
      )}
      {setting?.campaign_name && (
        <h2 className={`${textSizes[size]} font-bold text-[#1e3a5f] text-center`}>
          {setting.campaign_name}
        </h2>
      )}
    </div>
  );
}