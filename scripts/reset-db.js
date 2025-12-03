#!/usr/bin/env node

/**
 * Database Reset & Seed Script
 *
 * Script ini akan:
 * 1. Menghapus semua data di collection 'kos' dan 'calculations'
 * 2. Memasukkan sample data kos baru
 * 3. Menampilkan summary hasil seeding
 *
 * Cara Penggunaan:
 * node scripts/reset-db.js
 * atau
 * yarn reset-db
 */

const { MongoClient } = require('mongodb');
const { sampleKos } = require('./seed-data');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = 'topsis_kos';

// ANSI color codes untuk output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function resetDatabase() {
  let client;

  try {
    log('\n' + '='.repeat(60), 'bright');
    log('  DATABASE RESET & SEED SCRIPT', 'bright');
    log('  Sistem Pakar Pemilihan Kos - TOPSIS', 'cyan');
    log('='.repeat(60) + '\n', 'bright');

    logInfo('Connecting to MongoDB...');
    logInfo(`MongoDB URL: ${MONGO_URL}`);
    logInfo(`Database: ${DB_NAME}\n`);

    // Connect to MongoDB
    client = await MongoClient.connect(MONGO_URL, {
      serverSelectionTimeoutMS: 5000,
    });

    logSuccess('Connected to MongoDB successfully!\n');

    const db = client.db(DB_NAME);

    // Step 1: Clear existing data
    log('📦 Step 1: Clearing existing data...', 'yellow');

    const kosDeleteResult = await db.collection('kos').deleteMany({});
    logInfo(`   Deleted ${kosDeleteResult.deletedCount} documents from 'kos' collection`);

    const calcDeleteResult = await db.collection('calculations').deleteMany({});
    logInfo(`   Deleted ${calcDeleteResult.deletedCount} documents from 'calculations' collection\n`);

    logSuccess('All existing data cleared!\n');

    // Step 2: Insert sample data
    log('🌱 Step 2: Seeding sample data...', 'yellow');

    const insertResult = await db.collection('kos').insertMany(sampleKos);
    logInfo(`   Inserted ${insertResult.insertedCount} kos records\n`);

    logSuccess('Sample data seeded successfully!\n');

    // Step 3: Display summary
    log('📊 Step 3: Database Summary', 'blue');
    log('─'.repeat(60), 'blue');

    const allKos = await db.collection('kos').find({}).toArray();

    logInfo(`Total Kos in Database: ${allKos.length}`);
    log('\nKos List:', 'cyan');
    allKos.forEach((kos, index) => {
      console.log(`   ${index + 1}. ${kos.nama}`);
      console.log(`      Harga: Rp ${kos.harga.toLocaleString('id-ID')}`);
      console.log(`      Jarak: ${kos.jarak} km`);
      console.log(`      Skor: Fasilitas=${kos.fasilitas}, Keamanan=${kos.keamanan}, Kebersihan=${kos.kebersihan}`);
      console.log('');
    });

    log('─'.repeat(60), 'blue');
    log('\n✨ Database reset completed successfully!\n', 'green');

    logInfo('You can now access the application at: http://localhost:3000');
    logInfo('API endpoint to test: curl http://localhost:3000/api/kos\n');
  } catch (error) {
    logError('\nError occurred during database reset:');
    console.error(error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      logInfo('MongoDB connection closed.\n');
    }
  }
}

// Konfirmasi sebelum reset (jika ada argument --force, skip konfirmasi)
const hasForceFlag = process.argv.includes('--force') || process.argv.includes('-f');

if (!hasForceFlag) {
  logWarning('\n⚠️  WARNING: This will DELETE ALL data in the database!');
  logInfo('To proceed without confirmation, use: node scripts/reset-db.js --force\n');

  // Ask for confirmation
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readline.question('Are you sure you want to continue? (yes/no): ', (answer) => {
    readline.close();

    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      resetDatabase();
    } else {
      logInfo('\nDatabase reset cancelled.');
      process.exit(0);
    }
  });
} else {
  // Run immediately with --force flag
  resetDatabase();
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  logError('\nUnhandled rejection:');
  console.error(error);
  process.exit(1);
});
