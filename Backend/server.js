import dotenv from "dotenv";
dotenv.config();
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoute from './Route/authRoute.js';
import productRoute from './Route/productRoute.js';

const app = express();
const PORT = process.env.port || 5000;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoute);
app.use('/api/products', productRoute);

app.get('/', (req, res) => res.send('kida fer'));
const start = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = mongoose.connection.db.collection('users');
        const indexes = await users.indexes();

        await users.dropIndexes();
        const after = await users.indexes();
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });

    } catch (err) {
        console.error('❌ Startup failed:', err.message);
        process.exit(1);
    }
};

start();
export default app;
// node -e "console.log(require('crypto').randomBytes(64).toString('hex'))" // to generate a random secret key for JWT