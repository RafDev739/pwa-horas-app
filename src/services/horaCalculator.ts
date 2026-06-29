import { daylightTimeSlots, standardTimeSlots } from '../data/timeSlots';
import { weeklyGrid } from '../data/grid';
import type { CurrentPeriod, HoraLetter } from '../types';

export function isDaylightSavingTime(): boolean {
  const jan = new Date(new Date().getFullYear(), 0, 1).getTimezoneOffset();
  const jul = new Date(new Date().getFullYear(), 6, 1).getTimezoneOffset();
  return Math.min(jan, jul) !== new Date().getTimezoneOffset();
}

export function getTimeSlots() {
  return isDaylightSavingTime() ? daylightTimeSlots : standardTimeSlots;
}

export function getCurrentTimeSlotIndex(): number {
  const now = new Date();
  const totalMinutes = now.getHours() * 60 + now.getMinutes();
  const slots = getTimeSlots();

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const startMinutes = slot.startHour * 60 + slot.startMinute;
    const endMinutes = slot.endHour * 60 + slot.endMinute;
    const crossesMidnight = slot.endHour < slot.startHour || (slot.endHour === 0 && slot.endMinute === 0 && slot.startHour > 0) || (slot.endHour === 1 && slot.startHour === 21);

    if (crossesMidnight) {
      if (totalMinutes >= startMinutes || totalMinutes < endMinutes) return i;
    } else {
      if (totalMinutes >= startMinutes && totalMinutes < endMinutes) return i;
    }
  }
  return 0;
}

export function getCurrentWeekdayIndex(): number {
  return new Date().getDay();
}

export function getCurrentPeriod(): CurrentPeriod {
  const slotIndex = getCurrentTimeSlotIndex();
  const weekdayIndex = getCurrentWeekdayIndex();
  return {
    letter: weeklyGrid[slotIndex][weekdayIndex] as HoraLetter,
    slotIndex,
    weekdayIndex,
  };
}

export function getSlotStartMs(slotIndex: number, dayOffset = 0): number {
  const slots = getTimeSlots();
  const slot = slots[slotIndex];
  const now = new Date();
  const target = new Date(now);
  target.setDate(target.getDate() + dayOffset);
  target.setHours(slot.startHour, slot.startMinute, 0, 0);
  return target.getTime();
}
