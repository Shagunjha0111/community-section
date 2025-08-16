const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const { USERS_CSV, REQUESTS_CSV, CONNECTIONS_CSV } = require('../utils/csvUtils');

const router = express.Router();

function readCsvRows(filePath, headers) {
  return new Promise((resolve, reject) => {
    const rows = [];
    if (!fs.existsSync(filePath)) {
      return resolve([]);
    }
    const stream = fs.createReadStream(filePath).pipe(headers ? csv(headers) : csv());
    stream
      .on('data', (data) => rows.push(data))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

function appendCsvLine(filePath, line, headerLine) {
  const exists = fs.existsSync(filePath);
  if (!exists && headerLine) {
    fs.writeFileSync(filePath, headerLine + '\n');
  }
  fs.appendFileSync(filePath, line + '\n');
}

async function getUsers() {
  return readCsvRows(USERS_CSV);
}

async function getUserByAny(idOrName) {
  const idStr = String(idOrName).trim();
  const users = await getUsers();
  const found = users.find(u => String(u.id || u.ID || u.Id).trim() === idStr || String(u.Name || u.name).trim() === idStr);
  return found;
}

// POST /api/requests - send a request
router.post('/', async (req, res) => {
  const { fromUserId, toUserId } = req.body;
  if (!fromUserId || !toUserId) {
    return res.status(400).json({ message: 'fromUserId and toUserId are required' });
  }
  if (fromUserId === toUserId) {
    return res.status(400).json({ message: 'Cannot send request to yourself' });
  }
  try {
    // Avoid duplicates
    const existing = await readCsvRows(REQUESTS_CSV, ['fromUserId','toUserId','status','timestamp']);
    if (existing.some(r => r.fromUserId === String(fromUserId) && r.toUserId === String(toUserId) && r.status === 'pending')) {
      return res.status(200).json({ message: 'Request already pending' });
    }

    appendCsvLine(
      REQUESTS_CSV,
      `${fromUserId},${toUserId},pending,${Date.now()}`,
      'fromUserId,toUserId,status,timestamp'
    );

    return res.status(201).json({ message: 'Request sent' });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to send request' });
  }
});

// GET /api/requests - list requests for a user (incoming/outgoing) by id or name
router.get('/', async (req, res) => {
  const { userId, userName } = req.query;
  try {
    const rows = await readCsvRows(REQUESTS_CSV, ['fromUserId','toUserId','status','timestamp']);
    const targetId = String(userId || '').trim();
    const targetName = String(userName || '').trim();
    const filtered = rows.filter(r => {
      return r.fromUserId === targetId || r.toUserId === targetId || r.fromUserId === targetName || r.toUserId === targetName;
    });
    res.json(filtered);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
});

// POST /api/requests/accept - accept a request and create a connection
router.post('/accept', async (req, res) => {
  const { fromUserId, toUserId } = req.body; // toUserId is the acceptor
  if (!fromUserId || !toUserId) {
    return res.status(400).json({ message: 'fromUserId and toUserId are required' });
  }
  try {
    // Read all requests
    const rows = await readCsvRows(REQUESTS_CSV, ['fromUserId','toUserId','status','timestamp']);
    const idx = rows.findIndex(r => r.fromUserId === String(fromUserId) && r.toUserId === String(toUserId) && r.status === 'pending');
    if (idx === -1) {
      return res.status(404).json({ message: 'Pending request not found' });
    }

    // Mark accepted: rewrite file
    rows[idx].status = 'accepted';

    // Rewrite file with header
    const header = 'fromUserId,toUserId,status,timestamp';
    const content = [header].concat(rows.map(r => `${r.fromUserId},${r.toUserId},${r.status},${r.timestamp}`)).join('\n');
    fs.writeFileSync(REQUESTS_CSV, content + '\n');

    // Create a connection record with names resolved by id or name
    const [fromUser, toUser] = await Promise.all([
      getUserByAny(fromUserId),
      getUserByAny(toUserId)
    ]);
    const fromName = (fromUser && (fromUser.name || fromUser.Name)) || String(fromUserId);
    const toName = (toUser && (toUser.name || toUser.Name)) || String(toUserId);
    const connectionHeader = 'fromUserId,fromUserName,toUserId,toUserName';
    appendCsvLine(
      CONNECTIONS_CSV,
      `${fromUserId},${fromName},${toUserId},${toName}`,
      connectionHeader
    );

    return res.json({ message: 'Request accepted and connection created' });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to accept request' });
  }
});

module.exports = router; 