/**
 * One-time cleanup script: Delete documents with ObjectId _id from MongoDB.
 * 
 * The .NET gateway expects _id as Int64 (Number), but some documents
 * were created with MongoDB auto-generated ObjectId _id. This script
 * deletes them so the .NET gateway can re-push correct data.
 * 
 * Usage: node scripts/cleanup-objectid-ids.js
 * 
 * Requires MONGODB_URI environment variable or update the URI below.
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI ||
  'mongodb://admin:admin@ac-8knjxta-shard-00-00.ldndrwe.mongodb.net:27017,ac-8knjxta-shard-00-01.ldndrwe.mongodb.net:27017,ac-8knjxta-shard-00-02.ldndrwe.mongodb.net:27017/focusgate?ssl=true&replicaSet=atlas-qo2jcu-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

const DATABASE_NAME = 'focusgate';

// Only clean collections that may have ObjectId _id contamination
const COLLECTIONS_TO_CLEAN = [
  'smsrecords',
  'balancehistories',
  'userbalancehistories',
  'withdrawalrequests',
  'usermodems',
];

async function cleanup() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');

    const db = client.db(DATABASE_NAME);
    let totalDeleted = 0;

    for (const collectionName of COLLECTIONS_TO_CLEAN) {
      const collection = db.collection(collectionName);

      // Find documents where _id is an ObjectId (BSON type 7)
      // ObjectId instances have a _bsontype property
      const objectIdDocs = await collection.find({
        _id: { $type: 'objectId' }
      }).toArray();

      if (objectIdDocs.length === 0) {
        console.log(`  ${collectionName}: No ObjectId _id documents found (clean)`);
        continue;
      }

      console.log(`  ${collectionName}: Found ${objectIdDocs.length} documents with ObjectId _id`);

      // Delete them
      const result = await collection.deleteMany({
        _id: { $type: 'objectId' }
      });

      console.log(`  ${collectionName}: Deleted ${result.deletedCount} documents`);
      totalDeleted += result.deletedCount;
    }

    console.log(`\nCleanup complete. Total deleted: ${totalDeleted} documents`);
    console.log('The .NET gateway will re-push correct data on next sync cycle (30s).');

  } catch (error) {
    console.error('Cleanup failed:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

cleanup();
