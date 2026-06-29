import type { TimeSlot } from '../types';

export const daylightTimeSlots: TimeSlot[] = [
  { startHour: 1,  startMinute: 0,  endHour: 4,  endMinute: 25 },
  { startHour: 4,  startMinute: 25, endHour: 7,  endMinute: 51 },
  { startHour: 7,  startMinute: 51, endHour: 11, endMinute: 17 },
  { startHour: 11, startMinute: 17, endHour: 14, endMinute: 42 },
  { startHour: 14, startMinute: 42, endHour: 18, endMinute: 8  },
  { startHour: 18, startMinute: 8,  endHour: 21, endMinute: 34 },
  { startHour: 21, startMinute: 34, endHour: 1,  endMinute: 0  },
];

export const standardTimeSlots: TimeSlot[] = [
  { startHour: 0,  startMinute: 0,  endHour: 3,  endMinute: 25 },
  { startHour: 3,  startMinute: 25, endHour: 6,  endMinute: 51 },
  { startHour: 6,  startMinute: 51, endHour: 10, endMinute: 17 },
  { startHour: 10, startMinute: 17, endHour: 13, endMinute: 42 },
  { startHour: 13, startMinute: 42, endHour: 17, endMinute: 8  },
  { startHour: 17, startMinute: 8,  endHour: 20, endMinute: 34 },
  { startHour: 20, startMinute: 34, endHour: 0,  endMinute: 0  },
];

export function formatTime12Hour(hour: number, minute: number): string {
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const period = hour >= 12 ? 'PM' : 'AM';
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
}

export function getSlotDisplayText(slot: TimeSlot): string {
  return `${formatTime12Hour(slot.startHour, slot.startMinute)} - ${formatTime12Hour(slot.endHour, slot.endMinute)}`;
}
