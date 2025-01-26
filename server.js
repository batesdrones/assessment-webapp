require('dotenv').config(); 

// Server.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3001;

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL 
});

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.static('public')); // Serve static files (e.g., images)

// Get all organizations
app.get('/api/organizations', async (req, res) => {
  try {
    const userId = req.headers.authorization; // Assuming user ID is passed in Authorization header
    const result = await pool.query('SELECT * FROM Organizations WHERE user_id = $1', [userId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all distinct facility types
app.get('/api/facility-types', async (req, res) => {
  try {
    const userId = req.headers.authorization; // Assuming user ID is passed in Authorization header
    const result = await pool.query('SELECT DISTINCT facility_type FROM Facilities WHERE organization_id IN (SELECT id FROM Organizations WHERE user_id = $1)', [userId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching facility types:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all distinct projects
app.get('/api/projects', async (req, res) => {
  try {
    const userId = req.headers.authorization; // Assuming user ID is passed in Authorization header
    const result = await pool.query('SELECT DISTINCT project FROM Organizations WHERE user_id = $1', [userId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or update organization and facility data
app.post('/api/assessments', upload.single('document'), async (req, res) => {
  try {
    const { 
      organizationName, 
      project, 
      facilityType, 
      streetAddress, 
      status, 
      internetType, 
      ispName, 
      contractExpiration, 
      subscribedSpeed, 
      monthly_internet_cost, 
      monthly_voice_cost, 
      monthly_other_service_cost,
      question1_speed, 
      question2_reliability, 
      question3_support, 
      question4_cost,
      question5_sufficient, 
      question6_future_needs, 
      question7_limitations, 
      question8_improvements 
    } = req.body;

    const userId = req.headers.authorization; // Assuming user ID is passed in Authorization header

    // Basic input validation
    if (!organizationName) {
      return res.status(400).json({ error: 'Organization Name is required' });
    }
    if (!project) {
      return res.status(400).json({ error: 'Project is required' });
    }
    if (!facilityType) {
      return res.status(400).json({ error: 'Facility Type is required' });
    }
    // ... add more input validations for other fields as needed

    const documentUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Check if organization exists
    const checkOrgQuery = 'SELECT id FROM Organizations WHERE organization_name = $1 AND user_id = $2';
    const checkOrgResult = await pool.query(checkOrgQuery, [organizationName, userId]);

    let organizationId;
    if (checkOrgResult.rows.length === 0) {
      // Insert new organization
      const insertOrgQuery = 'INSERT INTO Organizations (organization_name, project, user_id) VALUES ($1, $2, $3) RETURNING id';
      const insertOrgResult = await pool.query(insertOrgQuery, [organizationName, project, userId]);
      organizationId = insertOrgResult.rows[0].id;
    } else {
      organizationId = checkOrgResult.rows[0].id;
    }

    // Update or insert facility data (no changes to this part)
    // ... (rest of the code for facility data handling remains the same)

    // Insert assessment data (with all questions)
    const insertAssessmentQuery = `
      INSERT INTO Assessments (organization_id, 
                                question1_speed, 
                                question2_reliability, 
                                question3_support, 
                                question4_cost,
                                question5_sufficient, 
                                question6_future_needs, 
                                question7_limitations, 
                                question8_improvements,
                                monthly_internet_cost,
                                monthly_voice_cost,
                                monthly_other_service_cost,
                                document_url 
                             ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *;
    `;
    const insertAssessmentValues = [
      organizationId,
      question1_speed, 
      question2_reliability, 
      question3_support, 
      question4_cost,
      question5_sufficient, 
      question6_future_needs, 
      question7_limitations, 
      question8_improvements,
      monthly_internet_cost, 
      monthly_voice_cost, 
      monthly_other_service_cost,
      documentUrl 
    ];
    const assessmentResult = await pool.query(insertAssessmentQuery, insertAssessmentValues);

    res.status(201).json(assessmentResult.rows[0]); 
  } catch (error) {
    console.error('Error submitting assessment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all assessments (modify to include relevant data)
app.get('/api/assessments', async (req, res) => {
  try {
    const userId = req.headers.authorization; // Assuming user ID is passed in Authorization header
    const result = await pool.query(`
      SELECT 
        a.id, 
        o.organization_name, 
        o.project, 
        f.facility_type, 
        f.facility_address, 
        f.subscribed_speed, 
        a.question1_speed, 
        a.question2_reliability, 
        a.question3_support, 
        a.question4_cost,
        a.question5_sufficient, 
        a.question6_future_needs, 
        a.question7_limitations, 
        a.question8_improvements,
        a.monthly_internet_cost,
        a.monthly_voice_cost,
        a.monthly_other_service_cost,
        a.document_url 
      FROM 
        Assessments a
      JOIN 
        Organizations o ON a.organization_id = o.id
      JOIN 
        Facilities f ON a.organization_id = f.organization_id
      WHERE o.user_id = $1
    `, [userId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ message: 'Server error' });
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