import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import * as sharp from 'sharp';
import { randomUUID } from 'crypto';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly minioClient: Minio.Client;
  private readonly buckets = {
    cards: 'cards',
    photos: 'photos',
    expressions: 'expressions',
  };

  constructor(private configService: ConfigService) {
    const endPoint = this.configService.get('MINIO_ENDPOINT') || 'localhost';
    const port = parseInt(this.configService.get('MINIO_PORT') || '9000');
    const accessKey = this.configService.get('MINIO_ACCESS_KEY') || 'minio_admin';
    const secretKey = this.configService.get('MINIO_SECRET_KEY') || 'minio_secret';
    const useSSL = this.configService.get('MINIO_USE_SSL') === 'true';

    this.minioClient = new Minio.Client({
      endPoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });

    this.initializeBuckets();
  }

  private async initializeBuckets() {
    for (const bucket of Object.values(this.buckets)) {
      try {
        const exists = await this.minioClient.bucketExists(bucket);
        if (!exists) {
          await this.minioClient.makeBucket(bucket, 'us-east-1');
          // Установить публичную политику для чтения
          const policy = {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { AWS: ['*'] },
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${bucket}/*`],
              },
            ],
          };
          await this.minioClient.setBucketPolicy(bucket, JSON.stringify(policy));
          this.logger.log(`Bucket ${bucket} created and made public`);
        }
      } catch (error) {
        this.logger.error(`Error initializing bucket ${bucket}:`, error);
      }
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    bucketName: keyof typeof this.buckets = 'photos',
    options?: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      format?: 'webp' | 'jpeg' | 'png';
    },
  ): Promise<string> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 80,
      format = 'webp',
    } = options || {};

    // Валидация типа файла
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    try {
      // Обработка изображения
      let imageBuffer: Buffer;
      
      if (format === 'webp') {
        imageBuffer = await sharp(file.buffer)
          .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality })
          .toBuffer();
      } else if (format === 'jpeg') {
        imageBuffer = await sharp(file.buffer)
          .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality })
          .toBuffer();
      } else {
        imageBuffer = await sharp(file.buffer)
          .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
          .png({ quality })
          .toBuffer();
      }

      // Генерация уникального имени файла
      const filename = `${randomUUID()}.${format}`;
      const bucket = this.buckets[bucketName];

      // Загрузка в MinIO
      await this.minioClient.putObject(
        bucket,
        filename,
        imageBuffer,
        imageBuffer.length,
        {
          'Content-Type': `image/${format}`,
        },
      );

      // Возврат URL
      const minioPublicUrl = this.configService.get('MINIO_PUBLIC_URL');
      const url = minioPublicUrl
        ? `${minioPublicUrl}/${bucket}/${filename}`
        : `http://${this.configService.get('MINIO_ENDPOINT')}:${this.configService.get('MINIO_PORT')}/${bucket}/${filename}`;
      
      this.logger.log(`Image uploaded successfully: ${url}`);
      return url;
    } catch (error) {
      this.logger.error('Error uploading image:', error);
      throw new BadRequestException('Failed to upload image');
    }
  }

  async uploadMultipleImages(
    files: Express.Multer.File[],
    bucketName: keyof typeof this.buckets = 'photos',
    options?: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      format?: 'webp' | 'jpeg' | 'png';
    },
  ): Promise<string[]> {
    const uploadPromises = files.map((file) =>
      this.uploadImage(file, bucketName, options),
    );
    return Promise.all(uploadPromises);
  }

  async deleteImage(url: string): Promise<void> {
    try {
      // Пропустить blob-URL и нереальные пути
      if (!url || url.startsWith('blob:') || url.startsWith('data:')) {
        return;
      }

      // Убедиться, что URL принадлежит MinIO (localhost:9000 или настроенному эндпоинту)
      const minioEndpoint = this.configService.get('MINIO_ENDPOINT') || 'localhost';
      const minioPort = this.configService.get('MINIO_PORT') || '9000';
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        return; // невалидный URL — игнорируем
      }

      const isMinioUrl =
        parsedUrl.hostname === minioEndpoint ||
        parsedUrl.host === `${minioEndpoint}:${minioPort}`;

      if (!isMinioUrl) {
        this.logger.warn(`Skipping delete for non-MinIO URL: ${url}`);
        return;
      }

      // Извлечь bucket и filename из URL
      const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

      if (pathParts.length < 2) {
        throw new BadRequestException('Invalid file URL');
      }

      const bucket = pathParts[0];
      const filename = pathParts.slice(1).join('/');

      await this.minioClient.removeObject(bucket, filename);
      this.logger.log(`Image deleted: ${url}`);
    } catch (error) {
      this.logger.error('Error deleting image:', error);
      throw new BadRequestException('Failed to delete image');
    }
  }

  async getPresignedUrl(url: string, expirySeconds = 3600): Promise<string> {
    try {
      const urlParts = new URL(url);
      const pathParts = urlParts.pathname.split('/').filter(Boolean);
      
      if (pathParts.length < 2) {
        return url; // Вернуть оригинальный URL если формат неверный
      }

      const bucket = pathParts[0];
      const filename = pathParts.slice(1).join('/');

      const presignedUrl = await this.minioClient.presignedGetObject(
        bucket,
        filename,
        expirySeconds,
      );

      return presignedUrl;
    } catch (error) {
      this.logger.error('Error generating presigned URL:', error);
      return url; // Вернуть оригинальный URL в случае ошибки
    }
  }
}
