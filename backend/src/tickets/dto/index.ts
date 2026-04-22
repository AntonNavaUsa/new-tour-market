import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNumber,
  IsDateString,
  Min,
  IsObject,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PricingType } from '@prisma/client';

export class GroupTierDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  minPeople: number;

  @ApiProperty({ example: 2, nullable: true, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxPeople?: number | null;

  @ApiProperty({ example: 14000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ enum: ['fixed', 'per_person'], example: 'fixed' })
  @IsEnum(['fixed', 'per_person'])
  priceType: 'fixed' | 'per_person';
}

export class CreateTicketDto {
  @ApiProperty({ example: 'Взрослый билет' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Для лиц старше 12 лет', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isMain?: boolean;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ApiProperty({
    example: { ageFrom: 12, ageTo: 99 },
    required: false,
  })
  @IsOptional()
  @IsObject()
  typeConfig?: any;

  @ApiProperty({ enum: PricingType, example: PricingType.PER_PERSON, required: false })
  @IsOptional()
  @IsEnum(PricingType)
  pricingType?: PricingType;

  @ApiProperty({ example: 'uuid-tariff-type-id', required: false })
  @IsOptional()
  @IsString()
  tariffTypeId?: string;
}

export class UpdateTicketDto extends PartialType(CreateTicketDto) {}

export class CreatePriceDto {
  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  dateFrom: Date;

  @ApiProperty({ example: '2024-12-31' })
  @IsDateString()
  dateTo: Date;

  @ApiProperty({ example: 2500.0 })
  @IsNumber()
  @Min(0)
  adultPrice: number;

  @ApiProperty({ example: 1500.0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  childPrice?: number;

  @ApiProperty({ example: 1000.0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiProperty({ example: 50, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  availableSlots?: number;

  @ApiProperty({
    type: [GroupTierDto],
    required: false,
    example: [
      { minPeople: 1, maxPeople: 2, price: 14000, priceType: 'fixed' },
      { minPeople: 3, maxPeople: 5, price: 5500, priceType: 'per_person' },
      { minPeople: 6, maxPeople: null, price: 5000, priceType: 'per_person' },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupTierDto)
  groupTiers?: GroupTierDto[];
}

export class PriceFilterDto {
  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeExpired?: boolean;
}

export class CheckAvailabilityDto {
  @ApiProperty({ example: '2024-06-15' })
  @IsDateString()
  date: Date;
}
