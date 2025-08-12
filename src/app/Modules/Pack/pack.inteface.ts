import { Schema } from "mongoose";

export interface IPack {
  id: string;
  userId: Schema.Types.ObjectId;
  title: string;
  producer: string;
  thumbnail_image: string;
  audio_path: string;
  zip_path?: string;
  video_path?: string;
  price: number;
  description: string;
  genre: string[];
  // waveform: string;
  // bpm?: number;
  // key?: string;
  favorites: number;
  sales?: number;
  profit?: number;
  highlight: boolean  // this is for marketplace page hero section
}

export interface IPackPurchase {
  packId: Schema.Types.ObjectId;
  price: number;
  selectedProducerId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
}

// export interface IPaymentData {
//   packId: Schema.Types.ObjectId;
//   price: number;
//   selectedProducerId: Schema.Types.ObjectId;
//   userId: Schema.Types.ObjectId;
// }

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface TdailySealseStats {
  producerId: Schema.Types.ObjectId;
  date: string; 
  downloads: number;
  day: DayOfWeek;
}
