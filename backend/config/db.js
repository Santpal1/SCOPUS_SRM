const mysql = require('mysql2');

const db = mysql.createConnection({
<<<<<<< HEAD
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'scopus',
    port: 3306
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to MySQL database');
=======
  host: 'localhost',
  user: 'root', 
  password: '', 
  database: 'scopus',
  port: 3306
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to MySQL database');
>>>>>>> 7df1d0bda94d9910207082cd8e6f29ae7991f0e6
});

module.exports = db;