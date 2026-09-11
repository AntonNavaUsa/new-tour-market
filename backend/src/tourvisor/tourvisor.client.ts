import {
  BadGatewayException,
  HttpException,
  Injectable,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TourvisorClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly timeoutMs: number;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = (this.config.get<string>('TOURVISOR_API_BASE_URL') || 'https://api.tourvisor.ru').replace(/\/$/, '');
    this.token = this.config.get<string>('TOURVISOR_JWT_TOKEN') || '';
    this.timeoutMs = Number(this.config.get<string>('TOURVISOR_TIMEOUT_MS') || 15000);
  }

  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    if (!this.token) {
      throw new BadGatewayException('Tourvisor integration is not configured');
    }

    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(params || {})) {
      if (value === undefined || value === null || value === '') continue;
      if (Array.isArray(value)) {
        value.forEach((item) => url.searchParams.append(key, String(item)));
      } else {
        url.searchParams.set(key, String(value));
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        signal: controller.signal,
      });

      if (response.ok) {
        return (await response.json()) as T;
      }

      if (response.status === 429) {
        throw new HttpException('Tourvisor rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
      }

      const reason = await response.text().catch(() => '');
      throw new HttpException(`Tourvisor request failed: ${reason || response.statusText}`, response.status >= 400 && response.status < 500 ? response.status : 502);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadGatewayException('Tourvisor is temporarily unavailable');
    } finally {
      clearTimeout(timeout);
    }
  }
}
