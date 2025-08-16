const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const connectionRoutes = require('./routes/connections');
const requestRoutes = require('./routes/connectionRequests');
const simpleConnRoutes = require('./routes/simpleConn');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/conn', simpleConnRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));