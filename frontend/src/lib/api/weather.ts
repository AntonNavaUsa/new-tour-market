import axios from 'axios';

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

// Красная Поляна
const LAT = 43.6854;
const LON = 40.2697;

export interface WeatherPoint {
  elevation: number;
  label: string;
  current: {
    temperature: number;
    windspeed: number;
    weathercode: number;
    precipitation: number;
    snowfall: number;
  };
  daily: {
    date: string;
    tempMax: number;
    tempMin: number;
    weathercode: number;
    precipitation: number;
  }[];
}

function mapResponse(label: string, elevation: number, data: any): WeatherPoint {
  return {
    elevation,
    label,
    current: {
      temperature: Math.round(data.current.temperature_2m),
      windspeed: Math.round(data.current.windspeed_10m),
      weathercode: data.current.weathercode,
      precipitation: data.current.precipitation,
      snowfall: data.current.snowfall,
    },
    daily: data.daily.time.slice(0, 5).map((date: string, i: number) => ({
      date,
      tempMax: Math.round(data.daily.temperature_2m_max[i]),
      tempMin: Math.round(data.daily.temperature_2m_min[i]),
      weathercode: data.daily.weathercode[i],
      precipitation: data.daily.precipitation_sum[i],
    })),
  };
}

const PARAMS = {
  latitude: LAT,
  longitude: LON,
  current: 'temperature_2m,windspeed_10m,weathercode,precipitation,snowfall',
  daily: 'temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum',
  timezone: 'Europe/Moscow',
  forecast_days: 5,
};

export async function fetchWeather(): Promise<WeatherPoint[]> {
  const elevations = [
    { elevation: 560, label: 'Внизу в посёлке (база)' },
    { elevation: 1600, label: 'Средний склон' },
    { elevation: 2320, label: 'Пик' },
  ];

  const results = await Promise.all(
    elevations.map(({ elevation, label }) =>
      axios
        .get(BASE_URL, { params: { ...PARAMS, elevation } })
        .then((r) => mapResponse(label, elevation, r.data)),
    ),
  );

  return results;
}

/** WMO weather code → описание и иконка-код */
export function describeWeather(code: number): { label: string; icon: string } {
  if (code === 0) return { label: 'Ясно', icon: 'sun' };
  if (code <= 3) return { label: 'Облачно', icon: 'cloud' };
  if (code <= 48) return { label: 'Туман', icon: 'fog' };
  if (code <= 67) return { label: 'Дождь', icon: 'rain' };
  if (code <= 77) return { label: 'Снег', icon: 'snow' };
  if (code <= 82) return { label: 'Ливень', icon: 'rain' };
  if (code <= 86) return { label: 'Снег', icon: 'snow' };
  return { label: 'Гроза', icon: 'storm' };
}
