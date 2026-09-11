import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class TourSearchDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  departureId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  countryId!: number;

  @IsDateString()
  dateFrom!: string;

  @IsDateString()
  dateTo!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(28)
  nightsFrom!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(28)
  nightsTo!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(6)
  adults!: number;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(17, { each: true })
  childs: number[] = [];

  @IsString()
  currency!: string;

  @Type(() => Boolean)
  @IsBoolean()
  onlyCharter = false;

  @Type(() => Boolean)
  @IsBoolean()
  onlyDirect = false;
}

export class TourSearchQueryDto extends TourSearchDto {}

export class SearchResultsQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit = 25;
}

export class SearchStatusQueryDto {
  @Type(() => Boolean)
  @IsBoolean()
  operatorStatus = false;
}

export class ReferenceQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  departureCountryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  departureId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  countryId?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  onlyCharter = false;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  onlyDirect = false;
}

export class TourDetailsQueryDto {
  @IsString()
  currency!: string;
}
