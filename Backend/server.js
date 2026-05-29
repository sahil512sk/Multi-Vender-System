const express = require('express');
const app = express();
const  userRoute  =require('./Route/userRoute.js');

app.use(express.json());
app.use('/api/users', userRoute);

app.get('/', (req, res) => {
    res.send('kida fer');
});

module.exports = app;