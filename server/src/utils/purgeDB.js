const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://SAFEED:Clekhak1701@cluster0.8vmsujy.mongodb.net/safeedup?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  });

  try {
    console.log('Connecting to MongoDB Atlas Cluster0...');
    await client.connect();
    console.log('✅ Connected!');

    const db = client.db('safeedup');

    const collections = await db.listCollections().toArray();
    console.log('Found collections:', collections.map(c => c.name));

    for (const col of collections) {
      if (col.name === 'users') {
        const res = await db.collection('users').deleteMany({ email: { $ne: 'superadmin@safeed.ac.in' } });
        console.log(`Deleted ${res.deletedCount} demo users from 'users' collection.`);
      } else {
        const res = await db.collection(col.name).deleteMany({});
        console.log(`Deleted ${res.deletedCount} documents from '${col.name}' collection.`);
      }
    }

    console.log('🎉 ALL DEMO DATA WIPED FROM MONGODB ATLAS!');
  } catch (err) {
    console.error('Purge error:', err);
  } finally {
    await client.close();
    process.exit(0);
  }
}

run();
