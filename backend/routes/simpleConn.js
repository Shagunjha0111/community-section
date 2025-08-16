const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { USERS_CSV, CONNECTIONS_CSV } = require('../utils/csvUtils');

const router = express.Router();

const CONN1 = path.join(__dirname, '../conn1.csv');
const CONN2 = path.join(__dirname, '../conn2.csv');
const HEADER = 'fromUserId,toUserId,type,status,timestamp';

function connPath(client) {
  return String(client) === '1' ? CONN1 : CONN2;
}

function ensureFile(filePath, header) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, header + '\n');
  }
}

// Ensure both files exist at load time
ensureFile(CONN1, HEADER);
ensureFile(CONN2, HEADER);

function readConn(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    ensureFile(filePath, HEADER);
    fs.createReadStream(filePath)
      .pipe(csv(['fromUserId','toUserId','type','status','timestamp']))
      .on('data', (d) => rows.push(d))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

function writeConn(filePath, rows) {
  const content = [HEADER].concat(rows.map(r => `${r.fromUserId},${r.toUserId},${r.type},${r.status},${r.timestamp}`)).join('\n');
  fs.writeFileSync(filePath, content + '\n');
}

function appendConn(filePath, row) {
  ensureFile(filePath, HEADER);
  const line = `${row.fromUserId},${row.toUserId},${row.type},${row.status},${row.timestamp}`;
  fs.appendFileSync(filePath, line + '\n');
}

function readUsers() {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(USERS_CSV)
      .pipe(csv())
      .on('data', (d) => rows.push(d))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

function userNameByIdOrName(users, idOrName) {
  const target = String(idOrName).trim();
  
  // First try to find by exact name match
  const userByName = users.find(u => String(u.Name || u.name).trim() === target);
  if (userByName) {
    return userByName.Name || userByName.name;
  }
  
  // Then try to find by ID
  const userById = users.find(u => String(u.id || u.ID || u.Id).trim() === target);
  if (userById) {
    return userById.Name || userById.name;
  }
  
  // If not found, return the original value
  return target;
}

// GET /api/conn?client=1
router.get('/', async (req, res) => {
  const { client } = req.query;
  if (!client) return res.status(400).json({ message: 'client required (1 or 2)' });
  try {
    const rows = await readConn(connPath(client));
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Failed to read' });
  }
});

// POST /api/conn/send
router.post('/send', async (req, res) => {
  const { fromClient, toClient, fromUserId, toUserId } = req.body;
  if (!fromClient || !toClient || !fromUserId || !toUserId) {
    return res.status(400).json({ message: 'fromClient,toClient,fromUserId,toUserId required' });
  }
  const ts = Date.now();
  try {
    // Append outgoing to sender file
    appendConn(connPath(fromClient), { fromUserId, toUserId, type: 'outgoing', status: 'pending', timestamp: ts });
    // Append incoming to receiver file
    appendConn(connPath(toClient), { fromUserId, toUserId, type: 'incoming', status: 'pending', timestamp: ts });
    res.status(201).json({ message: 'Request recorded' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to send' });
  }
});

// POST /api/conn/accept
router.post('/accept', async (req, res) => {
  const { senderClient, receiverClient, fromUserId, toUserId } = req.body; // receiver accepts
  if (!senderClient || !receiverClient || !fromUserId || !toUserId) {
    return res.status(400).json({ message: 'senderClient,receiverClient,fromUserId,toUserId required' });
  }
  try {
    const senderPath = connPath(senderClient);
    const receiverPath = connPath(receiverClient);

    const [senderRows, receiverRows, users] = await Promise.all([
      readConn(senderPath),
      readConn(receiverPath),
      readUsers()
    ]);

    // Update sender file (outgoing -> accepted)
    let changed = false;
    senderRows.forEach(r => {
      if (r.fromUserId === String(fromUserId) && r.toUserId === String(toUserId) && r.type === 'outgoing' && r.status === 'pending') {
        r.status = 'accepted';
        changed = true;
      }
    });
    if (changed) writeConn(senderPath, senderRows);

    // Update receiver file (incoming -> accepted)
    changed = false;
    receiverRows.forEach(r => {
      if (r.fromUserId === String(fromUserId) && r.toUserId === String(toUserId) && r.type === 'incoming' && r.status === 'pending') {
        r.status = 'accepted';
        changed = true;
      }
    });
    if (changed) writeConn(receiverPath, receiverRows);

    // Also append to connections.csv with names
    const fromName = userNameByIdOrName(users, fromUserId);
    const toName = userNameByIdOrName(users, toUserId);
    
    console.log('Creating connection:', { fromUserId, fromName, toUserId, toName });
    
    const header = 'fromUserId,fromUserName,toUserId,toUserName';
    if (!fs.existsSync(CONNECTIONS_CSV)) fs.writeFileSync(CONNECTIONS_CSV, header + '\n');
    fs.appendFileSync(CONNECTIONS_CSV, `${fromUserId},${fromName},${toUserId},${toName}\n`);

    res.json({ message: 'Accepted' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to accept' });
  }
});

// POST /api/conn/clear?client=1
router.post('/clear', (req, res) => {
  const { client } = req.query;
  if (!client) return res.status(400).json({ message: 'client required (1 or 2)' });
  try {
    const p = connPath(client);
    fs.writeFileSync(p, HEADER + '\n');
    res.json({ message: 'Cleared' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to clear' });
  }
});

module.exports = router; 