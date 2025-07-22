const db = require('../config/db.js');

const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'Admin';

exports.login = (req, res) => {
    const { username, password } = req.body;

    if (username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
        return res.json({ success: true, message: 'Login successful (Default Admin)' });
    }

    const query = 'SELECT * FROM agents WHERE username = ? AND password = ?';

    db.query(query, [username, password], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Server error' });

        if (results.length > 0) {
            res.json({ success: true, message: 'Login successful' });
        } else {
            res.json({ success: false, message: 'Invalid credentials' });
        }
    });
};
