env = require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./server');
const uri = process.env.mongo_uri;

app.listen(3000, () => {
    console.log('Server running');
});

mongoose.connect(uri)
.then(() => {
    console.log('MongoDB Connected');
})
.catch((err) => {
    console.log(err);
});