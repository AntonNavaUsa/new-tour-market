import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Plus, Building2 } from 'lucide-react';
import { accommodationsApi } from '../lib/api/accommodationsApi';
import type { Accommodation } from '../types';

const TYPE_LABELS: Record<string, string> = {
  HOTEL: 'Отель',
  HOSTEL: 'Хостел',
  GUESTHOUSE: 'Гостевой дом',
  APARTMENT: 'Апартаменты',
  CAMPING: 'Кемпинг',
  OTHER: 'Другое',
};

interface AccommodationPickerProps {
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function AccommodationPicker({ value, onChange, disabled }: AccommodationPickerProps) {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const { data } = useQuery({
    queryKey: ['accommodations', 'picker', search],
    queryFn: () => accommodationsApi.getAll({ search: search || undefined, take: 20 }),
    staleTime: 30_000,
  });

  const allAccommodations = data?.data ?? [];
  const filtered = allAccommodations.filter((a) => !value.includes(a.id));

  const { data: selectedData } = useQuery({
    queryKey: ['accommodations', 'selected', value.join(',')],
    queryFn: async () => {
      if (!value.length) return [];
      const results = await Promise.all(value.map((id) => accommodationsApi.getOne(id)));
      return results;
    },
    enabled: value.length > 0,
    staleTime: 60_000,
  });

  const selectedAccommodations: Accommodation[] = selectedData ?? [];

  function addAccommodation(id: string) {
    onChange([...value, id]);
    setSearch('');
    setShowDropdown(false);
  }

  function removeAccommodation(id: string) {
    onChange(value.filter((v) => v !== id));
  }

  return (
    <div className="space-y-3">
      {/* Selected list */}
      {selectedAccommodations.length > 0 && (
        <div className="space-y-2">
          {selectedAccommodations.map((acc) => (
            <div
              key={acc.id}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50"
            >
              <div className="flex items-center gap-3">
                {acc.photos?.[0]?.thumbUrl ? (
                  <img
                    src={acc.photos[0].thumbUrl}
                    alt={acc.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div>
                  <div className="font-medium text-sm text-gray-800">{acc.name}</div>
                  <div className="text-xs text-gray-500">
                    {TYPE_LABELS[acc.type] ?? acc.type}
                    {acc.address ? ` · ${acc.address}` : ''}
                  </div>
                </div>
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeAccommodation(acc.id)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add button / search */}
      {!disabled && (
        <div className="relative">
          <div
            className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-text hover:border-blue-400 transition-colors"
            onClick={() => setShowDropdown(true)}
          >
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Поиск объекта размещения..."
              className="flex-1 text-sm bg-transparent outline-none"
            />
          </div>

          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                {filtered.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-400">Ничего не найдено</div>
                ) : (
                  filtered.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => addAccommodation(acc.id)}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left"
                    >
                      {acc.photos?.[0]?.thumbUrl ? (
                        <img
                          src={acc.photos[0].thumbUrl}
                          alt={acc.name}
                          className="w-8 h-8 object-cover rounded flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-800">{acc.name}</div>
                        <div className="text-xs text-gray-500">
                          {TYPE_LABELS[acc.type] ?? acc.type}
                          {acc.address ? ` · ${acc.address}` : ''}
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-blue-500 ml-auto" />
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
