// backend/routes/connections.js

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { parse } = require('json2csv');

const USERS_CSV = path.join(__dirname, '../Users.csv');
const CONNECTIONS_CSV = path.join(__dirname, '../connections.csv');

// Helper: Get user by ID
function getUserById(id) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(USERS_CSV)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        const user = results.find((u) => u.id === id);
        resolve(user);
      })
      .on('error', reject);
  });
}

// POST: Add connection with names
router.post('/', async (req, res) => {
  const { fromUserId, toUserId } = req.body;

  try {
    const fromUser = await getUserById(fromUserId);
    const toUser = await getUserById(toUserId);

    if (!fromUser || !toUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newConnection = {
      fromUserId,
      fromUserName: fromUser.name,
      toUserId,
      toUserName: toUser.name,
    };

    const csvLine = `${newConnection.fromUserId},${newConnection.fromUserName},${newConnection.toUserId},${newConnection.toUserName}\n`;
    fs.appendFileSync(CONNECTIONS_CSV, csvLine);

    res.status(201).json({ message: 'Connection added', newConnection });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add connection', details: err.message });
  }
});

// GET: Read all connections
router.get('/', (req, res) => {
  const results = [];
  fs.createReadStream(CONNECTIONS_CSV)
    .pipe(csv(['fromUserId', 'fromUserName', 'toUserId', 'toUserName']))
    .on('data', (data) => results.push(data))
    .on('end', () => {
      res.json(results);
    })
    .on('error', (err) => {
      res.status(500).json({ error: 'Failed to read connections' });
    });
});

module.exports = router;
