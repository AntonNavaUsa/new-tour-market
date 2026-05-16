import React from 'react';
import { Mountain, Bike, Waves, Camera, Snowflake, Ship, Tag, Compass, BedDouble } from 'lucide-react';

// ---- Custom SVG icons ----

const HikingIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Head */}
    <circle cx="12" cy="3" r="1.5" />
    {/* Body */}
    <line x1="12" y1="4.5" x2="12" y2="13" />
    {/* Left arm (short, to grip) */}
    <line x1="12" y1="8" x2="8.5" y2="10.5" />
    {/* Left trekking pole */}
    <line x1="8.5" y1="10.5" x2="6.5" y2="21" />
    {/* Right arm (short, to grip) */}
    <line x1="12" y1="8" x2="15.5" y2="10.5" />
    {/* Right trekking pole */}
    <line x1="15.5" y1="10.5" x2="17.5" y2="21" />
    {/* Left leg (step forward) */}
    <polyline points="12,13 10,17.5 9,21" />
    {/* Right leg (step back) */}
    <polyline points="12,13 13.5,17.5 14.5,21" />
  </svg>
);

const BackpackingIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Head */}
    <circle cx="11" cy="3.5" r="1.5" />
    {/* Body */}
    <line x1="11" y1="5" x2="11" y2="13.5" />
    {/* Backpack body */}
    <rect x="12.5" y="5.5" width="3.5" height="5.5" rx="0.5" />
    {/* Backpack straps */}
    <line x1="12.5" y1="6.5" x2="11" y2="7" />
    <line x1="12.5" y1="10" x2="11" y2="10.5" />
    {/* Left arm */}
    <line x1="11" y1="8.5" x2="8.5" y2="12" />
    {/* Right arm (close to backpack) */}
    <line x1="11" y1="8.5" x2="13" y2="12" />
    {/* Left leg */}
    <polyline points="11,13.5 9,18.5 8,21" />
    {/* Right leg */}
    <polyline points="11,13.5 13,18.5 14,21" />
  </svg>
);

const JeepIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Main body (high clearance) */}
    <rect x="1.5" y="8" width="21" height="7" rx="1" />
    {/* Cab roof */}
    <rect x="4" y="3.5" width="14" height="5" rx="1.5" />
    {/* Window divider */}
    <line x1="10.5" y1="4" x2="10.5" y2="8.5" />
    {/* Front wheel */}
    <circle cx="6.5" cy="17.5" r="2.5" />
    <circle cx="6.5" cy="17.5" r="1" />
    {/* Rear wheel */}
    <circle cx="17.5" cy="17.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="1" />
    {/* Front bumper */}
    <line x1="1.5" y1="11" x2="0" y2="11" />
    {/* Roof rack */}
    <line x1="5.5" y1="3.5" x2="5.5" y2="2.5" />
    <line x1="17" y1="3.5" x2="17" y2="2.5" />
    <line x1="5.5" y1="2.5" x2="17" y2="2.5" />
  </svg>
);

// ---- Icon registry ----

export type CardTypeIconKey =
  | 'hiking'
  | 'backpacking'
  | 'jeep'
  | 'mountain'
  | 'cycling'
  | 'water'
  | 'photo'
  | 'winter'
  | 'boat'
  | 'compass'
  | 'hotel';

export interface IconOption {
  key: CardTypeIconKey;
  label: string;
  component: React.FC<{ className?: string }>;
}

export const ICON_OPTIONS: IconOption[] = [
  { key: 'hiking', label: 'Хайкинг / Треккинг', component: HikingIcon },
  { key: 'backpacking', label: 'Поход / Рюкзак', component: BackpackingIcon },
  { key: 'jeep', label: 'Джип / Авто', component: JeepIcon },
  {
    key: 'mountain',
    label: 'Горный',
    component: ({ className }) => <Mountain className={className} />,
  },
  {
    key: 'cycling',
    label: 'Велосипед',
    component: ({ className }) => <Bike className={className} />,
  },
  {
    key: 'water',
    label: 'Водный',
    component: ({ className }) => <Waves className={className} />,
  },
  {
    key: 'photo',
    label: 'Фото-тур',
    component: ({ className }) => <Camera className={className} />,
  },
  {
    key: 'winter',
    label: 'Зимний',
    component: ({ className }) => <Snowflake className={className} />,
  },
  {
    key: 'boat',
    label: 'Морской / Лодка',
    component: ({ className }) => <Ship className={className} />,
  },
  {
    key: 'compass',
    label: 'Обзорный',
    component: ({ className }) => <Compass className={className} />,
  },
  {
    key: 'hotel',
    label: 'Отель / Проживание',
    component: ({ className }) => <BedDouble className={className} />,
  },
];

const ICON_MAP = Object.fromEntries(
  ICON_OPTIONS.map((o) => [o.key, o.component])
) as Record<CardTypeIconKey, React.FC<{ className?: string }>>;

interface CardTypeIconProps {
  icon?: string | null;
  className?: string;
}

/** Renders the correct icon for a card type, falling back to Tag */
const CardTypeIcon: React.FC<CardTypeIconProps> = ({ icon, className }) => {
  if (icon && icon in ICON_MAP) {
    const IconComponent = ICON_MAP[icon as CardTypeIconKey];
    return <IconComponent className={className} />;
  }
  return <Tag className={className} />;
};

export default CardTypeIcon;
