/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-undef */
import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import router from './app/routes';
import globalErrorHandler from './app/middleware/globalErrorHandlear';

const app: Application = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ['http://localhost:5173'],  
    credentials: true,
  })
);

app.get('/test', async (req, res) => {
  const a = 'server running successfully';
  res.send(a);
});

app.use("/api/v1", router)

app.use('/uploads', express.static('uploads'));  



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