import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class GuidesService {
  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
  ) {}

  async getMyGuides(userId: string) {
    return this.prisma.guide.findMany({
      where: { userId },
      orderBy: { position: 'asc' },
    });
  }

  async create(userId: string, data: { name: string; description?: string; position?: number }) {
    if (!data.name?.trim()) {
      throw new BadRequestException('Имя обязательно');
    }
    return this.prisma.guide.create({
      data: {
        userId,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        position: data.position ?? 0,
      },
    });
  }

  async update(
    id: string,
    userId: string,
    userRole: UserRole,
    data: { name?: string; description?: string; position?: number },
  ) {
    const guide = await this.prisma.guide.findUnique({ where: { id } });
    if (!guide) throw new NotFoundException('Гид не найден');
    if (guide.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Нет доступа');
    }
    return this.prisma.guide.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
        ...(data.position !== undefined && { position: data.position }),
      },
    });
  }

  async uploadPhoto(id: string, userId: string, userRole: UserRole, file: Express.Multer.File) {
    const guide = await this.prisma.guide.findUnique({ where: { id } });
    if (!guide) throw new NotFoundException('Гид не найден');
    if (guide.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Нет доступа');
    }

    const photoUrl = await this.filesService.uploadImage(file, 'photos', {
      maxWidth: 400,
      maxHeight: 400,
      quality: 85,
      format: 'webp',
    });

    return this.prisma.guide.update({
      where: { id },
      data: { photoUrl },
    });
  }

  async delete(id: string, userId: string, userRole: UserRole) {
    const guide = await this.prisma.guide.findUnique({ where: { id } });
    if (!guide) throw new NotFoundException('Гид не найден');
    if (guide.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Нет доступа');
    }
    await this.prisma.guide.delete({ where: { id } });
  }
}
