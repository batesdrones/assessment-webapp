require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg'); 
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs'); 

const app = express();
const port = 3001;

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); 

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

// Get all organizations
app.get('/api/organizations', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT organization_name FROM Organizations');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get organization data by name
app.get('/api/organizations/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const result = await pool.query('SELECT * FROM Facilities WHERE organization_id = (SELECT organization_id FROM Organizations WHERE organization_name = $1)', [name]);
    res.status(200).json(result.rows[0]); 
  } catch (error) {
    console.error('Error fetching organization data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register a new user
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10); 
    await pool.query('INSERT INTO Users (user_email, password) VALUES ($1, $2)', [email, hashedPassword]);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM Users WHERE user_email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    if (await bcrypt.compare(password, user.password)) {
      // Assuming you want to store the user ID in the session 
      // (replace with your actual session management)
      req.session.userId = user.id; 
      res.status(200).json({ message: 'Login successful' });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit assessment responses
app.post('/api/assessments/submit', upload.single('document'), async (req, res) => {
  try {
    const { organization_name, ...formData } = req.body; 
    const documentUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const orgResult = await pool.query('SELECT organization_id FROM Organizations WHERE organization_name = $1', [organization_name]);
    const organization_id = orgResult.rows[0].organization_id;

    const facilityResult = await pool.query('SELECT * FROM Facilities WHERE organization_id = $1', [organization_id]);
    let facilityData = facilityResult.rows[0]; 

    if (facilityData) {
      const updateQuery = `
        UPDATE Facilities
        SET 
          facility_type = $1,
          facility_address = $2,
          facility_status = $3,
          internet_technology = $4, 
          ISP_name = $5,
          current_contract_expiration_date = $6,
          subscribed_download = $7,
          subscribed_upload = $8
        WHERE organization_id = $9`;
      const updateValues = [
        formData.facility_type,
        formData.street_address,
        formData.status,
        formData.internet_type,
        formData.isp_name,
        formData.contract_expiration,
        formData.subscribed_speed.split('/')[0],
        formData.subscribed_speed.split('/')[1]
      ];
      await pool.query(updateQuery, [...updateValues, organization_id]);
    } else {
      const insertQuery = `
        INSERT INTO Facilities (organization_id, facility_type, facility_address, facility_status, internet_technology, ISP_name, current_contract_expiration_date, subscribed_download, subscribed_upload)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
      const insertValues = [
        organization_id,
        formData.facility_type,
        formData.street_address,
        formData.status,
        formData.internet_type,
        formData.isp_name,
        formData.contract_expiration,
        formData.subscribed_speed.split('/')[0],
        formData.subscribed_speed.split('/')[1]
      ];
      await pool.query(insertQuery, insertValues);
    }

    // Assuming you have a user ID (replace with your actual user ID retrieval logic)
    const userId = 1; 

    const insertAssessmentQuery = `
      INSERT INTO Assessments (organization_id, user_id, 
                                question1_response, question2_response, question3_response 
                                -- Add other question response columns here
                              )
      VALUES ($1, $2, $3, $4, $5 
              -- Add other question response values here
             )`;
    const insertAssessmentValues = [
      organization_id, 
      userId, 
      formData.question1, 
      formData.question2, 
      formData.question3 
      // Add other question response values here
    ];
    await pool.query(insertAssessmentQuery, insertAssessmentValues);

    res.status(200).json({ message: 'Assessment submitted successfully' });
  } catch (error) {
    console.error('Error submitting assessment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

pool.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('Could not connect to PostgreSQL:', err));

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});