import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  IsUUID,
  Min,
  IsEnum,
  IsBoolean,
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
  duration?: number;

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
