import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsArray,
  IsBoolean,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { AccommodationType } from '@prisma/client';

export class CreateAccommodationDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ enum: AccommodationType, required: false })
  @IsOptional()
  @IsEnum(AccommodationType)
  type?: AccommodationType;

  @ApiProperty({ required: false, nullable: true, minimum: 0, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(5)
  stars?: number | null;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  skiInSkiOut?: boolean;

  @ApiProperty({ required: false, default: true, description: 'Показывать объект в OTA-каталоге' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isAvailableInOta?: boolean;

  @ApiProperty({ required: false, default: false, description: 'Архивировать объект' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isArchived?: boolean;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  locationIds?: string[];
}

export class UpdateAccommodationDto extends PartialType(CreateAccommodationDto) {}

export class AccommodationFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, enum: AccommodationType })
  @IsOptional()
  @IsEnum(AccommodationType)
  type?: AccommodationType;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(5)
  stars?: number;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @Transform(({ value }) => Array.isArray(value) ? value : String(value).split(','))
  @IsArray()
  @IsUUID('4', { each: true })
  locationIds?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  skiInSkiOut?: boolean;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiProperty({ required: false, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number;
}

export class ReorderPhotosDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        sortOrder: { type: 'number' },
      },
    },
  })
  @IsArray()
  photos: Array<{ id: string; sortOrder: number }>;
}

export class CreateAccommodationBlockDto {
  @ApiProperty({ example: '2026-06-01' })
  @IsString()
  dateFrom: string;

  @ApiProperty({ example: '2026-06-05' })
  @IsString()
  dateTo: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
