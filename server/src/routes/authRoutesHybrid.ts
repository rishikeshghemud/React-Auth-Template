// use this as an example to handle both web and mobile request auth tokens


import express from 'express';
import bcrypt from 'bcrypt';
import { User, AuthPayload } from '../models/UserModel';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { connectToDb } from '../dbUtils/db';

const app = express();

// Helper function to detect client type
const getClientType = (req: express.Request): 'web' | 'mobile' => {
    const userAgent = req.headers['user-agent'] || '';
    const clientType = req.headers['x-client-type'] as string;
    
    // Explicit client type header (recommended)
    if (clientType === 'mobile' || clientType === 'web') {
        return clientType;
    }
    
    // Auto-detect based on User-Agent
    if (userAgent.includes('Mobile') || 
        userAgent.includes('React Native') ||
        userAgent.includes('Expo') ||
        userAgent.includes('Flutter')) {
        return 'mobile';
    }
    
    return 'web'; // Default to web
};

// Helper function to extract token from request (cookies or headers)
const extractTokens = (req: express.Request) => {
    const clientType = getClientType(req);
    
    if (clientType === 'web') {
        // Web: Extract from HTTP-only cookies
        return {
            accessToken: req.cookies?.accessToken,
            refreshToken: req.cookies?.refreshToken
        };
    } else {
        // Mobile: Extract from Authorization headers
        const authHeader = req.headers.authorization;
        const refreshHeader = req.headers['x-refresh-token'] as string;
        
        return {
            accessToken: authHeader?.replace('Bearer ', ''),
            refreshToken: refreshHeader
        };
    }
};

// Helper function to send tokens based on client type
const sendTokens = (res: express.Response, accessToken: string, refreshToken: string, clientType: 'web' | 'mobile') => {
    if (clientType === 'web') {
        // Web: Send as HTTP-only cookies
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: "lax",
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        return { tokens: 'sent_as_cookies' };
    } else {
        // Mobile: Send in response body
        return {
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
            expiresIn: 15 * 60, // 15 minutes in seconds
            refreshExpiresIn: 7 * 24 * 60 * 60 // 7 days in seconds
        };
    }
};

// Enhanced Login Route
app.post('/login', async (req, res) => {
    try {
        const db = await connectToDb();
        const collection = db.collection('users');
        const clientType = getClientType(req);

        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
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

        if (!process.env.JWT_SECRET_KEY || !process.env.JWT_REFRESH_KEY) {
            res.status(500).json({ message: 'JWT secret keys not configured' });
            return;
        }

        const { password: _, ...safeUser } = user;

        // Generate JWT tokens
        const accessToken = jwt.sign({ ...safeUser }, process.env.JWT_SECRET_KEY, { expiresIn: '15m' });
        const refreshToken = jwt.sign({ ...safeUser }, process.env.JWT_REFRESH_KEY, { expiresIn: "7d" });

        // Send tokens based on client type
        const tokens = sendTokens(res, accessToken, refreshToken, clientType);

        res.status(200).json({ 
            message: 'Login successful', 
            user: { ...safeUser },
            clientType,
            ...tokens
        });
        return;
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Enhanced Register Route
app.post("/register", async (req, res) => {
    try {
        const db = await connectToDb();
        const collection = db.collection('users');

        const { email, password, name, gender } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }

        // Check if user exists
        const isExisting = await collection.findOne({ email });
        if (isExisting) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser: User = { email, password: hashedPassword, name, gender };
        const result = await collection.insertOne(newUser);

        if (result.acknowledged) {
            res.status(201).json({ 
                message: 'User registered successfully',
                userId: result.insertedId
            });
        } else {
            throw new Error('User registration failed');
        }

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Enhanced Me Route (Get Current User)
app.get("/me", async (req, res) => {
    try {
        const db = await connectToDb();
        const collection = db.collection('users');
        const clientType = getClientType(req);

        // Extract token based on client type
        const { accessToken } = extractTokens(req);

        if (!accessToken) {
            res.status(401).json({ message: "No access token provided" });
            return;
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(accessToken, process.env.JWT_SECRET_KEY!);
        } catch (error) {
            res.status(401).json({ message: "Invalid or expired access token" });
            return;
        }

        if (typeof decoded !== 'object' || !decoded || !('_id' in decoded)) {
            res.status(400).json({ message: "Invalid token payload" });
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

        res.status(200).json({ 
            user,
            clientType 
        });

    } catch (e) {
        console.error('Error in /me', e);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Enhanced Refresh Token Route
app.post("/refresh", async (req, res) => {
    try {
        const db = await connectToDb();
        const collection = db.collection('users');
        const clientType = getClientType(req);

        // Extract refresh token based on client type
        const { refreshToken } = extractTokens(req);

        if (!refreshToken) {
            res.status(400).json({ message: "No refresh token provided" });
            return;
        }

        if (!process.env.JWT_REFRESH_KEY || !process.env.JWT_SECRET_KEY) {
            throw new Error("JWT keys not found in environment variables");
        }

        // Verify refresh token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY);
        } catch (error) {
            res.status(401).json({ message: "Invalid or expired refresh token" });
            return;
        }

        if (typeof decoded !== 'object' || !decoded || !('_id' in decoded)) {
            res.status(400).json({ message: "Invalid refresh token payload" });
            return;
        }

        const user = await collection.findOne({ _id: ObjectId.createFromHexString(decoded._id) });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        const { password: _, ...safeUser } = user;

        // Generate new access token
        const accessToken = jwt.sign(safeUser, process.env.JWT_SECRET_KEY, {
            expiresIn: "15m"
        });

        // Send new token based on client type
        const tokens = sendTokens(res, accessToken, refreshToken, clientType);

        res.status(200).json({ 
            message: "Access token refreshed!", 
            user: safeUser,
            clientType,
            ...tokens
        });
    } catch (e) {
        console.log(e);
        res.status(401).json({ message: "Invalid or expired refresh token" });
    }
});

// Enhanced Logout Route
app.post("/logout", (req, res) => {
    try {
        const clientType = getClientType(req);

        if (clientType === 'web') {
            // Web: Clear HTTP-only cookies
            res.clearCookie("accessToken", {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: "lax",
            });

            res.clearCookie("refreshToken", {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: "lax",
            });
        }
        // For mobile: Client is responsible for clearing tokens from storage

        res.status(200).json({
            message: "Logged out successfully!",
            clientType,
            instruction: clientType === 'mobile' ? 
                'Please clear tokens from your local storage' : 
                'Cookies have been cleared'
        });
    } catch(e) {
        console.log(e);
        res.status(500).json({ message: 'Logout failed' });
    }
});

export default app;