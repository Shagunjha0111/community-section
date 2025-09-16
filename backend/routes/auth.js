const express = require('express');
const fs = require('fs');
const path = require('path');
const { USERS_CSV, readCSV, writeCSV } = require('../utils/csvUtils');
const router = express.Router();

router.post('/signup', (req, res) => {
    const { name, email, password, phone, location, interests, type, achievements } = req.body;
    const users = readCSV(USERS_CSV);
    const id = users.length + 2;
    const newUser = [id, name, email, password, phone, location, interests, type, achievements];
    users.push(newUser);
    writeCSV(USERS_CSV, users, ['id','Name','email','password','phone','Location','Interest/expertise','Type','Achievements']);
    res.json({ message: 'Signup successful' });
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const users = readCSV(USERS_CSV);
    const found = users.find(user => user[2] === email && user[3] === password);
    if (found) {
        const userObj = {
            id: String(found[0]),
            name: found[1],
            email: found[2],
            password: found[3],
            phone: found[4],
            location: found[5],
            interests: found[6],
            type: found[7],
            achievements: found[8]
        };
        res.json({ success: true, user: userObj });
    }
    else res.status(401).json({ success: false, message: 'Invalid credentials' });
});

module.exports = router;