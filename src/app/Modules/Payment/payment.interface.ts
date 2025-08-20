import { Schema } from "mongoose";

export interface ITransactions {
  name?: string;
  email?: string;
  userId: Schema.Types.ObjectId;
  packId?: Schema.Types.ObjectId;
  producerId?: Schema.Types.ObjectId;
  commission?: number;
  subscriptionAmount?: number;
  salesAmount?: number;
  invoiceURL?: string;

}
