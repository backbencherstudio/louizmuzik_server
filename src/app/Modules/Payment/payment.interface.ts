import { Schema } from "mongoose";

export interface IPackPurchase {
  packId: Schema.Types.ObjectId;
  price: number;
  selectedProducerId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
}
