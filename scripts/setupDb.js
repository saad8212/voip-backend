require('dotenv').config();
const mongoose = require('mongoose');
const Agent = require('../models/Agent');

async function setupDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Create a test agent
        const testAgent = new Agent({
            name: 'Test Agent',
            email: 'test@example.com',
            password: 'password123',
            extension: '1001',
            status: 'available',
            role: 'agent',
            skills: ['sales', 'support']
        });

        await testAgent.save();
        console.log('Test agent created successfully');

        console.log('Database setup completed');
    } catch (error) {
        console.error('Error setting up database:', error);
    } finally {
        await mongoose.disconnect();
    }
}

setupDatabase();
