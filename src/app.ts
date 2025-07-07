/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-undef */
import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import router from './app/routes';
import globalErrorHandler from './app/middleware/globalErrorHandlear';
import axios from 'axios';

const app: Application = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ['http://localhost:3000'],  
    credentials: true,
  })
);

app.get('/test', async (req, res) => {
  const a = 'server running successfully';
  res.send(a);
});

app.use("/api/v1", router)

app.use('/uploads', express.static('uploads'));  




const PAYPAL_API = "https://api-m.sandbox.paypal.com"; // For live: use "https://api-m.paypal.com"

const generateAccessToken = async () => {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET_ID}`
  ).toString("base64");

  const response = await axios.post(
    `${PAYPAL_API}/v1/oauth2/token`,
    "grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data.access_token;
};

// Create Order
app.post("/create-order", async (req, res) => {
  const { amount } = req.body;  

  try {
    const accessToken = await generateAccessToken();    

    const response = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders`,
      {
        intent: "CAPTURE",
        purchase_units: [{ amount: { currency_code: "USD", value: amount } }],
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({ id: response.data.id });
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong");
  }
});

// Capture Order
app.post("/capture-order/:orderID", async (req, res) => {
  const { orderID } = req.params;

  try {
    const accessToken = await generateAccessToken();

    const response = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error capturing order");
  }
});











app.get("/",(req, res)=>{
  res.send({message : "server running successfully"})
})


app.use(globalErrorHandler);
export default app;


// as a admin have a stripe account , now i want to attache  banc account as a producer, i want to sell music this websit , if some one buy my music then the user need to perses the music , but the thinks is , when user but it then admin cut 3 % amout the main music coust and 97% amount gone to the producer bank account, a single transaction , no withrow request, as at fiest the producers need to accach his account the admin main stripe account , then every transaction admin cut 3% or producer get 97%, 
// ================
// now build this function user react and node express with mongoose and typescript for backend , 


// https://chatgpt.com/c/68610f50-6b24-800c-8d49-fbaaf4c4a924  double transaction at a time all code, 
// https://chatgpt.com/c/68610f50-6b24-800c-8d49-fbaaf4c4a924