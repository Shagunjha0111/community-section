const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const CHAT_MESSAGES_CSV = path.join(__dirname, '../chat_messages.csv');

function ensureChatCsv() {
  if (!fs.existsSync(CHAT_MESSAGES_CSV)) {
    fs.writeFileSync(CHAT_MESSAGES_CSV, 'id,fromUserId,fromUserName,toUserId,message,timestamp\n');
  }
}

// GET: Get chat history between two users
router.get('/history/:userId1/:userId2', (req, res) => {
  const { userId1, userId2 } = req.params;

  try {
    if (!fs.existsSync(CHAT_MESSAGES_CSV)) {
      return res.json([]);
    }

    const results = [];
    fs.createReadStream(CHAT_MESSAGES_CSV)
      .pipe(csv(['id', 'fromUserId', 'fromUserName', 'toUserId', 'message', 'timestamp']))
      .on('data', (data) => {
        // Filter messages between the two users (bidirectional)
        if ((data.fromUserId === userId1 && data.toUserId === userId2) ||
            (data.fromUserId === userId2 && data.toUserId === userId1)) {
          results.push({
            id: data.id,
            fromUserId: data.fromUserId,
            fromUserName: data.fromUserName,
            toUserId: data.toUserId,
            message: data.message,
            timestamp: data.timestamp
          });
        }
      })
      .on('end', () => {
        // Sort by timestamp
        results.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        res.json(results);
      })
      .on('error', (err) => {
        res.status(500).json({ error: 'Failed to read chat history' });
      });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read chat history', details: err.message });
  }
});

// GET: Get all chat conversations for a user
router.get('/conversations/:userId', (req, res) => {
  const { userId } = req.params;

  try {
    if (!fs.existsSync(CHAT_MESSAGES_CSV)) {
      return res.json([]);
    }

    const conversations = new Map(); // userId -> lastMessage

    fs.createReadStream(CHAT_MESSAGES_CSV)
      .pipe(csv(['id', 'fromUserId', 'fromUserName', 'toUserId', 'message', 'timestamp']))
      .on('data', (data) => {
        // Find conversations where user is either sender or receiver
        if (data.fromUserId === userId || data.toUserId === userId) {
          const otherUserId = data.fromUserId === userId ? data.toUserId : data.fromUserId;
          const otherUserName = data.fromUserId === userId ? data.toUserName : data.fromUserName;
          
          const existing = conversations.get(otherUserId);
          if (!existing || new Date(data.timestamp) > new Date(existing.timestamp)) {
            conversations.set(otherUserId, {
              otherUserId,
              otherUserName,
              lastMessage: data.message,
              timestamp: data.timestamp,
              unreadCount: 0 // This would need to be calculated based on read status
            });
          }
        }
      })
      .on('end', () => {
        const results = Array.from(conversations.values());
        // Sort by timestamp (most recent first)
        results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        res.json(results);
      })
      .on('error', (err) => {
        res.status(500).json({ error: 'Failed to read conversations' });
      });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read conversations', details: err.message });
  }
});

// POST: Mark messages as read
router.post('/mark-read', (req, res) => {
  const { userId, otherUserId } = req.body;

  try {
    if (!fs.existsSync(CHAT_MESSAGES_CSV)) {
      return res.json({ message: 'No messages to mark as read' });
    }

    // For now, we'll just return success
    // In a more sophisticated system, you'd update a read status field
    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark messages as read', details: err.message });
  }
});

// POST: Send a message (HTTP fallback when websockets are unavailable)
router.post('/send', (req, res) => {
  try {
    const { fromUserId, fromUserName, toUserId, message } = req.body || {};
    if (!fromUserId || !toUserId || !message) {
      return res.status(400).json({ error: 'fromUserId, toUserId and message are required' });
    }

    ensureChatCsv();
    const msg = {
      id: Date.now().toString(),
      fromUserId: String(fromUserId),
      fromUserName: fromUserName || '',
      toUserId: String(toUserId),
      message: String(message),
      timestamp: new Date().toISOString()
    };
    const line = `${msg.id},${msg.fromUserId},${msg.fromUserName},${msg.toUserId},${msg.message},${msg.timestamp}`;
    fs.appendFileSync(CHAT_MESSAGES_CSV, line + '\n');
    return res.status(201).json(msg);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
