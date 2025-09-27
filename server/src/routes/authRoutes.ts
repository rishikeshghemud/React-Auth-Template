import express from 'express';
import bcrypt from 'bcrypt';
import { User, AuthPayload } from '../models/UserModel';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { verifyAccessTokenFromCookies, verifyRefreshTokenFromCookies } from '../middlewares/verifyToken';
import { connectToDb } from '../dbUtils/db';


const app = express();

app.post('/login', async (req, res) => {
    try {
        const db = await connectToDb();
        const collection = db.collection('users');

        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Username and password are required' });
            return;
        }

        // Find the user by email
        const user = await collection.findOne({ email });
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        if (!process.env.JWT_SECRET_KEY) {
            res.status(500).json({ message: 'JWT secret key not configured' });
            return;
        }

        if (!process.env.JWT_REFRESH_KEY) {
            res.status(500).json({ message: 'JWT secret key not configured' });
            return;
        }

        const { password: _, ...safeUser } = user;

        // Generate JWT token
        const accessToken = jwt.sign({ ...safeUser }, process.env.JWT_SECRET_KEY, { expiresIn: '15m' });

        const refreshToken = jwt.sign({ ...safeUser }, process.env.JWT_REFRESH_KEY, { expiresIn: "7d" });

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
        })

        res.status(200).json({ message: 'Login successful', user: { ...safeUser } });
        return;
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post("/register", async (req, res) => {
    try {
        const db = await connectToDb();
        const collection = db.collection('users');

        const { email, password, name, gender } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Username and password are required' });
            return;
        }

        // Find if existing user 
        const isExisting = await collection.findOne({ email });
        if (isExisting) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into the database
        const newUser: User = { email, password: hashedPassword, name, gender };

        const result = await collection.insertOne(newUser);

        if (result.acknowledged) {
            res.status(201).json({ message: 'User registered successfully' });
        } else {
            throw new Error('User registration failed');
        }

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get("/me", async (req, res) => {
    try {
        const db = await connectToDb();
        const collection = db.collection('users');

        const accessToken = req.cookies?.accessToken;

        if (!accessToken) {
            res.status(401).json({ message: "No Access Token" });
            return;
        }

        const decoded = verifyAccessTokenFromCookies(accessToken);

        if (!decoded) {
            res.status(401).json({ message: "Invalid or expired token" });
            return;
        }

        if (typeof decoded !== 'object' || !decoded || !('_id' in decoded)) {
            res.status(400).json({ message: "No Id found in user object, Object malformed" });
            return;
        }

        const user = await collection.findOne(
            { _id: ObjectId.createFromHexString(decoded._id) },
            { projection: { password: 0 } }
        );

        if (!user) {
            res.status(400).json({ message: "User not found" });
            return;
        }

        res.status(200).json({ user });

    } catch (e) {
        console.error('Error in /me', e);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post("/refresh", async (req, res) => {
    try {

        const db = await connectToDb();
        const collection = db.collection('users');

        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            res.status(400).json({ message: "No refresh token found!" });
            return;
        }

        if (!process.env.JWT_REFRESH_KEY || !process.env.JWT_SECRET_KEY) {
            throw new Error("JWT keys not found in environment variables");
        }

        const decoded = verifyRefreshTokenFromCookies(refreshToken);

        if (typeof decoded !== 'object' || !decoded || !('_id' in decoded)) {
            res.status(400).json({ message: "Malformed refresh token payload" });
            return;
        }

        const user = await collection.findOne({ _id: ObjectId.createFromHexString(decoded._id) });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        const { password: _, ...safeUser } = user;

        const accessToken = jwt.sign(safeUser, process.env.JWT_SECRET_KEY, {
            expiresIn: "15m"
        })

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
        });

        res.status(200).json({ message: "Access token refreshed!", user: safeUser });
    } catch (e) {
        console.log(e);
        res.status(401).json({ message: "Invalid or expired refresh token" });
    }
});

app.post("/logout", (req, res) => {
    try {
        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
        });

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
        })

        res.status(200).json({message: "Logged out successfully!"});
    } catch(e) {
        console.log(e);
    }
});

export default app;