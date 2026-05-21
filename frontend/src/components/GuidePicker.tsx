import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Plus, User } from 'lucide-react';
import { guidesApi } from '../lib/api/guides';
import type { Guide } from '../types';

interface GuidePickerProps {
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function GuidePicker({ value, onChange, disabled }: GuidePickerProps) {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: allGuides = [] } = useQuery({
    queryKey: ['guides-picker'],
    queryFn: () => guidesApi.getAllGuides(),
    staleTime: 60_000,
  });

  const filtered = allGuides.filter(
    (g) =>
      !value.includes(g.id) &&
      (search === '' || g.name.toLowerCase().includes(search.toLowerCase())),
  );

  const selectedGuides: Guide[] = allGuides.filter((g) => value.includes(g.id));

  function addGuide(id: string) {
    onChange([...value, id]);
    setSearch('');
    setShowDropdown(false);
  }

  function removeGuide(id: string) {
    onChange(value.filter((v) => v !== id));
  }

  return (
    <div className="space-y-3">
      {/* Selected list */}
      {selectedGuides.length > 0 && (
        <div className="space-y-2">
          {selectedGuides.map((guide) => (
            <div
              key={guide.id}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50"
            >
              <div className="flex items-center gap-3">
                {guide.photoUrl ? (
                  <img
                    src={guide.photoUrl}
                    alt={guide.name}
                    className="w-10 h-10 object-cover rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div>
                  <div className="font-medium text-sm text-gray-800">{guide.name}</div>
                  {guide.certifications && (
                    <div className="text-xs text-gray-500 line-clamp-1">{guide.certifications}</div>
                  )}
                </div>
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeGuide(guide.id)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Search / add */}
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
              placeholder="Поиск гида..."
              className="flex-1 text-sm bg-transparent outline-none"
            />
          </div>

          {showDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
              <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                {filtered.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-400">
                    {allGuides.length === 0 ? 'Гиды не найдены. Гиды добавляются партнёрами в профиле.' : 'Ничего не найдено'}
                  </div>
                ) : (
                  filtered.map((guide) => (
                    <button
                      key={guide.id}
                      type="button"
                      onClick={() => addGuide(guide.id)}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left"
                    >
                      {guide.photoUrl ? (
                        <img
                          src={guide.photoUrl}
                          alt={guide.name}
                          className="w-8 h-8 object-cover rounded-full flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-800">{guide.name}</div>
                        {guide.certifications && (
                          <div className="text-xs text-gray-500 line-clamp-1">{guide.certifications}</div>
                        )}
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
