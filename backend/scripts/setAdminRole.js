require('dotenv').config();
const admin = require('firebase-admin');
const serviceAccount = require('../config/********');
const e = require('express');

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

// Function to set admin role
const setAdminRole = async (id) => {
    try {
        const userRef = admin.firestore().collection('users').doc(id);
        const userDoc = await userRef.get();

        const userData = userDoc.data();

        if (!userDoc.exists) {
            throw new Error('User not found.');
        }

        // Update the role in Firestore
        await userRef.update({ role: 'admin' });

        // Update Firebase Authentication custom claims
        const userRecord = await admin.auth().getUserByEmail(userData.email);
        await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'admin' });

        console.log(`Admin role granted to user: ${userData.email}`);
    } catch (error) {
        console.error('Error setting admin role:', error.message);
    }
};

// Get the email from command line arguments such as admin@purewaters.com "node setAdminRole.js lWqheQyrDsVHrjNMBGWlQb81Hzk2"
if (email) {
    setAdminRole(email);
} else {
    console.log('Please provide an email address as a command line argument.');
}
