import express from 'express';
import cors from 'cors';
import userRoute from './Route/userRoute.js';
import productRoute from './Route/productRoute.js';

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', userRoute);
app.use('/api/products', productRoute);

app.get('/', (req, res) => {
    res.send('kida fer');
});

export default app;