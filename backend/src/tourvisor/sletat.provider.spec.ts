import { describe, expect, it } from '@jest/globals';
import { normalizeMealName } from './sletat.provider';

describe('normalizeMealName', () => {
  it('maps inclusive and breakfast variants to the canonical meal types', () => {
    expect(normalizeMealName('AI')).toBe('Всё включено');
    expect(normalizeMealName('All Inclusive')).toBe('Всё включено');
    expect(normalizeMealName('UAI')).toBe('Ультра всё включено');
    expect(normalizeMealName('Ultra All Inclusive')).toBe('Ультра всё включено');
    expect(normalizeMealName('3-разовое')).toBe('3-разовое');
    expect(normalizeMealName('2-разовое')).toBe('2-разовое');
    expect(normalizeMealName('Breakfast')).toBe('Завтраки');
    expect(normalizeMealName('HB')).toBe('2-разовое');
    expect(normalizeMealName('FB')).toBe('3-разовое');
    expect(normalizeMealName('RO')).toBe('Без питания');
  });

  it('keeps unknown values readable but grouped under the supported list', () => {
    expect(normalizeMealName('All inclusive')).toBe('Всё включено');
    expect(normalizeMealName('Ultra all inclusive')).toBe('Ультра всё включено');
    expect(normalizeMealName('с завтраками')).toBe('Завтраки');
    expect(normalizeMealName('half board')).toBe('2-разовое');
    expect(normalizeMealName('full board')).toBe('3-разовое');
  });
});
