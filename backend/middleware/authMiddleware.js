const admin = require('firebase-admin');
const { firestore } = require('../config/firebase');  // Adjust this to your actual path

// Verify the Firebase ID token
const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];

        if (!token) {
            return res.status(400).json({ message: 'Token is required' });
        }

        // Verify the Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(token);

        const userId = decodedToken.uid;

        // Fetch the user data from Firestore
        const userRef = firestore.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userData = userDoc.data(); // Get user data from Firestore
        req.userId = userId;
        req.userData = userData;  // Store user data in req
        req.token = token;  // Store the token in req

        next();  // Proceed to the next middleware or route handler
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return res.status(400).json({ message: 'Token verification failed: ' + error.message });
    }
};

module.exports = { verifyToken };
