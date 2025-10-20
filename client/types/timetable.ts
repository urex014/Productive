export interface TimetableEntry {
  id?: number;
  user_id: number;
  day: string;
  time_slot: string;
  task: string;
  duration: number;
}

export interface TimetableState {
  [day: string]: string[];
}