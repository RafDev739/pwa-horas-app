import type { HoraLetter } from '../types';

// weeklyGrid[timeSlotIndex][weekdayIndex]  (weekday: 0=Sunday … 6=Saturday)
export const weeklyGrid: HoraLetter[][] = [
  ['G', 'C', 'F', 'B', 'E', 'A', 'D'],
  ['A', 'D', 'G', 'C', 'F', 'B', 'E'],
  ['B', 'E', 'A', 'D', 'G', 'C', 'F'],
  ['C', 'F', 'B', 'E', 'A', 'D', 'G'],
  ['D', 'G', 'C', 'F', 'B', 'E', 'A'],
  ['E', 'A', 'D', 'G', 'C', 'F', 'B'],
  ['F', 'B', 'E', 'A', 'D', 'G', 'C'],
];

export function getHoraLetter(timeSlotIndex: number, weekdayIndex: number): HoraLetter {
  return weeklyGrid[timeSlotIndex][weekdayIndex];
}
