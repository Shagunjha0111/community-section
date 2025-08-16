const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const { USERS_CSV } = require('../utils/csvUtils');
const router = express.Router();

function normalizeUser(row, index) {
  const id = row.id || row.ID || row.Id || row.userId || String(index + 1);
  const name = row.Name || row.name || row.fullName || row.id || '';
  const email = row.email || row.Email || row.mail || row.eMail || '';
  const password = row.password || row.Password || row.pass || '';
  const phone = row.phone || row.Phone || row.mobile || '';
  const location = row.Location || row.location || row.City || '';
  const interests = row['Interest/expertise'] || row.Interests || row.interests || '';
  const type = row.Type || row.type || '';
  const achievements = row.Achievements || row.achievements || '';
  return { id, name, email, password, phone, location, interests, type, achievements };
}

router.get('/', (req, res) => {
  const users = [];
  fs.createReadStream(USERS_CSV)
    .pipe(csv())
    .on('data', (data) => users.push(data))
    .on('end', () => {
      const normalized = users.map((row, idx) => normalizeUser(row, idx));
      res.json(normalized);
    })
    .on('error', () => res.status(500).json({ message: 'Failed to read users' }));
});

module.exports = router;