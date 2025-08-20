import { model, Schema } from "mongoose";
import { ITransactions } from "./payment.interface";

const TransactionsSchema = new Schema<ITransactions>(
    {
        email: { type: String },
        name: { type: String },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        producerId: { type: Schema.Types.ObjectId, ref: 'User' },
        packId: { type: Schema.Types.ObjectId, ref: 'Pack' },
        commission: { type: Number },
        subscriptionAmount: { type: Number },
        salesAmount: { type: Number },
        invoiceURL: {
            type: String,
            default: "N/A"
        },
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export const Transactions = model<ITransactions>("Transactions", TransactionsSchema);