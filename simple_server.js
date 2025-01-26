require('dotenv').config(); 


const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 3001;

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL 
});

app.get('/api/organizations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Organizations'); 
    res.json(result.rows); 
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/facility-types', async (req, res) => {
  try {
    const userId = req.headers.authorization; // Assuming user ID is passed in Authorization header
    const result = await pool.query('SELECT DISTINCT facility_type FROM Facilities');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching facility types:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT 1'); 
    res.send('Connected to PostgreSQL!'); 
  } catch (error) {
    console.error('Error connecting to PostgreSQL:', error);
    res.status(500).send('Error connecting to database.');
  }
});

pool.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => {
    console.error('Could not connect to PostgreSQL:', err);
    process.exit(1); 
  });

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});