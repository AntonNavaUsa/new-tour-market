import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricingType } from '@prisma/client';

export interface CreateExtraDto {
  cardId: string;
  title: string;
  description?: string;
  price: number;
  pricingType?: PricingType;
  isOptional?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateExtraDto {
  title?: string;
  description?: string;
  price?: number;
  pricingType?: PricingType;
  isOptional?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

@Injectable()
export class ExtrasService {
  constructor(private prisma: PrismaService) {}

  async getForCard(cardId: string, onlyActive = true) {
    return this.prisma.cardExtra.findMany({
      where: { cardId, ...(onlyActive ? { isActive: true } : {}) },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(id: string) {
    const extra = await this.prisma.cardExtra.findUnique({ where: { id } });
    if (!extra) throw new NotFoundException('Доп. опция не найдена');
    return extra;
  }

  async create(dto: CreateExtraDto) {
    return this.prisma.cardExtra.create({
      data: {
        cardId: dto.cardId,
        title: dto.title,
        description: dto.description,
        price: dto.price,
        pricingType: dto.pricingType ?? PricingType.PER_PERSON,
        isOptional: dto.isOptional ?? true,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateExtraDto) {
    await this.findOne(id);
    return this.prisma.cardExtra.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.price !== undefined ? { price: dto.price } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.cardExtra.delete({ where: { id } });
    return { message: 'Deleted' };
  }

  async reorder(cardId: string, ids: string[]) {
    await Promise.all(
      ids.map((id, idx) =>
        this.prisma.cardExtra.updateMany({
          where: { id, cardId },
          data: { sortOrder: idx },
        }),
      ),
    );
    return this.getForCard(cardId, false);
  }
}
