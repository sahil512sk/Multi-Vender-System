import express from 'express';
const app = express();
import userRoute from './Route/userRoute.js';
import cors from 'cors';

app.use(express.json());
app.use('/api/users', userRoute);

app.get('/', (req, res) => {
    res.send('kida fer');
});
app.use(cors({ origin: 'http://localhost:5000', credentials: true }));

export default app;