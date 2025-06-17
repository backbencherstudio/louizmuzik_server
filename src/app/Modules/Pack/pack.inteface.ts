export interface IPack {
  id: string;
  userId: string;
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
}
