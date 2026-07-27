/**
 * One-time cleanup script: Delete documents with ObjectId _id from MongoDB.
 *
 * The .NET gateway expects _id as Int64 (Number), but some documents
 * were created with MongoDB auto-generated ObjectId _id. This script
 * deletes them so the .NET gateway can re-push correct data.
 *
 * Usage:  MONGODB_URI=... node scripts/cleanup-objectid-ids.js
 *
 * Requires the MONGODB_URI environment variable. NEVER hardcode credentials here.
 */

const { MongoClient } = require('mongodb');

if (!process.env.MONGODB_URI) {
  console.error('ERROR: MONGODB_URI environment variable is required.');
  console.error('Example (PowerShell):');
  console.error('  $env:MONGODB_URI = "mongodb+srv://user:pass@cluster.example.net/db"; node scripts/cleanup-objectid-ids.js');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;

const DATABASE_NAME = process.env.MONGODB_DB || 'flixiDz';

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

      const objectIdDocs = await collection.find({
        _id: { $type: 'objectId' }
      }).toArray();

      if (objectIdDocs.length === 0) {
        console.log(`  ${collectionName}: No ObjectId _id documents found (clean)`);
        continue;
      }

      console.log(`  ${collectionName}: Found ${objectIdDocs.length} documents with ObjectId _id`);

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
