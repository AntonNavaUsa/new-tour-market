import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
  IsEmail,
  IsEnum,
  ValidateNested,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { OrderStatus } from '@prisma/client';

export class OrderTicketDto {
  @ApiProperty()
  @IsUUID()
  ticketId: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsUUID()
  cardId: string;

  @ApiProperty({ example: '2024-06-15' })
  @IsDateString()
  date: Date;

  @ApiProperty({ example: '09:00', required: false })
  @IsOptional()
  @IsString()
  time?: string;

  @ApiProperty({ type: [OrderTicketDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderTicketDto)
  tickets: OrderTicketDto[];

  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty({ example: 'john@example.com', required: false })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiProperty({ example: '+7 999 123 45 67', required: false })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class OrderFilterDto {
  @ApiProperty({ enum: OrderStatus, required: false })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  cardId?: string;

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
}

export class CreateMessageDto {
  @ApiProperty({ description: 'Message text', maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  text: string;
}
