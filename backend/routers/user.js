// routers/user.js
const express = require('express');
const multer = require('multer');
const { addUser, deleteUser, getAllUsersInfo, deleteUserByEmail, deleteAllNotifications,
    deleteNotificationById, getUserNotificationsAsc, markAllNotificationsAsRead, markNotificationAsRead, getUserInfo, updateUserInfo,
    updateUserPassword, hasUnreadNotifications, uploadProfilePicture } = require('../controllers/userController');
const { check, validationResult } = require('express-validator');
const { verifyToken } = require('../middleware/authMiddleware');
const { isAdmin, isOwner } = require('../middleware/roleMiddlemalware');
const { getCodes } = require('country-list');

const router = express.Router();

// Set up multer for file handling (in-memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage }).single('profilePicture');

// Get list of all valid country codes
const validCountries = getCodes();

// Function to validate if the country is valid using country-list
const isValidCountry = (country) => {
    return validCountries.includes(country.toUpperCase()); // Checks if country code is valid in the array
};

// Register user route
router.post('/register', [
    check('name').notEmpty().withMessage('Name is required'),
    check('surname').notEmpty().withMessage('Surname is required'),
    check('email').isEmail().withMessage('Invalid email format'),
    check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    check('country').notEmpty().withMessage('Country is required')
], async (req, res) => {

    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { country } = req.body;

    // Validate if the country is valid using country-list
    if (!isValidCountry(country)) {
        return res.status(400).json({ message: 'Invalid country' });
    }

    try {
        const userData = await addUser(req.body);
        res.status(201).json(userData);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Login user route
router.post('/login', verifyToken, async (req, res) => {
    try {
        // Verify the token and fetch user data
        const userData = req.userData;
        const token = req.token;

        // Return the user data and token
        res.status(200).json({ ...userData, token });
    } catch (error) {
        console.error('Login Error:', error.message);  // Log the error for debugging
        res.status(400).json({ message: error.message });
    }
});


// Route to delete the user's own account
router.delete('/delete', verifyToken, async (req, res) => {
    try {

        await deleteUser(req, res);

        res.status(200).send('User and their posts deleted successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Admin route to delete a user by email
router.delete('/admin/delete/:email', verifyToken, isAdmin, async (req, res) => {
    try {
        const { email } = req.params;
        await deleteUserByEmail(email);
        res.status(200).send(`User with email ${email} deleted successfully.`);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Controller to get notifications
router.get('/notifications/:sortOrder', verifyToken, async (req, res) => {
    try {
        const { sortOrder } = req.params;

        // Validate sortOrder parameter
        const validSortOrders = ['asc', 'desc'];
        if (sortOrder && !validSortOrders.includes(sortOrder)) {
            return res.status(400).json({ message: 'Invalid sortOrder. It must be "asc" or "desc".' });
        }

        // Default to 'desc' if sortOrder is not provided
        const order = sortOrder || 'desc';

        const notifications = await getUserNotificationsAsc(req.userId, order);
        res.status(200).json(notifications);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Route to mark a specific notification as read
router.put('/notifications/:id/read', verifyToken, async (req, res) => {
    const notificationId = req.params.id;

    try {
        const message = await markNotificationAsRead(notificationId);
        res.status(200).send(message);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Route to mark all notifications as read
router.put('/notifications/read-all', verifyToken, async (req, res) => {
    const userId = req.userId;

    try {
        const message = await markAllNotificationsAsRead(userId);
        res.status(200).send(message);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Route to update user password
router.put('/update/password', verifyToken, async (req, res) => {
    try {
        const { newPassword } = req.body;
        const userId = req.userId;

        if (!newPassword) {
            return res.status(400).json({ message: 'New password is required.' });
        }

        await updateUserPassword(userId, newPassword);
        res.status(200).send('Password updated successfully.');
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Route to update user info (name, surname, email)
router.put('/update/info', verifyToken, async (req, res) => {
    try {
        const { name, surname, newEmail } = req.body;

        // Ensure name and surname are provided
        if (!name || !surname) {
            return res.status(400).json({ message: 'Name and surname are required.' });
        }

        console.log(req.userData.email);
        console.log(req.userId);

        await updateUserInfo(req.userId, { name, surname, newEmail });
        res.status(200).send('User information updated successfully.');
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Route to get all users info (admin only)
router.get('/all', verifyToken, async (req, res) => {
    try {
        const users = await getAllUsersInfo();
        res.status(200).json(users);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Route to check if the user has unread notifications
router.get('/hasUnread', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        // Call the controller to check for unread notifications
        const hasUnread = await hasUnreadNotifications(userId);

        // Return the result (true or false)
        res.status(200).json({ hasUnread });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Route to get user information
router.get('/info', verifyToken, getUserInfo);

// Route to upload profile picture
router.post('/uploadProfilePicture', verifyToken, upload, async (req, res) => {
    try {
        const userId = req.userId;
        const photo = req.file;

        if (!photo) {
            return res.status(400).json({ message: 'Profile picture is required.' });
        }

        const result = await uploadProfilePicture(userId, photo);

        // Send back the URL of the uploaded profile picture
        res.status(200).json({
            message: 'Profile picture uploaded successfully!',
            profilePictureUrl: result.profilePictureUrl,
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Route to delete a notification by its notifId
router.delete('/notifications/:notifId', verifyToken, async (req, res) => {
    const { notifId } = req.params;

    try {
        const response = await deleteNotificationById(notifId);
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Route to delete all notifications for the current user
router.delete('/deleteAllnotifications', verifyToken, async (req, res) => {
    const userId = req.userId;

    try {
        const result = await deleteAllNotifications(userId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
