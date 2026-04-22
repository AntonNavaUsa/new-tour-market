import { IsObject, IsDate, IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateWeeklyScheduleDto {
  @ApiProperty({
    example: {
      monday: { active: true, times: ['09:00', '14:00'] },
      tuesday: { active: true, times: ['09:00', '14:00'] },
      wednesday: { active: true, times: ['09:00', '14:00'] },
      thursday: { active: true, times: ['09:00', '14:00'] },
      friday: { active: true, times: ['09:00', '14:00'] },
      saturday: { active: true, times: ['10:00'] },
      sunday: { active: false, times: [] },
    },
  })
  @IsObject()
  weeklySchedule: {
    monday: { active: boolean; times: string[] };
    tuesday: { active: boolean; times: string[] };
    wednesday: { active: boolean; times: string[] };
    thursday: { active: boolean; times: string[] };
    friday: { active: boolean; times: string[] };
    saturday: { active: boolean; times: string[] };
    sunday: { active: boolean; times: string[] };
  };
}

export class AddSpecialDateDto {
  @ApiProperty({ example: '2024-12-31' })
  @Type(() => Date)
  @IsDate()
  dateFrom: Date;

  @ApiProperty({ example: '2024-12-31' })
  @Type(() => Date)
  @IsDate()
  dateTo: Date;

  @ApiProperty({ example: ['10:00', '15:00'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  times?: string[];

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;

  @ApiProperty({ example: 'Новогодние праздники', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class GetAvailableTimesDto {
  @ApiProperty({ example: '2024-06-15' })
  @Type(() => Date)
  @IsDate()
  date: Date;
}
