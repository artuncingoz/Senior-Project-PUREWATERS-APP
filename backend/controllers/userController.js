//controllers/userController.js
const bcrypt = require('bcrypt');
const admin = require('firebase-admin');
const { firestore } = require('../config/firebase');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');  // For generating random passwords
const dotenv = require('dotenv');
dotenv.config();

const nodemailer = require('nodemailer');

// Sendinblue SMTP configurations
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Initialize Firebase Admin SDK (if not already initialized)
if (!admin.apps.length) {
    admin.initializeApp();
}
// ------------------- USER CONTROLLERS -------------------

// Add or update user role in Firebase
const setUserRole = async (uid, role) => {
    try {
        // Set custom claims for the user
        await admin.auth().setCustomUserClaims(uid, { role: role });
        console.log(`Role ${role} added to user ${uid}`);
    } catch (error) {
        console.error('Error setting custom claims:', error);
        throw new Error('Failed to set user role');
    }
};

// Register a new user
const addUser = async ({ name, surname, email, password, country }) => {
    try {
        const userRef = firestore.collection('users').doc(email);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
            throw new Error('User already exists');
        }

        // Create the user in Firebase Authentication
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
        });

        // Hash the password before storing
        const hashedPassword = await bcrypt.hash(password, 10);

        await setUserRole(userRecord.uid, 'common');
        await userRef.set({
            name,
            surname,
            email,
            password: hashedPassword,
            userId: userRecord.uid, // Store the Firebase UID
            role: 'common', // Set default role as 'common'
            country,
            createdAt: new Date(),
            updatedAt: new Date(),
            profilePictureUrl: null,
        });

        console.log(`User created: ${email}, User ID: ${userRecord.uid}`);
        return { userId: userRecord.uid };

    } catch (error) {
        throw new Error(`Error creating user: ${error.message}`);
    }
};

const loginUser = async (token) => {
    try {
        // Verify the Firebase token sent from the frontend
        const decodedToken = await getAuth().verifyIdToken(token);
        const uid = decodedToken.uid;

        // Check if the user exists in Firestore
        const userRef = firestore.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            throw new Error("User not found in Firestore.");
        }

        const userData = userDoc.data();

        console.log(userData)

        // Return the user data and JWT token
        return {
            name: userData.name,
            surname: userData.surname,
            email: userData.email,
            role: userData.role,
        };
    } catch (error) {
        throw new Error(`Error during login: ${error.message}`);
    }
};

/*
// controller to send password reset email and update the password
const sendPasswordResetEmail = async (res, email) => {
    try {
        // Verify that the user exists in Firestore
        const userSnapshot = await firestore.collection('users').where('email', '==', email).get();

        if (userSnapshot.empty) {
            console.error(`No user found with email: ${email}`);
            return res.status(404).json({ error: "User not found with this email address." });
        }

        console.log(`User found: ${email}`);

        // Send password reset email using Firebase Authentication
        const resetLink = await admin.auth().generatePasswordResetLink(email);

        console.log(`Password reset link generated: ${resetLink}`);

        const mailOptions = {
            from: process.env.SENDER_EMAIL, // Replace with your verified email
            to: email,
            subject: 'Password Reset Request',
            text: `You requested a password reset. Use the link below to reset your password:\n\n${resetLink}`,
            html: `<p>You requested a password reset. Use the link below to reset your password:</p><a href="${resetLink}">Reset Password</a>`,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${email}`);

        // Respond with a success message
        return res.status(200).json({
            message: `Password reset email has been sent to ${email}. Please check your inbox to reset your password.`,
        });
    } catch (error) {
        console.error("Error during password reset:", error);

        // Provide specific error messages if available
        if (error.code === 'auth/missing-email') {
            return res.status(400).json({ error: "Email is required." });
        } else if (error.code === 'auth/invalid-email') {
            return res.status(400).json({ error: "The email address is invalid." });
        } else if (error.code === 'auth/user-not-found') {
            return res.status(404).json({ error: "No user found with this email address." });
        }

        return res.status(500).json({ error: "Failed to send password reset email. Please try again later." });
    }
};
*/

// Delete user and their posts from Cloud storage (including from Firebase Auth)
const deleteUser = async (req, res) => {

    if (!userDoc.exists) {
        throw new Error('User not found');
    }
    const userRef = firestore.collection('users').doc(req.userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        return res.status(404).json({ message: 'User not found' });
    }

    const userData = userDoc.data();
    const userId = userData.userId;
    const profilePictureUrl = userData.profilePictureUrl;

    // Delete the profile picture from Cloud Storage (if exists)
    if (profilePictureUrl) {
        const bucket = admin.storage().bucket(); // Initialize Cloud Storage bucket
        const fileName = profilePictureUrl.split('/').pop(); // Extract the file name
        const file = bucket.file(`profile_pictures/${fileName}`); // Specify the path to the profile picture file

        // Delete the profile picture from Cloud Storage
        try {
            await file.delete();
            console.log(`Deleted profile picture: ${profilePictureUrl}`);
        } catch (err) {
            console.error('Error deleting profile picture from Cloud Storage:', err);
        }
    }

    // Delete all posts associated with the user
    const postSnapshot = await firestore.collection('posts').where('userId', '==', userId).get();

    if (!postSnapshot.empty) {

        postSnapshot.forEach(async (doc) => {
            const postData = doc.data();

            // Check if there are any photo URLs to delete
            const photoUrls = postData.photos; // Array of photo URLs
            if (!photoUrls || photoUrls.length === 0) {
                console.log('No photos found for this post. Skipping photo deletion.');
            } else {
                // Delete each photo from Cloud Storage
                const bucket = admin.storage().bucket();
                for (const photoUrl of photoUrls) {
                    try {
                        const fileName = photoUrl.split('/').pop(); // Get the file name from the URL
                        const file = bucket.file(`posts/${fileName}`); // Specify the path to the file in Cloud Storage
                        await file.delete();
                        console.log('Photo deleted from Cloud Storage:', fileName);
                    } catch (err) {
                        console.error('Error deleting photo from Cloud Storage:', err);
                    }
                }
            }

            // Proceed to delete the post
            await postRef.delete();
        });
    }

    // Delete the user from Firebase Auth
    await admin.auth().deleteUser(req.userId);

    // Finally, delete the user document from Firestore
    await userRef.delete();

    console.log(`User with email: ${req.userData.email} and their posts deleted successfully.`);
};

// Admin deletes a user by their email
const deleteUserByEmail = async (email) => {
    try {
        // Fetch the user document based on the email
        const usersSnapshot = await firestore.collection('users').where('email', '==', email).get();

        if (usersSnapshot.empty) {
            throw new Error('User not found');
        }

        const userDoc = usersSnapshot.docs[0];
        const userData = userDoc.data();
        const userId = userDoc.id;
        const profilePictureUrl = userData.profilePictureUrl; // Get profile picture URL

        console.log(`Deleting user with ID: ${userId} and email: ${email}`);

        // Initialize Cloud Storage bucket
        const bucket = admin.storage().bucket();

        // Delete the profile picture (if exists)
        if (profilePictureUrl) {
            try {
                const fileName = profilePictureUrl.split('/').pop(); // Extract file name from URL
                const file = bucket.file(`profile_pictures/${fileName}`);
                await file.delete();
                console.log(`Deleted profile picture: ${profilePictureUrl}`);
            } catch (err) {
                console.error('Error deleting profile picture from Cloud Storage:', err);
            }
        }

        // Fetch and delete all posts associated with the user
        const postSnapshot = await firestore.collection('posts').where('userId', '==', userId).get();

        if (!postSnapshot.empty) {
            postSnapshot.forEach(async (postDoc) => {
                const postData = postDoc.data();
                const photos = postData.photos || [];

                // Delete all photos in the 'photos' array
                for (const photoUrl of photos) {
                    try {
                        const photoName = photoUrl.split('/').pop(); // Extract file name from URL
                        const photoFile = bucket.file(`posts/${photoName}`);
                        await photoFile.delete();
                        console.log(`Deleted photo: ${photoUrl}`);
                    } catch (err) {
                        console.error(`Error deleting photo from Cloud Storage: ${photoUrl}`, err);
                    }
                }

                // Delete the post document
                await postDoc.ref.delete();
                console.log(`Deleted post with ID: ${postDoc.id}`);
            });
        }

        // Delete the user from Firebase Authentication
        try {
            await admin.auth().deleteUser(userId);
            console.log(`Deleted user from Firebase Auth with ID: ${userId}`);
        } catch (err) {
            console.error('Error deleting user from Firebase Auth:', err);
        }

        // Delete the user document from Firestore
        await userDoc.ref.delete();
        console.log(`Deleted user document from Firestore with ID: ${userId}`);

        console.log(`User with email: ${email} has been successfully deleted.`);
    } catch (error) {
        console.error('Error deleting user by email:', error.message);
        throw error;
    }
};

// Get user notifications by order asc
const getUserNotificationsAsc = async (userId, sortOrder) => {
    const notificationsRef = firestore.collection('notifications').where('userId', '==', userId);

    // Order the notifications by createdAt
    const snapshot = await notificationsRef.orderBy('createdAt', sortOrder === 'asc' ? 'asc' : 'desc').get();
    const notifications = [];

    snapshot.forEach(doc => {
        notifications.push({ id: doc.id, ...doc.data() });
    });

    return notifications;
};

// Mark a specific notification as read
const markNotificationAsRead = async (notificationId) => {
    try {
        const notificationRef = firestore.collection('notifications').doc(notificationId);
        const notificationDoc = await notificationRef.get();

        if (!notificationDoc.exists) {
            throw new Error('Notification not found.');
        }

        await notificationRef.update({ read: true });
        return `Notification ${notificationId} marked as read.`;
    } catch (error) {
        throw new Error(`Error marking notification as read: ${error.message}`);
    }
};

// Mark all notifications as read for a specific user
const markAllNotificationsAsRead = async (userId) => {
    try {
        const notificationsRef = firestore.collection('notifications').where('userId', '==', userId);
        const snapshot = await notificationsRef.get();
        const batch = firestore.batch(); // Use batch for updating

        // Iterate through each document in the query snapshot
        snapshot.forEach(doc => {
            const notificationRef = firestore.collection('notifications').doc(doc.id); // Get document reference
            batch.update(notificationRef, { read: true }); // Update the read field for each document
        });

        // Commit the batch to apply the changes
        await batch.commit();
        return 'All notifications marked as read.';
    } catch (error) {
        throw new Error(`Error marking notifications as read: ${error.message}`);
    }
};

// Function to get user information
const getUserInfo = async (req, res) => {
    const userId = req.userId;

    try {
        // Fetch user data from Firestore using userid
        const userRef = firestore.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userData = userDoc.data();

        // Exclude the password from the response
        const { password, ...userInfo } = userData;

        return res.status(200).json(userInfo); // Send user information
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// Update password method
const updateUserPassword = async (userId, newPassword) => {
    const userRef = firestore.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        throw new Error('User not found.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    try {
        await userRef.update({
            password: hashedPassword,
            updatedAt: new Date(), // Add updatedAt when updating password
        });
        console.log(`Password for ${userId} updated successfully.`);
    } catch (error) {
        console.error('Error updating password:', error);
        throw new Error('Failed to update password.');
    }
};

// Update user details (name, surname, and optionally email)
const updateUserInfo = async (id, { name, surname, newEmail }) => {
    const userRef = firestore.collection('users').doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        throw new Error('User not found.');
    }

    console.log(newEmail);
    // Build update data dynamically
    const updateData = {
        name,
        surname,
        updatedAt: new Date(), // Always update `updatedAt`
        ...(newEmail && { email: newEmail }) // Add email if provided and different
    };

    try {
        await userRef.update(updateData);
        console.log(`User info for ${email} updated successfully.`);
    } catch (error) {
        console.error('Error updating user info:', error);
        throw new Error('Failed to update user info.');
    }
};

// Get all users' information (for admin only)
const getAllUsersInfo = async () => {
    try {
        // Reference to the 'users' collection in Firestore
        const usersRef = firestore.collection('users');
        const snapshot = await usersRef.where('role', '==', 'common').get(); // Filter users by "common" role

        // Check if the collection contains users
        if (snapshot.empty) {
            throw new Error('No users found with the role "common".');
        }

        const users = [];
        snapshot.forEach(doc => {
            const userData = doc.data();
            users.push({ id: doc.id, ...userData });
        });

        return users;
    } catch (error) {
        throw new Error(`Error fetching common users: ${error.message}`);
    }
};

// Controller to check if there are any unread notifications for the user
const hasUnreadNotifications = async (userId) => {
    try {
        // Reference to the notifications collection where the userId matches and read is false
        const notificationsRef = firestore.collection('notifications')
            .where('userId', '==', userId)
            .where('read', '==', false);

        // Get the snapshot of unread notifications
        const snapshot = await notificationsRef.get();

        // If there are unread notifications, return true
        if (!snapshot.empty) {
            return true; // There are unread notifications
        }

        // If no unread notifications found, return false
        return false;
    } catch (error) {
        throw new Error(`Error checking unread notifications: ${error.message}`);
    }
};

const uploadProfilePicture = async (userId, photo) => {
    try {
        const userRef = firestore.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            throw new Error('User not found.');
        }

        // Get the user's existing profile picture URL from Firestore (if any)
        const userData = userDoc.data();
        const existingPhotoUrl = userData.profilePictureUrl;

        // If there is an existing photo, delete it from Firebase Storage
        if (existingPhotoUrl) {
            const bucket = admin.storage().bucket();
            const fileName = existingPhotoUrl.split('/').pop();
            const file = bucket.file(`profile-pictures/${fileName}`);
            await file.delete().catch(err => {
                console.error('Error deleting old profile picture:', err);
            });
        }

        // Upload the new photo to Firebase Storage
        const bucket = admin.storage().bucket();
        const blob = bucket.file(`profile-pictures/${Date.now()}_${photo.originalname}`);
        const blobStream = blob.createWriteStream({
            resumable: false,
            contentType: photo.mimetype,
        });

        // Return a promise for the file upload
        return new Promise((resolve, reject) => {
            blobStream.on('error', (error) => {
                console.error('Error uploading profile picture:', error);
                reject('Unable to upload profile picture.');
            });

            blobStream.on('finish', async () => {
                // Get the public URL of the uploaded image
                const photoUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

                // Set the file as publicly readable
                await blob.makePublic();

                // Update the user's profile document with the new photo URL
                try {
                    await userRef.update({
                        profilePictureUrl: photoUrl,
                        updatedAt: new Date(),
                    });

                    resolve({ profilePictureUrl: photoUrl });
                } catch (error) {
                    reject('Error updating user document with photo URL.');
                }
            });

            // Pass the photo buffer to upload
            blobStream.end(photo.buffer);
        });
    } catch (error) {
        throw new Error(`Error uploading profile picture: ${error.message}`);
    }
};

// Delete notification by its ID
const deleteNotificationById = async (notifId) => {
    const notificationRef = firestore.collection('notifications').doc(notifId);
    const notificationDoc = await notificationRef.get();

    if (!notificationDoc.exists) {
        throw new Error('Notification not found2');
    }

    // Delete the notification from Firestore
    await notificationRef.delete();
    console.log(`Notification with ID ${notifId} deleted successfully.`);
    return { message: `Notification with ID ${notifId} deleted successfully.` };
};

// Controller to delete all notifications by the current user
const deleteAllNotifications = async (userId) => {
    try {
        // Fetch all notifications for the user
        const notificationsSnapshot = await firestore.collection('notifications')
            .where('userId', '==', userId)
            .get();

        // If there are no notifications for this user
        if (notificationsSnapshot.empty) {
            throw new Error('No notifications found for this user.');
        }

        // Delete each notification
        const batch = firestore.batch(); // Use batch for efficient deletion

        notificationsSnapshot.forEach(doc => {
            const notificationRef = firestore.collection('notifications').doc(doc.id);
            batch.delete(notificationRef); // Queue the delete operation for the notification
        });

        // Commit the batch delete operation
        await batch.commit();
        return { message: 'All notifications deleted successfully.' };

    } catch (error) {
        throw new Error(`Error deleting notifications: ${error.message}`);
    }
};

module.exports = {
    addUser,
    loginUser,
    deleteUser,
    deleteUserByEmail,
    getUserNotificationsAsc,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    getUserInfo,
    updateUserPassword,
    updateUserInfo,
    getAllUsersInfo,
    hasUnreadNotifications,
    uploadProfilePicture,
    deleteNotificationById,
    deleteAllNotifications,
};