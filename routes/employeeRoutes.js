const express = require('express');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const multer = require('multer');
const Employee = require('../models/Employee');
const EmployeeDetails = require('../models/EmployeeDetails');

const router = express.Router();

// Signup route
const { body, validationResult } = require('express-validator');

// Signup route with input validation
router.post(
  '/signup',
  [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { email, password } = req.body;

        // Check if the email already exists in the database
        const existingEmployee = await Employee.findOne({ email });
        if (existingEmployee) {
          return res.status(400).json({ message: 'Email already exists' });
        }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const newEmployee = new Employee({ email, password: hashedPassword });

      await newEmployee.save();
      res.status(201).json(newEmployee);
    } catch (err) {
      res.status(400).json({ message: 'Error signing up', error: err });
    }
  }
);


// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the employee by email
    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res.status(404).json({ message: 'Invalid email or password' });
    }

    // Compare the provided password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, employee.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Authentication successful
    res.status(200).json({ message: 'Login successful', employee });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in', error: err });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

const empIdExists = async (empId) => {
  try {
    const employee = await EmployeeDetails.findOne({ empId });
    return employee !== null; // returns true if employee exists, false otherwise
  } catch (error) {
    throw new Error('Error checking empId availability');
  }
};

// Add a new employee details
router.post(
  '/employees',
  upload.single('photo'),
  [
    body('empId').isString().notEmpty().withMessage('Employee ID is required'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('firstName').isString().notEmpty().withMessage('First name is required'),
    body('lastName').isString().notEmpty().withMessage('Last name is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { empId, firstName, lastName, department, email, mobileNo, dob, dateOfJoining, address, salary, designation } = req.body;
      const photo = req.file ? req.file.path : null;

      if (empIdExists) {
        return res.status(400).json({ message: 'Employee ID already exists.' });
      }

      const newEmployeeDetails = new EmployeeDetails({
        empId,
        firstName,
        lastName,
        department,
        email,
        mobileNo,
        dob,
        dateOfJoining,
        photo,
        address,
        salary,
        designation,
      });
      await newEmployeeDetails.save();
      res.status(201).json(newEmployeeDetails);
    } catch (err) {
      console.error('Error adding employee:', err);
      res.status(400).json({ message: 'Error adding employee', error: err });
    }
  }
);


// Get all employees details
router.get('/employees', async (req, res) => {
  try {
    const employees = await EmployeeDetails.find();
    res.status(200).json(employees);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching employees', error: err });
  }
});

// Update an employee
router.put('/employees/:id', async (req, res) => {
  try {
    const updatedEmployee = await EmployeeDetails.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedEmployee);
  } catch (err) {
    res.status(400).json({ message: 'Error updating employee', error: err });
  }
});

// Delete an employee
router.delete('/employees/:id', async (req, res) => {
  try {
    await EmployeeDetails.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Error deleting employee', error: err });
  }
});

module.exports = router;
