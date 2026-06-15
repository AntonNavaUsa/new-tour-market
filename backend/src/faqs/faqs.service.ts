import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FaqsService {
  constructor(private prisma: PrismaService) {}

  async getForCard(cardId: string) {
    return this.prisma.faq.findMany({
      where: { cardId, isVisible: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findAll(cardId?: string) {
    return this.prisma.faq.findMany({
      where: cardId ? { cardId } : undefined,
      include: { card: { select: { id: true, title: true } } },
      orderBy: [{ cardId: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async findOne(id: string) {
    const faq = await this.prisma.faq.findUnique({ where: { id } });
    if (!faq) throw new NotFoundException('FAQ не найден');
    return faq;
  }

  async create(data: {
    cardId: string;
    question: string;
    answer: string;
    sortOrder?: number;
    isVisible?: boolean;
  }) {
    return this.prisma.faq.create({
      data: {
        cardId: data.cardId,
        question: data.question,
        answer: data.answer,
        sortOrder: data.sortOrder ?? 0,
        isVisible: data.isVisible ?? true,
      },
    });
  }

  async update(
    id: string,
    data: {
      question?: string;
      answer?: string;
      sortOrder?: number;
      isVisible?: boolean;
    },
  ) {
    await this.findOne(id);
    return this.prisma.faq.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.faq.delete({ where: { id } });
    return { message: 'Deleted' };
  }

  async reorder(cardId: string, ids: string[]) {
    await Promise.all(
      ids.map((id, idx) =>
        this.prisma.faq.updateMany({
          where: { id, cardId },
          data: { sortOrder: idx },
        }),
      ),
    );
    return this.getForCard(cardId);
  }

  // ── Templates ────────────────────────────────────────────────────────
  async findAllTemplates() {
    return this.prisma.faqTemplate.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findOneTemplate(id: string) {
    const t = await this.prisma.faqTemplate.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Шаблон FAQ не найден');
    return t;
  }

  async createTemplate(data: { question: string; answer: string; sortOrder?: number }) {
    return this.prisma.faqTemplate.create({
      data: {
        question: data.question,
        answer: data.answer,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async updateTemplate(id: string, data: { question?: string; answer?: string; sortOrder?: number }) {
    await this.findOneTemplate(id);
    return this.prisma.faqTemplate.update({ where: { id }, data });
  }

  async removeTemplate(id: string) {
    await this.findOneTemplate(id);
    await this.prisma.faqTemplate.delete({ where: { id } });
    return { message: 'Deleted' };
  }
}
