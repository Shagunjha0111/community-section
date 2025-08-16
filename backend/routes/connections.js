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

    // Check if file exists, if not create with header
    if (!fs.existsSync(CONNECTIONS_CSV)) {
      const header = 'fromUserId,fromUserName,toUserId,toUserName\n';
      fs.writeFileSync(CONNECTIONS_CSV, header);
    }

    const csvLine = `${newConnection.fromUserId},${newConnection.fromUserName},${newConnection.toUserId},${newConnection.toUserName}\n`;
    fs.appendFileSync(CONNECTIONS_CSV, csvLine);

    res.status(201).json({ message: 'Connection added', newConnection });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add connection', details: err.message });
  }
});

// GET: Read all connections
router.get('/', (req, res) => {
  try {
    // Check if file exists
    if (!fs.existsSync(CONNECTIONS_CSV)) {
      return res.json([]);
    }

    const fileContent = fs.readFileSync(CONNECTIONS_CSV, 'utf8').trim();
    if (!fileContent || fileContent === 'fromUserId,fromUserName,toUserId,toUserName') {
      return res.json([]);
    }

    const results = [];
    fs.createReadStream(CONNECTIONS_CSV)
      .pipe(csv(['fromUserId', 'fromUserName', 'toUserId', 'toUserName']))
      .on('data', (data) => {
        // Ensure we have valid data with proper user names
        if (data.fromUserName && data.toUserName && 
            data.fromUserName !== 'fromUserName' && data.toUserName !== 'toUserName') {
          results.push({
            fromUserId: data.fromUserId,
            fromUserName: data.fromUserName,
            toUserId: data.toUserId,
            toUserName: data.toUserName
          });
        }
      })
      .on('end', () => {
        res.json(results);
      })
      .on('error', (err) => {
        res.status(500).json({ error: 'Failed to read connections' });
      });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read connections', details: err.message });
  }
});

// POST: Remove connection (using POST instead of DELETE for better compatibility)
router.post('/remove', (req, res) => {
  const { fromUserId, toUserId, fromUserName, toUserName } = req.body;
  
  if (!fromUserId || !toUserId) {
    return res.status(400).json({ error: 'fromUserId and toUserId are required' });
  }

  try {
    // Check if file exists and has content
    if (!fs.existsSync(CONNECTIONS_CSV)) {
      return res.status(404).json({ error: 'No connections found' });
    }

    const fileContent = fs.readFileSync(CONNECTIONS_CSV, 'utf8').trim();
    if (!fileContent || fileContent === 'fromUserId,fromUserName,toUserId,toUserName') {
      return res.status(404).json({ error: 'No connections found' });
    }

    const results = [];
    fs.createReadStream(CONNECTIONS_CSV)
      .pipe(csv(['fromUserId', 'fromUserName', 'toUserId', 'toUserName']))
      .on('data', (data) => results.push(data))
      .on('end', () => {
        // Filter out the connection to be removed
        const filteredConnections = results.filter(conn => {
          // Check both directions of the connection
          const isForwardConnection = conn.fromUserId === fromUserId && conn.toUserId === toUserId;
          const isReverseConnection = conn.fromUserId === toUserId && conn.toUserId === fromUserId;
          return !(isForwardConnection || isReverseConnection);
        });

        // Rewrite the file with the filtered connections
        const header = 'fromUserId,fromUserName,toUserId,toUserName';
        const content = [header].concat(
          filteredConnections.map(conn => 
            `${conn.fromUserId},${conn.fromUserName},${conn.toUserId},${conn.toUserName}`
          )
        ).join('\n');
        
        fs.writeFileSync(CONNECTIONS_CSV, content + '\n');
        
        res.json({ message: 'Connection removed successfully' });
      })
      .on('error', (err) => {
        res.status(500).json({ error: 'Failed to remove connection' });
      });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove connection', details: err.message });
  }
});

module.exports = router;
