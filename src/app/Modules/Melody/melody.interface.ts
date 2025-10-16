import { Schema } from "mongoose";

export interface Tmelody {
  id: string;
  userId: Schema.Types.ObjectId;
  name: string;
  image?: string;
  producer: string;
  bpm: number;
  key: string;
  genre: string[];
  artistType: string[];
  splitPercentage: number;
  audioUrl: string;
  plays?: number;
  downloads?: number;
  favorites?: number;
}

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface TdailyMelodyDownloadStats {
  producerId: Schema.Types.ObjectId;
  date: string; 
  downloads: number;
  day: DayOfWeek;
}
