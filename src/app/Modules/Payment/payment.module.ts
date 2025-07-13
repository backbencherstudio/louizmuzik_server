import { model, Schema } from "mongoose";
import { ITransactions } from "./payment.interface";

const TransactionsSchema = new Schema<ITransactions>(
    {
        email: { type: String },
        name: { type: String },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        commission: { type: Number },
        subscriptionAmount: { type: Number },
        salesAmount: { type: Number },
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export const Transactions = model<ITransactions>("Transactions", TransactionsSchema);