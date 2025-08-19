const admin = require('firebase-admin');
const serviceAccount = require('./****************firebase-adminsdk-****************.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://****************.firebasedatabase.app", // database URL
    storageBucket: '****************-****************-****************.appspot.com',
});

const firestore = admin.firestore(); // Initialize Firestore
const bucket = admin.storage().bucket(); // Initialize Firebase Storage

module.exports = { firestore, bucket };