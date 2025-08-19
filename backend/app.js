//app.js
const express = require('express');
const morgan = require('morgan');
const admin = require('firebase-admin'); // Import Firebase Admin SDK
const userRouter = require('./routers/user');
const postRouter = require('./routers/post');
const locationRouter = require('./routers/location');
const chatbotRouter = require('./routers/chatbot');
const eventRouter = require('./routers/event');

const dotenv = require('dotenv');
dotenv.config();



// Check if Firebase Admin is already initialized
if (!admin.apps.length) {
    // Initialize Firebase Admin SDK
    admin.initializeApp({
        credential: admin.credential.cert(require('./config/****************.json')),
        databaseURL: process.env.FIREBASE_DATABASE_URL
    });
} else {
    admin.app();
}

const app = express();

// Middleware
app.use(express.json()); // Middleware to parse JSON bodies
app.use(morgan('dev')); // Logging middleware

// Routes
app.use('/api/user', userRouter);
app.use('/api/post', postRouter);
app.use('/api/locations', locationRouter);
app.use('/api/chatbot', chatbotRouter);
app.use('/api/event', eventRouter);




const PORT = process.env.PORT || 4848;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
