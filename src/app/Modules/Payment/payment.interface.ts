import { Schema } from "mongoose";

export interface ITransactions {
  email?: string;
  name?: string;
  userId: Schema.Types.ObjectId;
  commission?: number;
  subscriptionAmount?: number;
  salesAmount?: number;
  invoiceId : string;
  invoiceURL : string;
}
