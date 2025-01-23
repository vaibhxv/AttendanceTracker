const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-ashascikhj-key';

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ message: 'Access denied' });

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid token' });
    }
};

// Register route
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        const user = new User({ name, email, password, role });
        await user.save();

        // Generate token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role, name: user.name },
            JWT_SECRET | 'my-jwt-secret-key-yoohoo'
        );

        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Verify password
        const validPassword = await user.comparePassword(password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        // Generate token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role, name: user.name },
            JWT_SECRET | 'my-jwt-secret-key-yoohoo'
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get current user route
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = { router, authenticateToken };