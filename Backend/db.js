import { MongoClient } from 'mongodb';
const client = new MongoClient(process.env.mongo_uri);

async function connectDB() {
    await client.connect();
    console.log('MongoDB Connected');

    return client.db('test');
}

export default connectDB;