import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Lock } from 'lucide-react';

export interface OccupancyBlock {
  id: string;
  dateFrom: string;
  dateTo: string;
  reason: string | null;
  createdAt: string;
}

export interface OccupancyOrder {
  id: string;
  date: string;
}

interface OccupancyCalendarProps {
  blocks: OccupancyBlock[];
  orders: OccupancyOrder[];
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
  onAddBlock: (dateFrom: string, dateTo: string, reason?: string) => Promise<void>;
  onDeleteBlock: (blockId: string) => Promise<void>;
  isLoading?: boolean;
}

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

function isBetween(date: Date, from: Date, to: Date) {
  const d = date.getTime();
  return d >= from.getTime() && d <= to.getTime();
}

export function OccupancyCalendar({
  blocks,
  orders,
  year,
  month,
  onMonthChange,
  onAddBlock,
  onDeleteBlock,
  isLoading = false,
}: OccupancyCalendarProps) {
  const [selectStart, setSelectStart] = useState<string | null>(null);
  const [selectEnd, setSelectEnd] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  // ISO week: Monday = 0
  const startDow = (firstDay.getDay() + 6) % 7;

  const orderDates = new Set(orders.map((o) => o.date.slice(0, 10)));

  function getBlockForDate(dateStr: string): OccupancyBlock | undefined {
    const d = new Date(dateStr);
    return blocks.find((b) => isBetween(d, new Date(b.dateFrom), new Date(b.dateTo)));
  }

  function getDayClass(dateStr: string) {
    const block = getBlockForDate(dateStr);
    if (block) return 'bg-red-100 text-red-700 border-red-300';
    if (orderDates.has(dateStr)) return 'bg-amber-100 text-amber-700 border-amber-300';
    return 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50';
  }

  function handleDayClick(dateStr: string) {
    if (!selectStart) {
      setSelectStart(dateStr);
      setSelectEnd(null);
    } else if (!selectEnd) {
      const a = selectStart <= dateStr ? selectStart : dateStr;
      const b = selectStart <= dateStr ? dateStr : selectStart;
      setSelectEnd(b);
      setSelectStart(a);
    } else {
      setSelectStart(dateStr);
      setSelectEnd(null);
      setReason('');
    }
  }

  async function handleAddBlock() {
    if (!selectStart || !selectEnd) return;
    setAdding(true);
    try {
      await onAddBlock(selectStart, selectEnd, reason || undefined);
      setSelectStart(null);
      setSelectEnd(null);
      setReason('');
    } finally {
      setAdding(false);
    }
  }

  async function handleDeleteBlock(blockId: string) {
    setDeletingId(blockId);
    try {
      await onDeleteBlock(blockId);
    } finally {
      setDeletingId(null);
    }
  }

  function prevMonth() {
    if (month === 1) onMonthChange(year - 1, 12);
    else onMonthChange(year, month - 1);
  }

  function nextMonth() {
    if (month === 12) onMonthChange(year + 1, 1);
    else onMonthChange(year, month + 1);
  }

  const cells: (string | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      return `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isSelected = (dateStr: string) => {
    if (!selectStart) return false;
    if (!selectEnd) return dateStr === selectStart;
    return dateStr >= selectStart && dateStr <= selectEnd;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-1 rounded hover:bg-gray-100">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-gray-800">
          {MONTHS[month - 1]} {year}
        </span>
        <button onClick={nextMonth} className="p-1 rounded hover:bg-gray-100">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-200 border border-red-300 inline-block" /> Заблокировано</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-200 border border-amber-300 inline-block" /> Есть заказы</span>
      </div>

      {/* Calendar grid */}
      {isLoading ? (
        <div className="h-48 flex items-center justify-center text-gray-400">Загрузка...</div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">{d}</div>
          ))}
          {cells.map((dateStr, idx) =>
            dateStr ? (
              <button
                key={idx}
                onClick={() => handleDayClick(dateStr)}
                className={`aspect-square flex items-center justify-center rounded border text-sm transition-all
                  ${getDayClass(dateStr)}
                  ${isSelected(dateStr) ? 'ring-2 ring-blue-500' : ''}
                `}
              >
                {parseInt(dateStr.slice(8))}
              </button>
            ) : (
              <div key={idx} />
            ),
          )}
        </div>
      )}

      {/* Selection panel */}
      {selectStart && (
        <div className="p-3 rounded-lg border border-blue-200 bg-blue-50 space-y-2">
          <div className="text-sm font-medium text-blue-800">
            {selectEnd
              ? `Блокировать: ${selectStart} — ${selectEnd}`
              : `Выбрано начало: ${selectStart}. Кликните на конечную дату.`}
          </div>
          {selectEnd && (
            <>
              <input
                type="text"
                placeholder="Причина (опционально)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddBlock}
                  disabled={adding}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  <Lock className="w-3 h-3" />
                  {adding ? 'Сохранение...' : 'Заблокировать'}
                </button>
                <button
                  onClick={() => { setSelectStart(null); setSelectEnd(null); }}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                >
                  Отмена
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Blocks list */}
      {blocks.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Блокировки ({blocks.length})</h4>
          <div className="space-y-1">
            {blocks.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-2 rounded border border-red-200 bg-red-50">
                <div className="text-sm">
                  <span className="font-medium text-red-700">
                    {b.dateFrom.slice(0, 10)} — {b.dateTo.slice(0, 10)}
                  </span>
                  {b.reason && <span className="text-gray-500 ml-2">({b.reason})</span>}
                </div>
                <button
                  onClick={() => handleDeleteBlock(b.id)}
                  disabled={deletingId === b.id}
                  className="p-1 text-red-500 hover:bg-red-100 rounded disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add single block button hint */}
      <p className="text-xs text-gray-400">
        Кликните на дату начала, затем на дату окончания для создания блокировки.
      </p>
    </div>
  );
}
