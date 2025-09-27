import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
dotenv.config();


const verifyToken = async(req: Request, res: Response, next: NextFunction) => { 

    if(!process.env.JWT_SECRET_KEY) {
        throw new Error('JWT_SECRET_KEY is not defined in environment variables');
    }

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authorization header is missing' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {   
            return res.status(401).json({ message: 'Token is missing' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
         
        next();
    } catch (e) {
        throw new Error('Token verification failed');
    }
}

export const verifyAccessTokenFromCookies = (token: string) => {
    try {
        if(!process.env.JWT_SECRET_KEY) {
            throw new Error("No Access token secret found in env");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        return decoded;
    } catch(e) {
        return null;
    }
}

export const verifyRefreshTokenFromCookies = (token: string) => {
    try {
        if(!process.env.JWT_REFRESH_KEY) {
            throw new Error("No Refresh token secret found in env");
        }

        const decoded = jwt.verify(token, process.env.JWT_REFRESH_KEY);

        return decoded;
    } catch(e) {
        return null;
    }
}


export default verifyToken;