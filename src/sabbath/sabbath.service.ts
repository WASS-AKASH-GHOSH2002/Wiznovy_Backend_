import { Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import axios from 'axios';

export interface SabbathStatus {
  isSabbath: boolean;
  endsAt?: string;
  message?: string;
}

@Injectable()
export class SabbathService {
  private readonly logger = new Logger(SabbathService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async isSabbath(lat: number, lng: number, timezone: string): Promise<SabbathStatus> {
    try {
      const now = new Date();
      const fridaySunset = await this.getSunset(lat, lng, this.getWeekday(now, 5)); // Friday
      const saturdaySunset = await this.getSunset(lat, lng, this.getWeekday(now, 6)); // Saturday

      const nowUtc = now.getTime();

      if (nowUtc >= fridaySunset && nowUtc < saturdaySunset) {
        const endsAt = this.formatTime(saturdaySunset, timezone);
        return {
          isSabbath: true,
          endsAt,
          message: `This feature is currently unavailable. Please try again after Saturday sunset (~${endsAt})`,
        };
      }

      return { isSabbath: false };
    } catch (err) {
      this.logger.warn(`Sabbath check failed: ${err.message} — defaulting to not Sabbath`);
      return { isSabbath: false };
    }
  }

  private async getSunset(lat: number, lng: number, date: string): Promise<number> {
    const cacheKey = `sunset:${lat}:${lng}:${date}`;
    const cached = await this.cache.get<number>(cacheKey);
    if (cached) return cached;

    const { data } = await axios.get('https://api.sunrise-sunset.org/json', {
      params: { lat, lng, date, formatted: 0 },
      timeout: 5000,
    });

    const sunsetUtc = new Date(data.results.sunset).getTime();
    await this.cache.set(cacheKey, sunsetUtc, 86400); // cache 24h
    return sunsetUtc;
  }

  private getWeekday(now: Date, targetDay: number): string {
    const day = now.getDay(); // 0=Sun, 5=Fri, 6=Sat
    const diff = targetDay - day;
    const target = new Date(now);
    target.setDate(now.getDate() + diff);
    return target.toISOString().split('T')[0];
  }

  private formatTime(utcMs: number, timezone: string): string {
    try {
      return new Date(utcMs).toLocaleTimeString('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      });
    } catch {
      return new Date(utcMs).toUTCString();
    }
  }
}
