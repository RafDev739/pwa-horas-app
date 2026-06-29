export type HoraLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
export const HORA_LETTERS: HoraLetter[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

export type Language = 'en' | 'es';

export interface TimeSlot {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export interface HoraData {
  letter: HoraLetter;
  goodFor: string;
  avoid: string;
  summary: string;
}

export interface DetailedHoraContent {
  letter: HoraLetter;
  generalDescription: string;
  favorableActivities: string[];
  unfavorableActivities: string[];
  characteristics: string;
}

export type TaskCategory =
  | 'loan_applications'
  | 'request_favors'
  | 'new_business_ventures'
  | 'contract_signing'
  | 'marriage_engagements'
  | 'moving_relocation'
  | 'debt_collection'
  | 'loan_money'
  | 'gambling_lotto_stocks'
  | 'travel_planning'
  | 'business_general'
  | 'medical_procedures'
  | 'legal_proceedings'
  | 'physical_exercise'
  | 'study_research'
  | 'health_treatments'
  | 'deal_with_lawyers'
  | 'deal_with_government'
  | 'mechanical_technical'
  | 'business_credit'
  | 'business_operations'
  | 'business_startup'
  | 'business_advancement'
  | 'medical_therapy'
  | 'medical_surgery'
  | 'legal_preparation'
  | 'legal_filing'
  | 'legal_disputes'
  | 'travel_short'
  | 'travel_long';

export interface TaskPreference {
  notifyGood: boolean;
  notifyBad: boolean;
  minutesBefore: number;
}

export interface Settings {
  language: Language;
  favoritePeriods: HoraLetter[];
  favoriteReminderMinutes: number;
  dailyForecastEnabled: boolean;
  dailyForecastTime: string;
  taskPreferences: Partial<Record<TaskCategory, TaskPreference>>;
}

export interface CurrentPeriod {
  letter: HoraLetter;
  slotIndex: number;
  weekdayIndex: number;
}

export type TaskGroup = 'business' | 'medical' | 'legal' | 'travel';

export interface TaskCategoryInfo {
  key: TaskCategory;
  group?: TaskGroup;
  nameKey: string;
  descKey: string;
}
