const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'focusgate';

if (!MONGODB_URI) {
  console.error('Set MONGODB_URI env var');
  process.exit(1);
}

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);
  const col = db.collection('userbalancehistories');

  // Find records where note = "MeetMob recharge (YYYY-MM-DD HH:mm:ss)" or similar
  const docs = await col.find({
    note: { $regex: /^MeetMob recharge \(.+\)$/ },
    archivedAt: null
  }).toArray();

  console.log(`Found ${docs.length} MeetMob recharge records to check`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const doc of docs) {
    const match = doc.note.match(/^MeetMob recharge \((.+)\)$/);
    if (!match) {
      skipped++;
      continue;
    }

    const timeStr = match[1];
    // Parse "YYYY-MM-DD HH:mm:ss" as local time (AssumeLocal in C# = Algeria time)
    const parsed = new Date(timeStr.replace(' ', 'T') + '+01:00');
    if (isNaN(parsed.getTime())) {
      console.error(`  FAIL: Cannot parse "${timeStr}" from doc ${doc._id}`);
      failed++;
      continue;
    }

    // Check if recordedAt is already correct (within 1 second)
    const current = doc.recordedAt instanceof Date ? doc.recordedAt : new Date(doc.recordedAt);
    if (Math.abs(current.getTime() - parsed.getTime()) < 1000) {
      skipped++;
      continue;
    }

    await col.updateOne(
      { _id: doc._id },
      { $set: { recordedAt: parsed } }
    );
    console.log(`  UPDATED ${doc._id}: recordedAt ${current.toISOString()} -> ${parsed.toISOString()} (note: "${timeStr}")`);
    updated++;
  }

  console.log(`\nDone: ${updated} updated, ${skipped} already correct, ${failed} failed`);
  await client.close();
}

main().catch(err => { console.error(err); process.exit(1); });
