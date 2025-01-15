require('dotenv').config();
const mongoose = require('mongoose');
const Agent = require('../models/Agent');

async function createAgent() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Create a new agent
        const newAgent = new Agent({
            name: 'Demo Agent',
            email: 'demo@example.com',
            password: 'demo123',
            extension: '1002',
            status: 'available',
            role: 'agent',
            skills: ['sales', 'support']
        });

        await newAgent.save();
        console.log('Agent created successfully');
        console.log('Login credentials:');
        console.log('Email: demo@example.com');
        console.log('Password: demo123');

    } catch (error) {
        console.error('Error creating agent:', error);
    } finally {
        await mongoose.disconnect();
    }
}

createAgent();
