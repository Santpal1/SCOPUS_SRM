const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'scopus.c3i42gq0gaaj.eu-north-1.rds.amazonaws.com',
    user: 'admin',
    password: 'Ca55jYuwofeCboV7FYiw',
    database: 'scopus'
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

module.exports = db;