//routers/post.js
const express = require('express');
const { addPost, deletePostById, getPostsGroupedByLocation, unapprovePost, getAllPosts, getPostsByLocationId, getApprovedPosts, allPostsByCurrentUser, getUnapprovedPosts, approvePost, updatePost } = require('../controllers/postController');
const { check, validationResult } = require('express-validator');
const { verifyToken } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddlemalware');

const multer = require('multer'); // Import multer for handling file uploads

const router = express.Router();

// Set up multer for file handling (in-memory storage for photo uploads)
const storage = multer.memoryStorage();
const upload = multer({ storage }).array('photos', 3); // Accepts up to 3 photos

// Create a post
router.post('/create', verifyToken, upload, [
    check('title').notEmpty()
        .withMessage('Title is required.')
        .isLength({ max: 60 }).withMessage('Title must be at most 40 characters long.'),
    check('comment').notEmpty().withMessage('Comment is required.'),
    check('locationId').notEmpty().withMessage('Location ID is required.'),
    check('cleanliness').isInt({ min: 0, max: 5 }).withMessage('Cleanliness must be a number between 0 and 5.'),
    check('appearance').isInt({ min: 0, max: 5 }).withMessage('Appearance must be a number between 0 and 5.'),
    check('wildlife').isInt({ min: 0, max: 5 }).withMessage('Wildlife must be a number between 0 and 5.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Check if photos were uploaded
        if (!req.files || req.files.length < 1) {
            return res.status(400).json({ message: 'At least one photo is required.' });
        }

        const postData = {
            title: req.body.title,
            comment: req.body.comment,
            locationId: req.body.locationId,
            userId: req.userId,
            photos: req.files,
            createdAt: new Date(),
            updatedAt: new Date(),
            cleanliness: req.body.cleanliness,
            appearance: req.body.appearance,
            wildlife: req.body.wildlife,
            approved: false,  // Default to false
            doesTuned: false,  // Default to false
        };

        const newPost = await addPost(postData);
        res.status(201).json(newPost);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Get all approved posts by current user order desc or asc
router.get('/approvedByUser/:sortOrder', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { sortOrder } = req.params;
        console.log(sortOrder);

        // Validate sortOrder parameter
        const validSortOrders = ['asc', 'desc'];
        if (sortOrder && !validSortOrders.includes(sortOrder)) {
            return res.status(400).json({ message: 'Invalid sortOrder. It must be "asc" or "desc".' });
        }

        // Default to 'desc' if sortOrder is not provided
        const order = sortOrder || 'desc';
        const posts = await getApprovedPostsByCurrentUser(userId, order);
        res.status(200).json(posts);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Route to get all approved posts
router.get('/approved/:sortOrder', verifyToken, isAdmin, async (req, res) => {
    const { sortOrder } = req.params;

    // Validate sortOrder parameter
    const validSortOrders = ['asc', 'desc'];
    if (sortOrder && !validSortOrders.includes(sortOrder)) {
        return res.status(400).json({ message: 'Invalid sortOrder. It must be "asc" or "desc".' });
    }

    // Default to 'desc' if sortOrder is not provided
    const order = sortOrder || 'desc';

    try {
        const posts = await getApprovedPosts(order); // Get approved posts using the controller
        res.status(200).json(posts); // Return the approved posts as the response
    } catch (error) {
        res.status(400).send(error.message); // Send error message if something goes wrong
    }
});

// Get all posts for current user
router.get('/allPostsByCurrentUser/:sortOrder', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { sortOrder } = req.params;

        // Validate sortOrder parameter
        const validSortOrders = ['asc', 'desc'];
        if (sortOrder && !validSortOrders.includes(sortOrder)) {
            return res.status(400).json({ message: 'Invalid sortOrder. It must be "asc" or "desc".' });
        }

        // Default to 'desc' if sortOrder is not provided
        const order = sortOrder || 'desc';
        const posts = await allPostsByCurrentUser(userId, order);
        res.status(200).json(posts);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Route to get all posts (only accessible by admin)
router.get('/allposts/:sortOrder', verifyToken, isAdmin, async (req, res) => {
    const { sortOrder } = req.params;  // Get sortOrder from the query parameter

    // Validate sortOrder parameter
    const validSortOrders = ['asc', 'desc'];
    if (sortOrder && !validSortOrders.includes(sortOrder)) {
        return res.status(400).json({ message: 'Invalid sortOrder. It must be "asc" or "desc".' });
    }

    // Default to 'desc' if sortOrder is not provided
    const order = sortOrder || 'desc';

    try {
        const posts = await getAllPosts(order);
        res.status(200).json(posts);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Get all posts for a specific location by locationId
router.get('/location/:locationId/:sortOrder', verifyToken, async (req, res) => {

    try {
        const { locationId } = req.params;
        const { sortOrder } = req.params;

        // Validate sortOrder parameter
        const validSortOrders = ['asc', 'desc'];
        if (sortOrder && !validSortOrders.includes(sortOrder)) {
            return res.status(400).json({ message: 'Invalid sortOrder. It must be "asc" or "desc".' });
        }

        // Default to 'desc' if sortOrder is not provided
        const order = sortOrder || 'desc';
        const posts = await getPostsByLocationId(locationId, sortOrder);
        res.status(200).json(posts);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Route to delete a post by postId
router.delete('/:postId', verifyToken, [
    check('message').notEmpty().withMessage('message for reason is required.'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { postId } = req.params;
        const userId = req.userId;
        const userRole = req.userData.role;
        const message = req.body.message;


        await deletePostById(postId, userId, userRole, message);
        res.status(200).send(`Post ${postId} deleted successfully`);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Admin approves a specific post
router.put('/approve/:postId', verifyToken, isAdmin, async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.userId;
        await approvePost(postId, userId);
        res.status(200).send(`Post ${postId} approved successfully.`);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Admin gets all unapproved posts
router.get('/unapproved/:sortOrder', verifyToken, isAdmin, async (req, res) => {
    try {
        const { sortOrder } = req.params;

        // Validate sortOrder parameter
        const validSortOrders = ['asc', 'desc'];
        if (sortOrder && !validSortOrders.includes(sortOrder)) {
            return res.status(400).json({ message: 'Invalid sortOrder. It must be "asc" or "desc".' });
        }

        // Default to 'desc' if sortOrder is not provided
        const order = sortOrder || 'desc';
        const unapprovedPosts = await getUnapprovedPosts(order);
        res.status(200).json(unapprovedPosts);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Route to update post
router.put('/update/:postId', verifyToken, async (req, res) => {
    try {
        const { title, comment, rates } = req.body;
        const { postId } = req.params;

        if (!title || !comment || !Array.isArray(rates)) {
            return res.status(400).json({ message: 'Title, comment, and rates are required.' });
        }

        await updatePost(postId, { title, comment, rates });
        res.status(200).send('Post updated successfully.');
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Route to get posts grouped by location for the current user, sorted by createdAt
router.get('/grouped/:sortOrder', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { sortOrder } = req.params;

        // Validate sortOrder parameter
        const validSortOrders = ['asc', 'desc'];
        if (sortOrder && !validSortOrders.includes(sortOrder)) {
            return res.status(400).json({ message: 'Invalid sortOrder. It must be "asc" or "desc".' });
        }

        // Default to 'desc' if sortOrder is not provided
        const order = sortOrder || 'desc';

        const groupedPosts = await getPostsGroupedByLocation(userId, order);

        res.status(200).json(groupedPosts);

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Route to unapprove and delete a post
router.delete('/unapprove/:postId', verifyToken, isAdmin, async (req, res) => {
    const { postId } = req.params;
    const message = req.body.message;

    try {
        const result = await unapprovePost(postId, message);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
