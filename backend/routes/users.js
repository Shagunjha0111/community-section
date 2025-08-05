const express = require('express');
const { USERS_CSV, readCSV } = require('../utils/csvUtils');
const router = express.Router();

router.get('/', (req, res) => {
    const users = readCSV(USERS_CSV).map(user => ({
        id: user[0],
        name: user[1],
        email: user[2],
        phone: user[4],
        location: user[5],
        interests: user[6],
        type: user[7],
        achievements: user[8]
    }));
    res.json(users);
});

module.exports = router;