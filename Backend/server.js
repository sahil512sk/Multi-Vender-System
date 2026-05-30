import express from 'express';
const app = express();
import userRoute from './Route/userRoute.js';

app.use(express.json());
app.use('/api/users', userRoute);

app.get('/', (req, res) => {
    res.send('kida fer');
});

export default app;