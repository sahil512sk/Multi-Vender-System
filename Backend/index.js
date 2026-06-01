import dotenv from "dotenv";
dotenv.config();
import mongoose from 'mongoose';
import app from './server.js';

const uri = process.env.mongo_uri;

mongoose.connect(uri)
    .then(() => {
        console.log('MongoDB Connected');
        app.listen(5000, () => {
            console.log('Server running on port 5000');
        });
    })
    .catch((err) => {
        console.error('MongoDB connection failed:', err);
        process.exit(1);
    });