/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { generateAccessToken, PAYPAL_API } from "./generateAccessTokenForPaypal";
import { AppError } from "../errors/AppErrors";

export const sendPayoutToEmail = async (receiverEmail: string, amount: number) => {
    try {
        const accessToken = await generateAccessToken();

        const response = await axios.post(
            `${PAYPAL_API}/v1/payments/payouts`,
            {
                sender_batch_header: {
                    sender_batch_id: `batch_${Date.now()}`,
                    email_subject: "You’ve received a payout from MelodyBox",
                },
                items: [
                    {
                        recipient_type: "EMAIL",
                        amount: {
                            value: amount.toFixed(2),
                            currency: "USD",
                        },
                        receiver: receiverEmail,
                        note: "Thanks for selling your music on MelodyBox!",
                        sender_item_id: `item_${Date.now()}`,
                    },
                ],
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data;
    } catch (err: any) {
        console.error("❌ Payout Error:", err?.response?.data || err.message);
        throw new AppError(500, "Payout failed");
    }
};
