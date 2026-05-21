import { api } from '../axios';
import type { GuideBlock } from '../../types';

export const guideCalendarApi = {
  getCalendar: (guideId: string, year: number, month: number) =>
    api
      .get<{ blocks: GuideBlock[]; orders: { date: string; id: string }[] }>(
        `/api/guides/${guideId}/calendar`,
        { params: { year, month } },
      )
      .then((r) => r.data),

  createBlock: (guideId: string, data: { dateFrom: string; dateTo: string; reason?: string }) =>
    api.post<GuideBlock>(`/api/guides/${guideId}/blocks`, data).then((r) => r.data),

  deleteBlock: (guideId: string, blockId: string) =>
    api.delete(`/api/guides/${guideId}/blocks/${blockId}`).then((r) => r.data),
};
