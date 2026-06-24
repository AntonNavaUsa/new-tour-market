import { api } from '../axios';

export interface GpxFile {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  fileUrl: string;
  createdAt: string;
  updatedAt: string;
}

export const gpxApi = {
  findAll: (): Promise<GpxFile[]> =>
    api.get('/api/gpx-files').then((r) => r.data),

  create: (formData: FormData): Promise<GpxFile> =>
    api.post('/api/gpx-files', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  update: (
    id: string,
    data: { name?: string; slug?: string; description?: string },
  ): Promise<GpxFile> =>
    api.patch(`/api/gpx-files/${id}`, data).then((r) => r.data),

  remove: (id: string): Promise<void> =>
    api.delete(`/api/gpx-files/${id}`).then((r) => r.data),
};
