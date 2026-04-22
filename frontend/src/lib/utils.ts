import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numPrice);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'}`;
    }
    return `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'} ${remainingMinutes} мин`;
  }
  return `${minutes} мин`;
}

import type { GroupTier, Price } from '../types';

/** Рассчитать итоговую стоимость для тикета с учётом группового тарифа */
export function calculateTicketPrice(price: Price, people: number): number | null {
  // groupTiers may come as a JSON string from some API responses
  const rawTiers = price.groupTiers;
  const tiers: GroupTier[] | null =
    typeof rawTiers === 'string'
      ? JSON.parse(rawTiers)
      : Array.isArray(rawTiers)
      ? rawTiers
      : null;

  if (tiers && tiers.length > 0) {
    const tier = tiers.find(
      (t) => people >= t.minPeople && (t.maxPeople == null || people <= t.maxPeople),
    );
    if (!tier) return null;
    return tier.priceType === 'fixed' ? tier.price : tier.price * people;
  }
  return Number(price.adultPrice) * people;
}

/** Минимальная цена из тиров (для отображения «от X ₽»).
 * Берём минимальное значение price — для per_person это цена за чел., для fixed — цена за группу. */
export function getMinPriceFromTiers(tiers: GroupTier[]): number {
  if (!tiers.length) return 0;
  return Math.min(...tiers.map((t) => t.price));
}

/** Описание тарифной сетки в виде читаемого текста */
export function formatTierLabel(tier: GroupTier): string {
  const range =
    tier.maxPeople == null
      ? `от ${tier.minPeople} чел.`
      : tier.minPeople === tier.maxPeople
      ? `${tier.minPeople} чел.`
      : `${tier.minPeople}–${tier.maxPeople} чел.`;
  const priceStr =
    tier.priceType === 'fixed'
      ? `${tier.price.toLocaleString('ru-RU')} ₽ за группу`
      : `${tier.price.toLocaleString('ru-RU')} ₽/чел.`;
  return `${range} — ${priceStr}`;
}
