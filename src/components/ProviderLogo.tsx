import { useState } from 'react';
import { getProviderLogoUrl, getProviderDisplayName, getProviderInitials } from '../data/providerLogos';

interface ProviderLogoProps {
  provider: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
};

const textSizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export default function ProviderLogo({ provider, size = 'sm', className = '' }: ProviderLogoProps) {
  const [imageError, setImageError] = useState(false);
  const logoUrl = getProviderLogoUrl(provider);
  const displayName = getProviderDisplayName(provider);
  const initials = getProviderInitials(provider);
  const currentSizeClass = sizeClasses[size];
  const currentTextSizeClass = textSizeClasses[size];

  // If no logo URL or image failed to load, show initials
  if (imageError || !logoUrl) {
    return (
      <div
        className={`rounded-full flex items-center justify-center font-bold shadow-sm border bg-amber-100 text-amber-700 border-amber-200/50 ${currentSizeClass} ${className}`}
        title={displayName}
      >
        <span className={`${currentTextSizeClass} tracking-tighter`}>{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={`לוגו ${displayName}`}
      className={`object-contain rounded-full bg-white shadow-sm border border-gray-200/50 ${currentSizeClass} ${className}`}
      onError={() => setImageError(true)}
      title={displayName}
    />
  );
}

