import { JwtPayload } from "jsonwebtoken";
export interface User { 
    email: string;
    password: string;
    name: string;
    gender: string;
}

export interface AuthPayload extends JwtPayload {
    _id: string;
}