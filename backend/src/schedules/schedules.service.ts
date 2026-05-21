import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateWeeklyScheduleDto, AddSpecialDateDto, GetAvailableTimesDto } from './dto';
import { UserRole } from '@prisma/client';

interface SpecialDate {
  dateFrom: string | Date;
  dateTo: string | Date;
  times?: string[];
  isClosed?: boolean;
  reason?: string;
}

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  async updateWeeklySchedule(
    cardId: string,
    userId: string,
    userRole: UserRole,
    dto: UpdateWeeklyScheduleDto,
  ) {
    // Verify card exists and user has permission
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (userRole !== UserRole.ADMIN && card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this card');
    }

    // Check if schedule exists
    const existingSchedule = await this.prisma.schedule.findUnique({
      where: { cardId },
    });

    if (existingSchedule) {
      // Update existing schedule
      const updated = await this.prisma.schedule.update({
        where: { cardId },
        data: {
          weeklySchedule: dto.weeklySchedule,
        },
      });
      return updated;
    } else {
      // Create new schedule
      const created = await this.prisma.schedule.create({
        data: {
          cardId,
          weeklySchedule: dto.weeklySchedule,
          specialDates: [],
        },
      });
      return created;
    }
  }

  async addSpecialDate(
    cardId: string,
    userId: string,
    userRole: UserRole,
    dto: AddSpecialDateDto,
  ) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (userRole !== UserRole.ADMIN && card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this card');
    }

    // Validate dates
    if (dto.dateFrom > dto.dateTo) {
      throw new BadRequestException('dateFrom must be before or equal to dateTo');
    }

    // Get or create schedule
    let schedule = await this.prisma.schedule.findUnique({
      where: { cardId },
    });

    if (!schedule) {
      schedule = await this.prisma.schedule.create({
        data: {
          cardId,
          weeklySchedule: this.getDefaultWeeklySchedule(),
          specialDates: [],
        },
      });
    }

    // Add special date to the array
    const specialDates = Array.isArray(schedule.specialDates) ? (schedule.specialDates as unknown as SpecialDate[]) : [];
    specialDates.push({
      dateFrom: dto.dateFrom.toISOString(),
      dateTo: dto.dateTo.toISOString(),
      times: dto.times || [],
      isClosed: dto.isClosed ?? false,
      reason: dto.reason,
    });

    const updated = await this.prisma.schedule.update({
      where: { cardId },
      data: {
        specialDates: specialDates as any,
      },
    });

    return updated;
  }

  async removeSpecialDate(
    cardId: string,
    userId: string,
    userRole: UserRole,
    specialDateIndex: number,
  ) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (userRole !== UserRole.ADMIN && card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this card');
    }

    const schedule = await this.prisma.schedule.findUnique({
      where: { cardId },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    const specialDates = Array.isArray(schedule.specialDates) ? schedule.specialDates : [];

    if (specialDateIndex < 0 || specialDateIndex >= specialDates.length) {
      throw new BadRequestException('Invalid special date index');
    }

    specialDates.splice(specialDateIndex, 1);

    const updated = await this.prisma.schedule.update({
      where: { cardId },
      data: {
        specialDates,
      },
    });

    return updated;
  }

  async getSchedule(cardId: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { cardId },
      include: {
        card: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    if (!schedule) {
      // Return default schedule if none exists
      return {
        cardId,
        weeklySchedule: this.getDefaultWeeklySchedule(),
        specialDates: [],
      };
    }

    return schedule;
  }

  async getAvailableTimes(cardId: string, dto: GetAvailableTimesDto) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { cardId },
    });

    if (!schedule) {
      return {
        date: dto.date,
        available: false,
        reason: 'No schedule configured',
        times: [],
      };
    }

    const date = new Date(dto.date);

    // Check special dates first
    const specialDates = Array.isArray(schedule.specialDates) ? (schedule.specialDates as unknown as SpecialDate[]) : [];
    for (const specialDate of specialDates) {
      const specialFrom = new Date(specialDate.dateFrom);
      const specialTo = new Date(specialDate.dateTo);

      if (date >= specialFrom && date <= specialTo) {
        if (specialDate.isClosed) {
          return {
            date: dto.date,
            available: false,
            reason: specialDate.reason || 'Closed on this date',
            times: [],
          };
        }

        return {
          date: dto.date,
          available: true,
          times: specialDate.times || [],
          isSpecialDate: true,
        };
      }
    }

    // Use weekly schedule
    const dayName = this.getDayName(date);
    const weeklySchedule = schedule.weeklySchedule as any;
    const daySchedule = weeklySchedule[dayName];

    if (!daySchedule || !daySchedule.active) {
      return {
        date: dto.date,
        available: false,
        reason: 'Not available on this day of week',
        times: [],
      };
    }

    return {
      date: dto.date,
      available: true,
      times: daySchedule.times || [],
    };
  }

  async isTimeAvailable(cardId: string, date: Date, time: string): Promise<boolean> {
    const availableTimes = await this.getAvailableTimes(cardId, { date });

    if (!availableTimes.available) {
      return false;
    }

    return availableTimes.times.includes(time);
  }

  private getDayName(date: Date): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  }

  private getDefaultWeeklySchedule() {
    return {
      monday: { active: true, times: ['09:00', '14:00'] },
      tuesday: { active: true, times: ['09:00', '14:00'] },
      wednesday: { active: true, times: ['09:00', '14:00'] },
      thursday: { active: true, times: ['09:00', '14:00'] },
      friday: { active: true, times: ['09:00', '14:00'] },
      saturday: { active: true, times: ['10:00', '15:00'] },
      sunday: { active: false, times: [] },
    };
  }

  async getMonthAvailability(cardId: string, year: number, month: number) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { cardId },
    });

    if (!schedule) {
      return {
        year,
        month,
        days: [],
      };
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const days = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const availableTimes = await this.getAvailableTimes(cardId, { date });

      days.push({
        date: date.toISOString().split('T')[0],
        available: availableTimes.available,
        timesCount: availableTimes.times?.length || 0,
      });
    }

    return {
      year,
      month,
      days,
    };
  }

  async getAvailableDates(cardId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Load card with guides, accommodations and duration
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        cardGuides: { select: { guideId: true } },
        cardAccommodations: { select: { accommodationId: true } },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    // N = number of tour days (1 = single-day tour, no duration adjustment needed)
    const N = (card as any).durationDays ?? 1;

    const guideIds = card.cardGuides.map((cg) => cg.guideId);
    const accommodationIds = card.cardAccommodations.map((ca) => ca.accommodationId);

    // Extend block query window: a tour starting on the last day of month may span N-1 more days.
    // Since check-out day coinciding with block start is allowed, we extend by N-2.
    const blockWindowEnd = new Date(endDate);
    blockWindowEnd.setDate(blockWindowEnd.getDate() + Math.max(N - 2, 0));

    // Load all blocks that could affect dates in this month
    const [guideBlocks, accommodationBlocks] = await Promise.all([
      guideIds.length
        ? this.prisma.guideBlock.findMany({
            where: {
              guideId: { in: guideIds },
              dateFrom: { lte: blockWindowEnd },
              dateTo: { gte: startDate },
            },
          })
        : [],
      accommodationIds.length
        ? this.prisma.accommodationBlock.findMany({
            where: {
              accommodationId: { in: accommodationIds },
              dateFrom: { lte: blockWindowEnd },
              dateTo: { gte: startDate },
            },
          })
        : [],
    ]);

    /**
     * Returns true if starting a tour of N days on `startDay` conflicts with `block`.
     * Conflict condition: startDay < blockTo  AND  startDay + N - 1 > blockFrom
     * (strict comparisons — checkout==checkin coincidence is allowed on both ends)
     */
    const conflictsWithBlock = (
      startDay: Date,
      block: { dateFrom: Date; dateTo: Date },
    ): boolean => {
      const tourLastDay = new Date(startDay);
      tourLastDay.setDate(tourLastDay.getDate() + N - 1);
      const blockFrom = new Date(block.dateFrom);
      const blockTo = new Date(block.dateTo);
      return startDay < blockTo && tourLastDay > blockFrom;
    };

    const daysInMonth = endDate.getDate();
    const days = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = date.toISOString().split('T')[0];

      // 1. Check schedule
      const scheduleResult = await this.getAvailableTimes(cardId, { date });
      if (!scheduleResult.available) {
        days.push({ date: dateStr, available: false, reason: scheduleResult.reason, times: [] });
        continue;
      }

      // 2. Check guide blocks (taking tour duration into account)
      const guideBlocked = (guideBlocks as any[]).find((b) => conflictsWithBlock(date, b));
      if (guideBlocked) {
        days.push({
          date: dateStr,
          available: false,
          reason: `Гид недоступен: ${guideBlocked.reason || 'заблокировано'}`,
          times: [],
        });
        continue;
      }

      // 3. Check accommodation blocks (taking tour duration into account)
      const accommodationBlocked = (accommodationBlocks as any[]).find((b) =>
        conflictsWithBlock(date, b),
      );
      if (accommodationBlocked) {
        days.push({
          date: dateStr,
          available: false,
          reason: `Объект размещения недоступен: ${accommodationBlocked.reason || 'заблокировано'}`,
          times: [],
        });
        continue;
      }

      days.push({ date: dateStr, available: true, times: scheduleResult.times || [] });
    }

    return { year, month, days };
  }
}
