import express from 'express';
import cookieParser from "cookie-parser";
import dotenv from 'dotenv';
import cors from "cors";
dotenv.config();

import authRoute from './routes/authRoutes';

const app = express();
const PORT = process.env.PORT || 8001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8080'], // Added Vite default port
  credentials: true,
}));

app.use('/api/auth', authRoute);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});