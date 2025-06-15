import { model, Schema } from "mongoose";
import { Tmelody } from "./melody.interface";

const MelodySchema = new Schema<Tmelody>(
  {
    userId: { type: String, required: [true, 'User ID is required'] },
    name: { type: String, required: [true, 'name is required'] },
    image: { type: String, required: [true, 'Image URL is required'] },
    audioUrl: { type: String, required: [true, 'Audio URL is required'] },
    producer: { type: String, required: [true, 'Producer name is required'] },
    waveform: { type: String, required: [true, 'Waveform data is required'] },
    bpm: { type: Number, required: [true, 'BPM is required'] },
    key: { type: String, required: [true, 'Key is required'] },
    genre: { type: String, required: [true, 'Genre is required'] },
    artistType: { type: String, required: [true, 'Artist type is required'] },
    splitPercentage: { type: Number, required: [true, 'Split percentage is required'] },
    plays: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    favorites: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
)

export const Melody = model<Tmelody>('Melody', MelodySchema);