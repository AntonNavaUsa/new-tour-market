import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingStepsTemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.bookingStepsTemplate.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const t = await this.prisma.bookingStepsTemplate.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Шаблон шагов не найден');
    return t;
  }

  async create(data: { name: string; steps: Array<{ title: string; description: string }> }) {
    return this.prisma.bookingStepsTemplate.create({ data: { name: data.name, steps: data.steps } });
  }

  async update(id: string, data: { name?: string; steps?: Array<{ title: string; description: string }> }) {
    await this.findOne(id);
    return this.prisma.bookingStepsTemplate.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.bookingStepsTemplate.delete({ where: { id } });
    return { message: 'Deleted' };
  }
}
