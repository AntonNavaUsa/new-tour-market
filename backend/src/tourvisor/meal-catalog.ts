export type MealGroupId =
  | 'ultra-all-inclusive'
  | 'all-inclusive'
  | 'breakfast'
  | 'two-meals'
  | 'three-meals'
  | 'no-meals'
  | 'self-service'
  | 'dinner-only';

export type MealCatalogItem = {
  code: string;
  group: MealGroupId;
  name: string;
  description: string;
};

export type MealGroup = {
  id: MealGroupId;
  name: string;
  description: string;
  codes: string[];
  sourceIds: number[];
};

export const MEAL_CATALOG: MealCatalogItem[] = [
  { code: 'UAI', group: 'ultra-all-inclusive', name: 'Ультра всё включено', description: 'Ультра всё включено' },
  { code: 'USAI', group: 'ultra-all-inclusive', name: 'Ультра-супериор всё включено', description: 'Выше уровня UAI' },
  { code: 'AI Premium', group: 'all-inclusive', name: 'Всё включено премиум-уровня', description: 'Всё включено премиум-уровня' },
  { code: 'AI Deluxe', group: 'all-inclusive', name: 'Всё включено делюкс-уровня', description: 'Всё включено делюкс-уровня' },
  { code: 'AI', group: 'all-inclusive', name: 'Всё включено', description: 'Всё включено' },
  { code: 'AI Soft', group: 'all-inclusive', name: 'Всё включено', description: 'Облегчённая версия' },
  { code: 'AI+', group: 'all-inclusive', name: 'Всё включено', description: 'Всё включено плюс' },
  { code: 'AI 24', group: 'all-inclusive', name: 'Всё включено', description: 'Всё включено 24 часа' },
  { code: 'BB', group: 'breakfast', name: 'Завтраки', description: 'Завтрак включён' },
  { code: 'CB', group: 'breakfast', name: 'Завтраки', description: 'Континентальный завтрак' },
  { code: 'HB', group: 'two-meals', name: '2-разовое питание', description: 'Полупансион: завтрак + ужин' },
  { code: 'HB+', group: 'two-meals', name: '2-разовое питание', description: 'Полупансион расширенный' },
  { code: 'HB Soft', group: 'two-meals', name: '2-разовое питание', description: 'Полупансион облегчённый' },
  { code: 'BD', group: 'two-meals', name: '2-разовое питание', description: 'Завтрак + ужин' },
  { code: 'LHB', group: 'two-meals', name: '2-разовое питание', description: 'Лёгкий полупансион' },
  { code: 'FB', group: 'three-meals', name: '3-разовое питание', description: 'Полный пансион: завтрак, обед, ужин' },
  { code: 'FB+', group: 'three-meals', name: '3-разовое питание', description: 'Полный пансион расширенный' },
  { code: 'FB Soft', group: 'three-meals', name: '3-разовое питание', description: 'Полный пансион облегчённый' },
  { code: 'FBT', group: 'three-meals', name: '3-разовое питание', description: 'Полный пансион + напитки к столу' },
  { code: 'RO', group: 'no-meals', name: 'Без питания', description: 'Без питания' },
  { code: 'SC', group: 'self-service', name: 'Самообслуживание', description: 'Кухня в номере' },
  { code: 'DNR', group: 'dinner-only', name: 'Только ужин', description: 'Одноразовое питание' },
];

export const MEAL_GROUP_NAMES: Record<MealGroupId, string> = {
  'ultra-all-inclusive': 'Ультра всё включено',
  'all-inclusive': 'Всё включено',
  breakfast: 'Завтраки',
  'two-meals': '2-разовое питание',
  'three-meals': '3-разовое питание',
  'no-meals': 'Без питания',
  'self-service': 'Самообслуживание',
  'dinner-only': 'Только ужин',
};

export const MEAL_GROUP_DESCRIPTIONS: Record<MealGroupId, string> = {
  'ultra-all-inclusive': 'UAI, USAI',
  'all-inclusive': 'AI, AI Soft, AI+, AI 24, AI Premium, AI Deluxe',
  breakfast: 'BB, CB',
  'two-meals': 'HB, HB+, HB Soft, BD, LHB',
  'three-meals': 'FB, FB+, FB Soft, FBT',
  'no-meals': 'RO',
  'self-service': 'SC',
  'dinner-only': 'DNR',
};