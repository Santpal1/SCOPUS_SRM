const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
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
});


// Default admin credentials
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'Admin';

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Check if the user entered default admin credentials
  if (username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
    return res.json({ success: true, message: 'Login successful (Default Admin)' });
  } 
  

  // Otherwise, check in the database
  const query = 'SELECT * FROM agents WHERE username = ? AND password = ?';

  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error('Error during login:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }

    if (results.length > 0) {
      res.json({ success: true, message: 'Login successful' });
    } else {
      res.json({ success: false, message: 'Invalid credentials' });
    }
  });
});


// Get publication count per month based on selected timeframe
// Get publication count per month based on selected timeframe
app.get("/api/publications", (req, res) => {
  const { timeframe } = req.query;

  let startDate = "";
  if (timeframe === "6m") {
    startDate = "DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 6 MONTH), '%Y-%m')";
  } else if (timeframe === "1y") {
    startDate = "DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 YEAR), '%Y-%m')";
  } else if (timeframe === "2y") {
    startDate = "DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 YEAR), '%Y-%m')";
  } else {
    return res.status(400).json({ error: "Invalid timeframe" });
  }

  const query = `
  SELECT 
    DATE_FORMAT(date, '%Y-%m') AS month, 
    COUNT(*) AS count 
  FROM papers 
  WHERE DATE_FORMAT(date, '%Y-%m') BETWEEN ${startDate} AND DATE_FORMAT(CURDATE(), '%Y-%m')
    AND date <= CURDATE()
  GROUP BY month
  ORDER BY month ASC;
`;


  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching publication data:", err);
      return res.status(500).json({ error: "Failed to fetch data" });
    }
    res.json(results);
  });
});


// Get top author in a given timeframe
app.get('/api/top-author', (req, res) => {
  const { timeframe } = req.query;

  let startDate = '';
  let endDate = 'CURDATE()';

  if (timeframe === '6m') {
    startDate = 'DATE_SUB(NOW(), INTERVAL 6 MONTH)';
  } else if (timeframe === '1y') {
    startDate = 'DATE_SUB(NOW(), INTERVAL 12 MONTH)';
  } else if (timeframe === '2y') {
    startDate = 'DATE_SUB(NOW(), INTERVAL 24 MONTH)';
  } else {
    return res.status(400).json({ error: 'Invalid timeframe. Use 6m, 1y, or 2y.' });
  }

  const query = `
    WITH author_counts AS (
      SELECT 
        u.scopus_id, 
        u.name, 
        COUNT(p.scopus_id) AS timeframe_docs
      FROM users u
      JOIN papers p ON u.scopus_id = p.scopus_id 
        AND p.date >= ${startDate}
        AND p.date <= ${endDate}
      GROUP BY u.scopus_id, u.name
    ),
    max_count AS (
      SELECT MAX(timeframe_docs) AS max_pub FROM author_counts
    )
    SELECT * 
    FROM author_counts
    WHERE timeframe_docs = (SELECT max_pub FROM max_count);
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching top authors:', err);
      return res.status(500).json({ error: 'Failed to fetch top authors' });
    }

    res.json(results); // return all top authors
    console.log(results);
  });
});


// API routes
// 1. Get all faculty members
app.get('/api/faculty', (req, res) => {
  const query = 'SELECT scopus_id, name, docs_count, access FROM users';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching faculty data:', err);
      return res.status(500).json({ error: 'Failed to fetch faculty data' });
    }
    
    console.log(`Returned ${results.length} faculty records`);
    //res.json(results);
  });
});

// Get faculty paper count based on selected timeframe
// Get faculty paper count based on selected timeframe
app.get('/api/faculty/papers', (req, res) => {
  const { timeframe } = req.query;

  let startDate = '';
  let endDate = 'CURDATE()';

  const currentYear = new Date().getFullYear();

  if (timeframe === '1m') {
    startDate = 'DATE_SUB(NOW(), INTERVAL 1 MONTH)';
  } else if (timeframe === '6m') {
    startDate = 'DATE_SUB(NOW(), INTERVAL 6 MONTH)';
  } else if (timeframe === '1y') {
    startDate = `'${currentYear - 1}-01-01'`; // January 1st of the current year
  } else if (timeframe === '2y') {
    startDate = `'${currentYear - 2}-01-01'`; // January 1st of the previous year
  } else {
    return res.status(400).json({ error: 'Invalid timeframe' });
  }

  const query = `
    SELECT 
      u.scopus_id, 
      u.name, 
      (SELECT COUNT(*) FROM papers WHERE scopus_id = u.scopus_id) AS total_docs,
      COUNT(p.scopus_id) AS timeframe_docs
    FROM users u
    LEFT JOIN papers p ON u.scopus_id = p.scopus_id 
      AND p.date >= ${startDate}
      AND p.date <= ${endDate}
    GROUP BY u.scopus_id, u.name;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching faculty paper data:', err);
      return res.status(500).json({ error: 'Failed to fetch data' });
    }
    res.json(results);
  });
});


// 2. Get faculty who uploaded fewer than 4 papers in the past year
app.get('/api/faculty/low-papers', (req, res) => {
  const lastYear = new Date().getFullYear() - 1;
  const startDate = `'${lastYear}-01-01'`; // January 1st of last year
  const endDate = 'CURDATE()';

  const query = `
    SELECT 
      u.scopus_id, 
      u.name, 
      COUNT(p.scopus_id) AS timeframe_docs
    FROM users u
    LEFT JOIN papers p 
      ON u.scopus_id = p.scopus_id 
      AND p.date >= ${startDate}
      AND p.date <= ${endDate}
    GROUP BY u.scopus_id, u.name
    HAVING timeframe_docs < 4;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching faculty with low paper count:', err);
      return res.status(500).json({ error: 'Failed to fetch data' });
    }
    res.json(results);
  });
});



// 3. Get faculty details by Scopus ID
app.get('/api/faculty/:scopusId', (req, res) => {
  const scopusId = req.params.scopusId;
  console.log(`Fetching details for Scopus ID: ${scopusId}`);

  const facultyQuery = 'SELECT * FROM users WHERE scopus_id = ?';
  
  db.query(facultyQuery, [scopusId], (err, facultyResults) => {
    if (err) {
      console.error('Error fetching faculty details:', err);
      return res.status(500).json({ error: 'Failed to fetch faculty details', message: err.message });
    }
    
    console.log(`Faculty query returned ${facultyResults.length} results`);
    
    if (facultyResults.length === 0) {
      return res.status(404).json({ error: 'Faculty not found' });
    }

    const papersQuery = 'SELECT * FROM papers WHERE scopus_id = ?';
    
    db.query(papersQuery, [scopusId], (err, papersResults) => {
      if (err) {
        console.error('Error fetching faculty papers:', err);
        return res.status(500).json({ error: 'Failed to fetch faculty papers', message: err.message });
      }
      
      console.log(`Papers query returned ${papersResults.length} results`);
      
      const response = {
        faculty: facultyResults[0],
        papers: papersResults
      };
      
      console.log(`Sending response for Scopus ID ${scopusId}`);
      res.json(response);
    });
  });
});

// MANUAL SCOPUS SYNC
app.post('/api/sync', (req, res) => {
  exec('python sync.py', (error, stdout, stderr) => {
    if (error) {
      console.error("Manual sync error: ${stderr}");
      return res.status(500).json({ success: false, message: 'Sync failed', error: stderr });
    }
    console.log("Manual sync output: ${stdout}");
    res.json({ success: true, message: 'Scopus data synchronized successfully.', output: stdout });
  });
});

// SCHEDULED MONTHLY SCOPUS SYNC
// cron.schedule('0 0 1 * *', () => {
//   console.log('Running scheduled monthly Scopus sync...');
//   exec('python3 scopus_sync.py', (error, stdout, stderr) => {
//     if (error) {
//       console.error("Scheduled sync error: ${stderr}");
//     } else {
//       console.log("Scheduled sync success:\n${stdout}");
//     }
//   });
// });

// Test API route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});



// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
