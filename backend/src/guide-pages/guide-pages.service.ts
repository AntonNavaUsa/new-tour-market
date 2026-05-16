import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GuidePagesService {
  constructor(private prisma: PrismaService) {}

  // ── Public ────────────────────────────────────────────────────────────────

  async findPublished() {
    return this.prisma.guidePage.findMany({
      where: { isPublished: true },
      select: { id: true, title: true, slug: true, excerpt: true, headPhotoUrl: true, sortOrder: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    const page = await this.prisma.guidePage.findUnique({
      where: { slug },
    });
    if (!page || !page.isPublished) throw new NotFoundException('Страница не найдена');
    return page;
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  async findAll() {
    return this.prisma.guidePage.findMany({
      select: { id: true, title: true, slug: true, isPublished: true, sortOrder: true, createdAt: true, updatedAt: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const page = await this.prisma.guidePage.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('Страница не найдена');
    return page;
  }

  async create(data: {
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    headPhotoUrl?: string;
    isPublished?: boolean;
    sortOrder?: number;
  }) {
    if (!data.title?.trim()) throw new BadRequestException('Заголовок обязателен');
    if (!data.slug?.trim()) throw new BadRequestException('Slug обязателен');

    const slug = data.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const existing = await this.prisma.guidePage.findUnique({ where: { slug } });
    if (existing) throw new BadRequestException('Страница с таким slug уже существует');

    return this.prisma.guidePage.create({
      data: {
        title: data.title.trim(),
        slug,
        content: data.content ?? '',
        excerpt: data.excerpt?.trim() || null,
        headPhotoUrl: data.headPhotoUrl || null,
        isPublished: data.isPublished ?? false,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      slug?: string;
      content?: string;
      excerpt?: string;
      headPhotoUrl?: string;
      isPublished?: boolean;
      sortOrder?: number;
    },
  ) {
    await this.findOne(id);

    if (data.slug !== undefined) {
      const slug = data.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const existing = await this.prisma.guidePage.findUnique({ where: { slug } });
      if (existing && existing.id !== id) throw new BadRequestException('Slug уже занят');
      data.slug = slug;
    }

    return this.prisma.guidePage.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.excerpt !== undefined && { excerpt: data.excerpt?.trim() || null }),
        ...(data.headPhotoUrl !== undefined && { headPhotoUrl: data.headPhotoUrl || null }),
        ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.guidePage.delete({ where: { id } });
    return { success: true };
  }
}
