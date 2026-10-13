const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Grain = require('../models/Grain');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

async function backupAndInspect() {
  const mongoUri = process.env.MONGODB_URI;
  console.log('Connecting to MongoDB Atlas at arogyabhog...');
  await mongoose.connect(mongoUri);
  console.log('Connected!');

  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // 1. Fetch current data
  const grains = await Grain.find({});
  const products = await Product.find({});
  const orders = await Order.find({});
  const users = await User.find({});

  console.log(`Found: ${grains.length} grains, ${products.length} products, ${orders.length} orders, ${users.length} users.`);

  // 2. Save backup
  const backupData = {
    timestamp,
    grains,
    products,
    ordersCount: orders.length,
    usersCount: users.length
  };

  const backupPath = path.join(backupDir, `catalog_backup_${timestamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
  console.log(`Backup saved to ${backupPath}`);

  // 3. Print product names and grain names
  console.log('\nCurrent Products:');
  products.forEach(p => console.log(`- ${p.name} (Category: ${p.category})`));

  console.log('\nCurrent Grains:');
  grains.forEach(g => console.log(`- ${g.name} (${g.code}): ₹${g.pricePerKg}/kg, Stock: ${g.inStockKg}kg`));

  await mongoose.disconnect();
}

backupAndInspect().catch(console.error);
