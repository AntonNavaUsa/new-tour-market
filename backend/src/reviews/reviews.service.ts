import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
  ) {}

  // Public: get visible reviews for a card (or all-cards reviews)
  async getForCard(cardId: string) {
    return this.prisma.review.findMany({
      where: {
        isVisible: true,
        OR: [{ cardId }, { cardId: null }],
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  // Admin: get all reviews
  async findAll(cardId?: string) {
    return this.prisma.review.findMany({
      where: cardId ? { cardId } : undefined,
      include: { card: { select: { id: true, title: true } } },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: { card: { select: { id: true, title: true } } },
    });
    if (!review) throw new NotFoundException('Отзыв не найден');
    return review;
  }

  async create(data: {
    cardId?: string | null;
    authorName: string;
    authorPhoto?: string;
    title?: string;
    text: string;
    rating?: number;
    isVisible?: boolean;
    sortOrder?: number;
  }) {
    return this.prisma.review.create({ data: {
      cardId: data.cardId ?? null,
      authorName: data.authorName,
      authorPhoto: data.authorPhoto,
      title: data.title,
      text: data.text,
      rating: data.rating ?? 5,
      isVisible: data.isVisible ?? true,
      sortOrder: data.sortOrder ?? 0,
    }});
  }

  async update(
    id: string,
    data: {
      cardId?: string | null;
      authorName?: string;
      authorPhoto?: string | null;
      title?: string | null;
      text?: string;
      rating?: number;
      isVisible?: boolean;
      sortOrder?: number;
    },
  ) {
    await this.findOne(id);
    return this.prisma.review.update({ where: { id }, data });
  }

  async uploadPhoto(id: string, file: Express.Multer.File) {
    const review = await this.findOne(id);
    if (review.authorPhoto) {
      try { await this.filesService.deleteImage(review.authorPhoto); } catch {}
    }
    const url = await this.filesService.uploadImage(file, 'photos', {
      maxWidth: 200,
      maxHeight: 200,
      quality: 85,
      format: 'webp',
    });
    return this.prisma.review.update({ where: { id }, data: { authorPhoto: url } });
  }

  async remove(id: string) {
    const review = await this.findOne(id);
    if (review.authorPhoto) {
      try { await this.filesService.deleteImage(review.authorPhoto); } catch {}
    }
    await this.prisma.review.delete({ where: { id } });
    return { message: 'Deleted' };
  }
}
