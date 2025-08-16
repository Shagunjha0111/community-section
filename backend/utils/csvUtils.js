const fs = require('fs');
const path = require('path');
const USERS_CSV = path.join(__dirname, '../Users.csv');
const CONNECTIONS_CSV = path.join(__dirname, '../connections.csv');
const REQUESTS_CSV = path.join(__dirname, '../connection_requests.csv');

function readCSV(filePath) {
    const data = fs.readFileSync(filePath, 'utf-8').trim().split('\n').slice(1);
    return data.map(row => row.split(','));
}

function writeCSV(filePath, rows, headers) {
    const csvContent = [headers.join(',')].concat(rows.map(row => row.join(','))).join('\n');
    fs.writeFileSync(filePath, csvContent);
}

module.exports = {
    readCSV,
    writeCSV,
    USERS_CSV,
    CONNECTIONS_CSV,
    REQUESTS_CSV
};