import { model, Schema } from "mongoose";
import { IPackPurchase } from "./payment.interface";


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