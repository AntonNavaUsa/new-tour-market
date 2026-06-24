import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';

@Injectable()
export class GpxFilesService {
  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
  ) {}

  async findAll() {
    return this.prisma.gpxFile.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findBySlug(slug: string) {
    const file = await this.prisma.gpxFile.findUnique({ where: { slug } });
    if (!file) throw new NotFoundException('GPX-файл не найден');
    return file;
  }

  async create(
    data: { name: string; slug: string; description?: string },
    file: Express.Multer.File,
  ) {
    const fileUrl = await this.filesService.uploadGpxFile(file);
    return this.prisma.gpxFile.create({
      data: { name: data.name, slug: data.slug, description: data.description, fileUrl },
    });
  }

  async update(id: string, data: { name?: string; slug?: string; description?: string }) {
    const existing = await this.prisma.gpxFile.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('GPX-файл не найден');
    return this.prisma.gpxFile.update({ where: { id }, data });
  }

  async remove(id: string) {
    const file = await this.prisma.gpxFile.findUnique({ where: { id } });
    if (!file) throw new NotFoundException('GPX-файл не найден');
    await this.filesService.deleteImage(file.fileUrl);
    await this.prisma.gpxFile.delete({ where: { id } });
    return { message: 'Deleted' };
  }

  buildClientPage(gpxFile: {
    name: string;
    description?: string | null;
    fileUrl: string;
    slug: string;
  }): string {
    const encodedUrl = encodeURIComponent(gpxFile.fileUrl);
    const organicMapsUrl = `organicmaps://track?url=${encodedUrl}`;

    return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${gpxFile.name}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f0f2f0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
    .card{background:#fff;border-radius:20px;padding:36px 28px;max-width:440px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.10);text-align:center}
    .icon{font-size:52px;margin-bottom:18px}
    h1{font-size:24px;font-weight:700;color:#1a1a1a;margin-bottom:10px;line-height:1.3}
    .desc{color:#666;font-size:15px;margin-bottom:28px;line-height:1.6}
    .btn{display:block;width:100%;padding:15px 20px;border-radius:14px;font-size:16px;font-weight:600;text-decoration:none;margin-bottom:12px;transition:opacity .15s;cursor:pointer;border:none}
    .btn:active{opacity:.8}
    .btn-primary{background:#2e7d32;color:#fff}
    .btn-secondary{background:#f0f0f0;color:#333}
    .divider{margin:20px 0;color:#bbb;font-size:13px;position:relative}
    .divider::before,.divider::after{content:'';position:absolute;top:50%;width:calc(50% - 60px);height:1px;background:#e8e8e8}
    .divider::before{left:0}.divider::after{right:0}
    .stores{display:flex;gap:10px}
    .store-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:11px;border:1.5px solid #e0e0e0;border-radius:12px;font-size:13px;color:#444;text-decoration:none;font-weight:500}
    .hint{margin-top:18px;font-size:12px;color:#aaa;line-height:1.5}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🗺️</div>
    <h1>${gpxFile.name}</h1>
    ${gpxFile.description ? `<p class="desc">${gpxFile.description}</p>` : ''}
    <a href="${organicMapsUrl}" class="btn btn-primary">
      Открыть в Organic Maps
    </a>
    <a href="${gpxFile.fileUrl}" download="${gpxFile.slug}.gpx" class="btn btn-secondary">
      Скачать GPX файл
    </a>
    <div class="divider">Нет приложения?</div>
    <div class="stores">
      <a href="https://apps.apple.com/app/organic-maps/id1567437057" class="store-btn">
        🍎 App Store
      </a>
      <a href="https://play.google.com/store/apps/details?id=app.organicmaps" class="store-btn">
        🤖 Google Play
      </a>
    </div>
    <p class="hint">Organic Maps — бесплатное приложение<br>для офлайн-навигации и треккинга</p>
  </div>
</body>
</html>`;
  }
}
