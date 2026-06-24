import { api } from '../axios';

export interface GuidePage {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  headPhotoUrl: string | null;
  coverFixed: boolean;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type GuidePageListItem = Pick<GuidePage, 'id' | 'title' | 'slug' | 'excerpt' | 'headPhotoUrl' | 'sortOrder'>;

export const guidePagesApi = {
  // Public
  list: (): Promise<GuidePageListItem[]> =>
    api.get('/api/guide-pages').then((r) => r.data),

  getBySlug: (slug: string): Promise<GuidePage> =>
    api.get(`/api/guide-pages/${slug}`).then((r) => r.data),

  // Admin
  adminList: (): Promise<(GuidePage & { isPublished: boolean })[]> =>
    api.get('/api/admin/guide-pages').then((r) => r.data),

  adminGet: (id: string): Promise<GuidePage> =>
    api.get(`/api/admin/guide-pages/${id}`).then((r) => r.data),

  create: (data: Partial<GuidePage>): Promise<GuidePage> =>
    api.post('/api/admin/guide-pages', data).then((r) => r.data),

  update: (id: string, data: Partial<GuidePage>): Promise<GuidePage> =>
    api.patch(`/api/admin/guide-pages/${id}`, data).then((r) => r.data),

  remove: (id: string): Promise<{ success: boolean }> =>
    api.delete(`/api/admin/guide-pages/${id}`).then((r) => r.data),

  uploadCover: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post<{ url: string }>('/api/admin/guide-pages/upload-cover', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
};
