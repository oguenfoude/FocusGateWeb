/**
 * FocusGate Test Data Seeder
 *
 * Creates realistic test data in MongoDB Atlas:
 * - Test user (test / test123)
 * - 3 assigned modems with SIM cards
 * - Balance history records
 * - Pending withdrawal request
 * - Recent SMS records
 *
 * Usage: node scripts/seed-test-data.js
 */

const { MongoClient } = require('mongodb')
require('dotenv').config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = 'focusgate'

// Test data constants
const TEST_USER_ID = 1001
const TEST_USERNAME = 'test'
const TEST_PASSWORD = 'test123'

// Modem IDs to reassign to test user (from existing modems in DB)
const MODEM_IDS_TO_ASSIGN = [1, 2, 3]

async function seed() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI not found in .env.local')
    process.exit(1)
  }

  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    const db = client.db(DB_NAME)

    console.log('Connected to MongoDB Atlas')
    console.log(`Database: ${DB_NAME}`)
    console.log('---')

    // 1. Create test user
    console.log('1. Creating test user...')
    await db.collection('users').updateOne(
      { _id: TEST_USER_ID },
      {
        $set: {
          _id: TEST_USER_ID,
          username: TEST_USERNAME,
          password: TEST_PASSWORD,
          role: 1, // User
          balance: 25000,
          archivedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    )
    console.log(`   Created user: ${TEST_USERNAME} (ID: ${TEST_USER_ID}, balance: 25000 DA)`)

    // 2. Get existing modems
    console.log('2. Finding modems to assign...')
    const modems = await db.collection('modems')
      .find({ _id: { $in: MODEM_IDS_TO_ASSIGN } })
      .toArray()

    if (modems.length === 0) {
      console.log('   No modems found. Creating sample modems...')
      for (let i = 1; i <= 3; i++) {
        await db.collection('modems').updateOne(
          { _id: i },
          [
            {
              $set: {
                imei: { $ifNull: ['$imei', `86457601183550${i}`] },
                port: { $ifNull: ['$port', `COM${i + 2}`] },
                status: 4,
                model: { $ifNull: ['$model', 'E3531'] },
                brand: { $ifNull: ['$brand', 1] },
                ip: { $ifNull: ['$ip', `192.168.${50 + i}.1`] },
                archivedAt: null,
                createdAt: { $ifNull: ['$createdAt', new Date()] },
                updatedAt: new Date(),
              },
            },
          ],
          { upsert: true }
        )
      }
    }

    // 3. Assign modems to test user
    console.log('3. Assigning modems to test user...')
    for (const modemId of MODEM_IDS_TO_ASSIGN) {
      // Remove old assignment if exists
      await db.collection('usermodems').updateOne(
        { modemId, userId: TEST_USER_ID, removedAt: null },
        { $set: { removedAt: new Date() } }
      )

      // Create new assignment
      await db.collection('usermodems').updateOne(
        { userId: TEST_USER_ID, modemId },
        {
          $set: {
            userId: TEST_USER_ID,
            modemId,
            assignedAt: new Date(),
            removedAt: null,
            archivedAt: null,
          },
        },
        { upsert: true }
      )

      // Ensure SIM card exists and is active (use upsert without _id in $set)
      await db.collection('simcards').updateOne(
        { _id: modemId },
        [
          {
            $set: {
              modemId,
              phoneNumber: { $ifNull: ['$phoneNumber', `213655${String(310000 + modemId).slice(-5)}`] },
              isActive: true,
              balance: { $ifNull: ['$balance', 15000 + modemId * 500] },
              archivedAt: null,
              createdAt: { $ifNull: ['$createdAt', new Date()] },
              updatedAt: new Date(),
            },
          },
        ],
        { upsert: true }
      )

      console.log(`   Assigned modem ${modemId} to test user`)
    }

    // 4. Create balance history records
    console.log('4. Creating balance history records...')
    const now = new Date()
    const balanceHistories = [
      {
        userId: TEST_USER_ID,
        simCardId: MODEM_IDS_TO_ASSIGN[0],
        balance: 25000,
        previousBalance: 22000,
        source: 1, // SMS
        recordedAt: new Date(now - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        archivedAt: null,
      },
      {
        userId: TEST_USER_ID,
        simCardId: MODEM_IDS_TO_ASSIGN[1],
        balance: 28000,
        previousBalance: 25000,
        source: 1, // SMS
        recordedAt: new Date(now - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        archivedAt: null,
      },
      {
        userId: TEST_USER_ID,
        simCardId: MODEM_IDS_TO_ASSIGN[2],
        balance: 31000,
        previousBalance: 28000,
        source: 0, // USSD
        recordedAt: new Date(now - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        archivedAt: null,
      },
      {
        userId: TEST_USER_ID,
        simCardId: MODEM_IDS_TO_ASSIGN[0],
        balance: 34000,
        previousBalance: 31000,
        source: 1, // SMS
        recordedAt: new Date(now - 12 * 60 * 60 * 1000), // 12 hours ago
        archivedAt: null,
      },
      {
        userId: TEST_USER_ID,
        simCardId: MODEM_IDS_TO_ASSIGN[1],
        balance: 37000,
        previousBalance: 34000,
        source: 2, // Settlement
        recordedAt: new Date(now - 6 * 60 * 60 * 1000), // 6 hours ago
        archivedAt: null,
      },
    ]

    await db.collection('balancehistories').deleteMany({ userId: TEST_USER_ID })
    await db.collection('balancehistories').insertMany(balanceHistories)
    console.log(`   Created ${balanceHistories.length} balance history records`)

    // 5. Create user balance history (wallet)
    console.log('5. Creating user balance history...')
    const userBalanceHistories = [
      {
        userId: TEST_USER_ID,
        balance: 10000,
        amount: 10000,
        type: 0, // Credit
        note: 'Initial credit from SIM settlements',
        recordedAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
        archivedAt: null,
      },
      {
        userId: TEST_USER_ID,
        balance: 18000,
        amount: 8000,
        type: 0, // Credit
        note: 'SMS auto-credit batch',
        recordedAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
        archivedAt: null,
      },
      {
        userId: TEST_USER_ID,
        balance: 25000,
        amount: 7000,
        type: 0, // Credit
        note: 'Daily settlement',
        recordedAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
        archivedAt: null,
      },
    ]

    await db.collection('userbalancehistories').deleteMany({ userId: TEST_USER_ID })
    await db.collection('userbalancehistories').insertMany(userBalanceHistories)
    console.log(`   Created ${userBalanceHistories.length} user balance history records`)

    // 6. Create pending withdrawal request
    console.log('6. Creating pending withdrawal request...')
    await db.collection('withdrawalrequests').deleteMany({ userId: TEST_USER_ID, status: 0 })
    await db.collection('withdrawalrequests').insertOne({
      userId: TEST_USER_ID,
      amount: 5000,
      status: 0, // Pending
      note: 'Test withdrawal request',
      adminNote: null,
      processedByAdminId: null,
      requestedAt: new Date(now - 2 * 60 * 60 * 1000), // 2 hours ago
      processedAt: null,
      archivedAt: null,
    })
    console.log('   Created pending withdrawal: 5000 DA')

    // Also create an approved withdrawal for history
    await db.collection('withdrawalrequests').insertOne({
      userId: TEST_USER_ID,
      amount: 3000,
      status: 1, // Approved
      note: 'Previous withdrawal',
      adminNote: 'Approved by admin',
      processedByAdminId: 0, // Admin
      requestedAt: new Date(now - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      processedAt: new Date(now - 6 * 24 * 60 * 60 * 1000),
      archivedAt: null,
    })
    console.log('   Created approved withdrawal: 3000 DA (for history)')

    // 7. Create recent SMS records
    console.log('7. Creating recent SMS records...')
    const smsRecords = [
      {
        simCardId: MODEM_IDS_TO_ASSIGN[0],
        senderNumber: '213555123456',
        content: 'Votre solde est de 15000 DA. Merci d\'utiliser nos services.',
        receivedAt: new Date(now - 1 * 60 * 60 * 1000), // 1 hour ago
        archivedAt: null,
      },
      {
        simCardId: MODEM_IDS_TO_ASSIGN[1],
        senderNumber: '213555789012',
        content: 'Notification: Votre rechargement de 2000 DA a ete effectue avec succes.',
        receivedAt: new Date(now - 3 * 60 * 60 * 1000), // 3 hours ago
        archivedAt: null,
      },
      {
        simCardId: MODEM_IDS_TO_ASSIGN[2],
        senderNumber: '213555345678',
        content: 'Confirmation: Transaction de 5000 DA effectuee. Nouveau solde: 10000 DA.',
        receivedAt: new Date(now - 5 * 60 * 60 * 1000), // 5 hours ago
        archivedAt: null,
      },
      {
        simCardId: MODEM_IDS_TO_ASSIGN[0],
        senderNumber: '213555901234',
        content: 'Alerte: Votre solde est inferieur a 10000 DA. Veuillez recharger.',
        receivedAt: new Date(now - 8 * 60 * 60 * 1000), // 8 hours ago
        archivedAt: null,
      },
      {
        simCardId: MODEM_IDS_TO_ASSIGN[1],
        senderNumber: '213555567890',
        content: 'Votre code OTP est: 4521. Valable 5 minutes.',
        receivedAt: new Date(now - 12 * 60 * 60 * 1000), // 12 hours ago
        archivedAt: null,
      },
    ]

    await db.collection('smsrecords').deleteMany({
      simCardId: { $in: MODEM_IDS_TO_ASSIGN },
    })
    await db.collection('smsrecords').insertMany(smsRecords)
    console.log(`   Created ${smsRecords.length} SMS records`)

    // 8. Ensure at least one SIM has high balance for warnings page
    console.log('8. Setting up high-balance SIM for warnings...')
    await db.collection('simcards').updateOne(
      { _id: MODEM_IDS_TO_ASSIGN[0] },
      { $set: { balance: 48000 } } // Above 45000 threshold
    )
    console.log(`   SIM ${MODEM_IDS_TO_ASSIGN[0]} balance set to 48000 DA (triggers warning)`)

    console.log('---')
    console.log('Seed completed successfully!')
    console.log('')
    console.log('Test credentials:')
    console.log(`  Username: ${TEST_USERNAME}`)
    console.log(`  Password: ${TEST_PASSWORD}`)
    console.log('')
    console.log('Test data summary:')
    console.log(`  - User balance: 25000 DA`)
    console.log(`  - Assigned modems: ${MODEM_IDS_TO_ASSIGN.join(', ')}`)
    console.log(`  - Pending withdrawal: 5000 DA`)
    console.log(`  - High-balance SIM: 48000 DA (triggers warning)`)
    console.log(`  - Balance history: ${balanceHistories.length} records`)
    console.log(`  - SMS records: ${smsRecords.length} messages`)

  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

seed()
