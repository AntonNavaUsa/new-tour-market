import api from '../axios';

export interface WeeklyDaySchedule {
  active: boolean;
  times: string[]; // Array of start times, e.g., ['09:00', '12:00', '15:00']
}

export interface WeeklySchedulePayload {
  monday: WeeklyDaySchedule;
  tuesday: WeeklyDaySchedule;
  wednesday: WeeklyDaySchedule;
  thursday: WeeklyDaySchedule;
  friday: WeeklyDaySchedule;
  saturday: WeeklyDaySchedule;
  sunday: WeeklyDaySchedule;
}

export interface SpecialDateEntry {
  dateFrom: string;
  dateTo: string;
  times: string[];
  isClosed: boolean;
  reason?: string;
}

export interface ScheduleResponse {
  id?: string;
  cardId: string;
  weeklySchedule: WeeklySchedulePayload;
  specialDates: SpecialDateEntry[];
}

export const schedulesApi = {
  getSchedule: async (cardId: string): Promise<ScheduleResponse> => {
    const response = await api.get<ScheduleResponse>(`/api/schedules/cards/${cardId}`);
    return response.data;
  },

  updateWeeklySchedule: async (
    cardId: string,
    weeklySchedule: WeeklySchedulePayload,
  ): Promise<ScheduleResponse> => {
    const response = await api.put<ScheduleResponse>(
      `/api/schedules/cards/${cardId}/weekly`,
      { weeklySchedule },
    );
    return response.data;
  },

  addSpecialDate: async (
    cardId: string,
    entry: { dateFrom: string; dateTo: string; times?: string[]; isClosed?: boolean; reason?: string },
  ): Promise<ScheduleResponse> => {
    const response = await api.post<ScheduleResponse>(
      `/api/schedules/cards/${cardId}/special-dates`,
      entry,
    );
    return response.data;
  },

  removeSpecialDate: async (cardId: string, index: number): Promise<ScheduleResponse> => {
    const response = await api.delete<ScheduleResponse>(
      `/api/schedules/cards/${cardId}/special-dates/${index}`,
    );
    return response.data;
  },
};
