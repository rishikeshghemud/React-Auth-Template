import express from 'express';
import cookieParser from "cookie-parser";
import dotenv from 'dotenv';
dotenv.config();

import authRoute from './routes/authRoutes';

const app = express();
const PORT = process.env.PORT || 8001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRoute);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});