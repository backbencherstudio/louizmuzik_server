import { Schema } from "mongoose";

export interface IPack {
  id: string;
  userId: Schema.Types.ObjectId;
  title: string;
  producer: string;
  thumbnail_image: string;
  audio_path: string;
  video_path: string;
  zip_path: string;
  price: number;
  description: string;
  genre: string[];
  date: string;
  waveform: string;
  bpm: number;
  key: string;
  favorites: number;
  highlight : boolean  // this is for marketplace page hero section
}
