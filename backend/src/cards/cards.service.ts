import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { CreateCardDto, UpdateCardDto, CardFilterDto } from './dto';
import { UserRole, CardStatus } from '@prisma/client';

@Injectable()
export class CardsService {
  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
  ) {}

  async create(userId: string, userRole: UserRole, dto: CreateCardDto) {
    const targetUserId = userRole === UserRole.ADMIN && dto.userId ? dto.userId : userId;

    // Verify location exists
    const location = await this.prisma.location.findUnique({
      where: { id: dto.locationId },
    });

    if (!location) {
      throw new BadRequestException('Location not found');
    }

    // Verify card type exists
    const cardType = await this.prisma.cardType.findUnique({
      where: { id: dto.cardTypeId },
    });

    if (!cardType) {
      throw new BadRequestException('Card type not found');
    }

    // Get user's partner ID if they are a partner
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, partnerId: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const card = await this.prisma.card.create({
      data: {
        userId: targetUserId,
        locationId: dto.locationId,
        cardTypeId: dto.cardTypeId,
        partnerId: user?.partnerId || null,
        title: dto.title,
        description: dto.description,
        shortDescription: dto.shortDescription,
        tags: dto.tags || [],
        status: CardStatus.DRAFT,
        duration: dto.duration,
        minParticipants: dto.minParticipants,
        maxParticipants: dto.maxParticipants,
        position: dto.position || 0,
        includedItems: dto.includedItems || [],
        notIncludedItems: dto.notIncludedItems || [],
      },
      include: {
        location: true,
        cardType: true,
        partner: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return card;
  }

  async findAll(filters: CardFilterDto) {
    const { locationId, cardTypeId, status, search, skip = 0, take = 20 } = filters;

    const where: any = {};

    // Only show published cards to public
    if (!filters.includeNonPublished) {
      where.status = CardStatus.PUBLISHED;
    } else if (status) {
      where.status = status;
    }

    if (locationId) {
      where.locationId = locationId;
    }

    if (cardTypeId) {
      where.cardTypeId = cardTypeId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    const [cards, total] = await Promise.all([
      this.prisma.card.findMany({
        where,
        skip,
        take,
        orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
        include: {
          location: true,
          cardType: true,
          partner: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          tickets: {
            include: {
              prices: {
                where: { isArchived: false },
                orderBy: { adultPrice: 'asc' },
              },
            },
          },
        },
      }),
      this.prisma.card.count({ where }),
    ]);

    return {
      data: cards,
      meta: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    };
  }

  async findOne(id: string, includeAll = false) {
    const card = await this.prisma.card.findUnique({
      where: { id },
      include: {
        location: true,
        cardType: true,
        partner: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tickets: {
          include: {
            prices: {
              where: includeAll
                ? { isArchived: false }
                : {
                    isArchived: false,
                    dateTo: {
                      gte: new Date(),
                    },
                  },
              orderBy: { dateFrom: 'asc' },
            },
          },
          orderBy: { position: 'asc' },
        },
        schedules: true,
        slideshowPhotos: {
          orderBy: { sortOrder: 'asc' },
        },
        expressions: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    return card;
  }

  async update(id: string, userId: string, userRole: UserRole, dto: UpdateCardDto) {
    const card = await this.prisma.card.findUnique({
      where: { id },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    // Check permissions
    if (userRole !== UserRole.ADMIN && card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this card');
    }

    const updatedCard = await this.prisma.card.update({
      where: { id },
      data: {
        ...dto,
      },
      include: {
        location: true,
        cardType: true,
        partner: true,
        tickets: true,
        schedules: true,
        slideshowPhotos: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return updatedCard;
  }

  async delete(id: string, userId: string, userRole: UserRole) {
    const card = await this.prisma.card.findUnique({
      where: { id },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    // Check permissions
    if (userRole !== UserRole.ADMIN && card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this card');
    }

    await this.prisma.card.delete({
      where: { id },
    });

    return { message: 'Card deleted successfully' };
  }

  async getUserCards(userId: string, filters: CardFilterDto) {
    const { skip = 0, take = 20 } = filters;

    const where: any = { userId };

    if (filters.status) {
      where.status = filters.status;
    }

    const [cards, total] = await Promise.all([
      this.prisma.card.findMany({
        where,
        skip,
        take,
        orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
        include: {
          location: true,
          cardType: true,
          tickets: {
            include: {
              prices: {
                take: 1,
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
      }),
      this.prisma.card.count({ where }),
    ]);

    return {
      data: cards,
      meta: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    };
  }

  async updateHeadPhoto(id: string, userId: string, userRole: UserRole, photoUrl: string) {
    const card = await this.prisma.card.findUnique({
      where: { id },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (userRole !== UserRole.ADMIN && card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this card');
    }

    return this.prisma.card.update({
      where: { id },
      data: { headPhotoUrl: photoUrl },
    });
  }

  async addSlideshowPhoto(
    cardId: string,
    userId: string,
    userRole: UserRole,
    photoUrl: string,
    caption?: string,
  ) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (userRole !== UserRole.ADMIN && card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this card');
    }

    // Get max sort order
    const maxOrder = await this.prisma.slideshowPhoto.findFirst({
      where: { cardId },
      orderBy: { sortOrder: 'desc' },
    });

    return this.prisma.slideshowPhoto.create({
      data: {
        cardId,
        url: photoUrl,
        caption,
        sortOrder: (maxOrder?.sortOrder || 0) + 1,
      },
    });
  }

  async reorderSlideshowPhotos(
    cardId: string,
    userId: string,
    userRole: UserRole,
    photoOrders: Array<{ id: string; sortOrder: number }>,
  ) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (userRole !== UserRole.ADMIN && card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this card');
    }

    // Update all photos in transaction
    await this.prisma.$transaction(
      photoOrders.map((photo) =>
        this.prisma.slideshowPhoto.update({
          where: { id: photo.id },
          data: { sortOrder: photo.sortOrder },
        }),
      ),
    );

    return { message: 'Photos reordered successfully' };
  }

  async deleteSlideshowPhoto(photoId: string, userId: string, userRole: UserRole) {
    const photo = await this.prisma.slideshowPhoto.findUnique({
      where: { id: photoId },
      include: { card: true },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    if (userRole !== UserRole.ADMIN && photo.card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this photo');
    }

    await this.prisma.slideshowPhoto.delete({
      where: { id: photoId },
    });

    return { message: 'Photo deleted successfully' };
  }

  async uploadMainPhoto(
    cardId: string,
    userId: string,
    userRole: UserRole,
    file: Express.Multer.File,
  ) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (userRole !== UserRole.ADMIN && card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this card');
    }

    // Delete old photo if exists
    if (card.headPhotoUrl) {
      try {
        await this.filesService.deleteImage(card.headPhotoUrl);
      } catch (error) {
        // Continue if deletion fails
      }
    }

    // Upload new photo
    const photoUrl = await this.filesService.uploadImage(file, 'cards', {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 85,
      format: 'webp',
    });

    // Update card
    const updatedCard = await this.prisma.card.update({
      where: { id: cardId },
      data: { headPhotoUrl: photoUrl },
      include: {
        location: true,
        cardType: true,
        partner: true,
      },
    });

    return {
      message: 'Main photo uploaded successfully',
      card: updatedCard,
    };
  }

  async uploadSlideshowPhotos(
    cardId: string,
    userId: string,
    userRole: UserRole,
    files: Express.Multer.File[],
  ) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (userRole !== UserRole.ADMIN && card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this card');
    }

    // Get max sort order
    const maxOrder = await this.prisma.slideshowPhoto.findFirst({
      where: { cardId },
      orderBy: { sortOrder: 'desc' },
    });

    let currentOrder = (maxOrder?.sortOrder || 0) + 1;

    // Upload all files
    const photoUrls = await this.filesService.uploadMultipleImages(files, 'photos', {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 85,
      format: 'webp',
    });

    // Create slideshow photo records
    const photos = await this.prisma.$transaction(
      photoUrls.map((url) =>
        this.prisma.slideshowPhoto.create({
          data: {
            cardId,
            url,
            sortOrder: currentOrder++,
          },
        }),
      ),
    );

    return {
      message: `${photos.length} photos uploaded successfully`,
      photos,
    };
  }

  async uploadExpressionPhotos(
    cardId: string,
    userId: string,
    userRole: UserRole,
    files: Express.Multer.File[],
  ) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (userRole !== UserRole.ADMIN && card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this card');
    }

    // Get max sort order
    const maxOrder = await this.prisma.expression.findFirst({
      where: { cardId },
      orderBy: { sortOrder: 'desc' },
    });

    let currentOrder = (maxOrder?.sortOrder || 0) + 1;

    // Upload all files
    const photoUrls = await this.filesService.uploadMultipleImages(files, 'expressions', {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 85,
      format: 'webp',
    });

    // Create expression photo records
    const expressions = await this.prisma.$transaction(
      photoUrls.map((url) =>
        this.prisma.expression.create({
          data: {
            cardId,
            photoUrl: url,
            sortOrder: currentOrder++,
          },
        }),
      ),
    );

    return {
      message: `${expressions.length} expression photos uploaded successfully`,
      expressions,
    };
  }
}
