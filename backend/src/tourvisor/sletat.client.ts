import {
  BadGatewayException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type SletatResponse = {
  data: unknown;
  errorMessage?: string | null;
  isError?: boolean;
};

@Injectable()
export class SletatClient {
  private readonly logger = new Logger(SletatClient.name);
  private readonly baseUrl: string;
  private readonly login: string;
  private readonly password: string;
  private readonly timeoutMs: number;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = (this.config.get<string>('SLETAT_API_BASE_URL') || 'https://module.sletat.ru/Main.svc').replace(/\/$/, '');
    this.login = this.config.get<string>('SLETAT_LOGIN') || '';
    this.password = this.config.get<string>('SLETAT_PASSWORD') || '';
    this.timeoutMs = Number(this.config.get<string>('SLETAT_TIMEOUT_MS') || 30000);
  }

  async get<T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    if (!this.login || !this.password) {
      throw new BadGatewayException('Интеграция со Слетать.ру не настроена: отсутствуют SLETAT_LOGIN или SLETAT_PASSWORD');
    }

    const url = new URL(`${this.baseUrl}/${method}`);
    url.searchParams.set('login', this.login);
    url.searchParams.set('password', this.password);

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, Array.isArray(value) ? value.join(',') : String(value));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => undefined) as SletatResponse | undefined;

      if (!response.ok) {
        throw new HttpException(`Слетать.ру вернул ошибку ${response.status}`, response.status >= 500 ? HttpStatus.BAD_GATEWAY : response.status);
      }
      if (payload?.isError) {
        throw new BadGatewayException(payload.errorMessage || `Ошибка метода ${method} Слетать.ру`);
      }

      if (payload && typeof payload === 'object') {
        const resultKey = Object.keys(payload).find((key) => key.endsWith('Result'));
        const result = resultKey ? (payload as Record<string, unknown>)[resultKey] : payload;
        if (result && typeof result === 'object' && 'Data' in result) {
          return (result as Record<string, unknown>).Data as T;
        }
        return result as T;
      }

      return payload as T;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Sletat request failed: ${method}: ${(error as Error)?.message || error}`);
      throw new BadGatewayException('Слетать.ру временно недоступен');
    } finally {
      clearTimeout(timeout);
    }
  }
}
