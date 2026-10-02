import React from 'react';
import {
  Gem,
  Building2,
  Sparkles,
  ShieldCheck,
  Briefcase,
  Rocket,
  Award,
} from 'lucide-react';

interface BrandIconProps {
  name?: string;
  className?: string;
}

export const BrandIcon: React.FC<BrandIconProps> = ({ name = 'gem', className = 'w-5 h-5' }) => {
  switch (name) {
    case 'building':
      return <Building2 className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'shield':
      return <ShieldCheck className={className} />;
    case 'briefcase':
      return <Briefcase className={className} />;
    case 'rocket':
      return <Rocket className={className} />;
    case 'award':
      return <Award className={className} />;
    case 'gem':
    default:
      return <Gem className={className} />;
  }
};
