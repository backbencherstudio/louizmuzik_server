import { model, Schema } from "mongoose";
import { IPack, IPackPurchase } from "./pack.inteface";

const packSchema = new Schema<IPack>(
    {
        id: { type: String},
        userId: { type: Schema.Types.ObjectId, ref:"User", required: true },
        title: { type: String, required: true },
        producer: { type: String, required: true },
        thumbnail_image: { type: String, required: true },
        audio_path: { type: String, required: true  },
        zip_path: { type: String, default: '' },
        video_path: { type: String, default: '' },
        price: { type: Number, required: true },
        description: { type: String, default: '' },
        genre: { type: [String], required: true },
        waveform: { type: String, required: true },
        bpm: { type: Number, required: true },
        key: { type: String, required: true },
        favorites: { type: Number, default: 0 },
        sales: { type: Number },
        profit: { type: Number },
        highlight: { type: Boolean, default: false },
    },
    {
        timestamps: true,
        versionKey: false
    }
);

const PackPurchaseSchema = new Schema<IPackPurchase>(
    {
        packId: { type: Schema.Types.ObjectId, ref: 'Pack', required: true },
        price: { type: Number, required: true },
        selectedProducerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true, versionKey: false }
)

export const PackPurchase = model<IPackPurchase>("PackPurchase", PackPurchaseSchema)

export const Pack = model<IPack>('Pack', packSchema);