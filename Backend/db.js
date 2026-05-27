const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.mongo_uri);

async function connectDB() {
    await client.connect();
    console.log('MongoDB Connected');

    return client.db('test');
}
module.exports = connectDB;