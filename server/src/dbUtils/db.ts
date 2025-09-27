import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const url = process.env.MONGO_URI || "mongodb://localhost:27017";
let db: Db | null = null;

export const connectToDb = async () => {
    try {
        if (db) return db;

        const client = new MongoClient(url, {
            maxPoolSize: 10, // Maximum number of connections in the connection pool
            minPoolSize: 2,  // Minimum number of connections in the connection pool
            maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
            serverSelectionTimeoutMS: 5000, // How long to wait for server selection
            socketTimeoutMS: 45000, // How long a socket stays open during inactivity
            connectTimeoutMS: 10000, // How long to wait for initial connection
            heartbeatFrequencyMS: 10000, // How often to check if server is available
            retryWrites: true, // Retry write operations once
            retryReads: true, // Retry read operations once
            compressors: ['zlib'], // Enable compression for better performance
        });

        await client.connect();
        db = client.db('ChatApp')
        return db;
    } catch (error) {
        console.error("Error connecting to MongoDB:");
        throw error;
    }
}