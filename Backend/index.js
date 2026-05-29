import 'dotenv/config';
import mongoose from 'mongoose';
import app from './server.js';

const uri = process.env.mongo_uri;

mongoose.connect(uri)
    .then(() => {
        console.log('MongoDB Connected');
        app.listen(3000, () => {
            console.log('Server running on port 3000');
        });
    })
    .catch((err) => {
        console.error('MongoDB connection failed:', err);
        process.exit(1);
    });