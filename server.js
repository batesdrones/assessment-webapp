require('dotenv').config(); 

const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3001;

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL 
});

pool.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => {
    console.error('Could not connect to PostgreSQL:', err);
    process.exit(1); 
  });

// Multer storage configuration (adjust as needed)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Directory to store uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); 
  }
});

const upload = multer({ storage: storage }); 

app.use(cors()); 
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 

// Get all projects
app.get('/api/projects', async (req, res) => {
  try {
    const client = await pool.connect(); 
    try {
      const result = await client.query('SELECT DISTINCT project FROM Facilities');
      res.json(result.rows);
    } finally {
      client.release(); 
    }
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all facility names for a given project
app.get('/api/facilities', async (req, res) => {
  try {
    const client = await pool.connect(); 
    try {
      const { project } = req.query; 
      let query;

      if (project) {
        query = `SELECT id, facility_name FROM Facilities WHERE project = $1`;
        const values = [project];
        const result = await client.query(query, values);
        res.json(result.rows);
      } else {
        query = 'SELECT id, facility_name FROM Facilities';
        const result = await client.query(query);
        res.json(result.rows);
      }
    } finally {
      client.release(); 
    }
  } catch (error) {
    console.error('Error fetching facilities:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get facility details by ID
app.get('/api/facilities/:id', async (req, res) => {
  try {
    const client = await pool.connect(); 
    try {
      const { id } = req.params;
      const result = await client.query('SELECT * FROM Facilities WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Facility not found' });
      }
      res.json(result.rows[0]); 
    } finally {
      client.release(); 
    }
  } catch (error) {
    console.error('Error fetching facility details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new assessment (with file upload)
app.post('/api/assessments', upload.single('document'), async (req, res) => { 
  try {
    const client = await pool.connect(); 
    try {
      const { 
        facility_id, 
        question1_speed, 
        question2_reliability, 
        question3_support, 
        question4_cost, 
        question5_sufficient, 
        question6_future_needs, 
        question7_limitations, 
        question8_improvements 
      } = req.body;

      const documentPath = req.file ? req.file.path : null; // Get the path of the uploaded file

      const result = await client.query(
        `INSERT INTO Assessments (facility_id, question1_speed, question2_reliability, question3_support, 
                                question4_cost, question5_sufficient, question6_future_needs, 
                                question7_limitations, question8_improvements, document_path) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`, 
        [facility_id, question1_speed, question2_reliability, question3_support, 
         question4_cost, question5_sufficient, question6_future_needs, 
         question7_limitations, question8_improvements, documentPath]
      );

      res.status(201).json(result.rows[0]); 
    } finally {
      client.release(); 
    }
  } catch (error) {
    console.error('Error creating assessment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.use(express.static('public')); 

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});