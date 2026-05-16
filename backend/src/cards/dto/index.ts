import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  IsUUID,
  Min,
  IsEnum,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CardStatus } from '@prisma/client';

export class CreateCardDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty()
  @IsUUID()
  locationId: string;

  @ApiProperty()
  @IsUUID()
  cardTypeId: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationFrom?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationTo?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  distanceKm?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  elevationGain?: number;

  @ApiProperty({ required: false, enum: ['EASY', 'MEDIUM', 'ABOVE_MEDIUM'] })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  placeHistory?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  childFriendly?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  meetingPoint?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  minParticipants?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxParticipants?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includedItems?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notIncludedItems?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  forWhom?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  noCover?: boolean;

  @ApiProperty({ required: false, type: 'array', description: 'Tour program by days [{title, description}]' })
  @IsOptional()
  @IsArray()
  tourProgram?: Array<{ title: string; description: string }>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  accommodationDescription?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  postPaymentInfo?: string;
}

export class UpdateCardDto extends PartialType(CreateCardDto) {
  @ApiProperty({ enum: CardStatus, required: false })
  @IsOptional()
  @IsEnum(CardStatus)
  status?: CardStatus;
}

export class CardFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  cardTypeId?: string;

  @ApiProperty({ enum: CardStatus, required: false })
  @IsOptional()
  @IsEnum(CardStatus)
  status?: CardStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeNonPublished?: boolean;
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
