export interface Tmelody {
  id: string;
  userId: string;
  name: string;
  image: string;
  producer: string;
  waveform: string;
  bpm: number;
  key: string;
  genre: string;
  artistType: string;
  splitPercentage: number;
  audioUrl: string;
  plays?: number;
  downloads?: number;
  favorites?: number;
}
