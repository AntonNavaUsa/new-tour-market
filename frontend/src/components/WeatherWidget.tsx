import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wind, Thermometer, Droplets, CloudSnow, Sun, Cloud, CloudRain, Zap, Eye, Mountain } from 'lucide-react';
import { fetchWeather, describeWeather } from '../lib/api/weather';
import type { WeatherPoint } from '../lib/api/weather';

function WeatherIcon({ icon, className = 'h-5 w-5' }: { icon: string; className?: string }) {
  switch (icon) {
    case 'sun': return <Sun className={className} />;
    case 'cloud': return <Cloud className={className} />;
    case 'fog': return <Eye className={className} />;
    case 'rain': return <CloudRain className={className} />;
    case 'snow': return <CloudSnow className={className} />;
    case 'storm': return <Zap className={className} />;
    default: return <Cloud className={className} />;
  }
}

const WEEK_DAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function DayForecast({ day }: { day: WeatherPoint['daily'][0] }) {
  const { icon } = describeWeather(day.weathercode);
  const d = new Date(day.date);
  return (
    <div className="flex flex-col items-center gap-1 min-w-[48px]">
      <span className="text-xs text-white/60">{WEEK_DAYS[d.getDay()]}</span>
      <WeatherIcon icon={icon} className="h-4 w-4 text-white/80" />
      <span className="text-xs font-medium text-white">{day.tempMax}°</span>
      <span className="text-xs text-white/50">{day.tempMin}°</span>
    </div>
  );
}

function ElevationCard({ point, active, onClick }: { point: WeatherPoint; active: boolean; onClick: () => void }) {
  const { label: weatherLabel, icon } = describeWeather(point.current.weathercode);

  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl p-4 transition-all duration-200 w-full ${
        active
          ? 'bg-white/20 ring-2 ring-white/40'
          : 'bg-white/10 hover:bg-white/15'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-white/60 text-xs font-medium">{point.label}</p>
          <p className="text-white/40 text-xs">{point.elevation} м</p>
        </div>
        <WeatherIcon icon={icon} className="h-7 w-7 text-white/80" />
      </div>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-white">{point.current.temperature}°</span>
        <span className="text-white/60 text-xs">{weatherLabel}</span>
      </div>
    </button>
  );
}

export function WeatherWidget() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['weather-krasnaya-polyana'],
    queryFn: fetchWeather,
    staleTime: 30 * 60 * 1000,   // 30 мин
    gcTime: 60 * 60 * 1000,       // 1 час
    retry: 1,
  });

  const [activeIdx, setActiveIdx] = useState(0);

  if (isError) return null;

  return (
    <section className="py-16 bg-gradient-to-br from-slate-800 via-slate-700 to-emerald-900">
      <div className="container">
        <div className="text-center mb-8">
          <span className="text-emerald-400 text-sm font-semibold uppercase tracking-widest">Погода</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">Красная Поляна сейчас</h2>
          <p className="text-white/50 text-sm mt-1">Актуальные данные по высотам</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl bg-white/10 h-28" />
            ))}
          </div>
        ) : data ? (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Elevation selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {data.map((point, i) => (
                <ElevationCard
                  key={point.elevation}
                  point={point}
                  active={activeIdx === i}
                  onClick={() => setActiveIdx(i)}
                />
              ))}
            </div>

            {/* Detailed + forecast for selected elevation */}
            {data[activeIdx] && (
              <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                  <div className="flex items-center gap-2">
                    <Mountain className="h-4 w-4 text-emerald-400" />
                    <span className="text-white font-semibold">{data[activeIdx].label}</span>
                    <span className="text-white/40 text-sm">· {data[activeIdx].elevation} м</span>
                  </div>
                  {/* Current details */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-white/70">
                      <Wind className="h-4 w-4 text-sky-400" />
                      {data[activeIdx].current.windspeed} км/ч
                    </div>
                    <div className="flex items-center gap-1.5 text-white/70">
                      <Droplets className="h-4 w-4 text-blue-400" />
                      {data[activeIdx].current.precipitation} мм
                    </div>
                    {data[activeIdx].current.snowfall > 0 && (
                      <div className="flex items-center gap-1.5 text-white/70">
                        <CloudSnow className="h-4 w-4 text-cyan-300" />
                        {data[activeIdx].current.snowfall} см
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-white/70">
                      <Thermometer className="h-4 w-4 text-orange-400" />
                      {data[activeIdx].current.temperature}°C
                    </div>
                  </div>
                </div>

                {/* 5-day forecast */}
                <div className="flex gap-3 justify-around border-t border-white/10 pt-4">
                  {data[activeIdx].daily.map((day) => (
                    <DayForecast key={day.date} day={day} />
                  ))}
                </div>
              </div>
            )}

            <p className="text-center text-white/30 text-xs">
              Данные: Open-Meteo · обновляется каждые 30 минут
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
