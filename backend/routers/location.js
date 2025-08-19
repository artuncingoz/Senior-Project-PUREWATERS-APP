//routers/location.js
const express = require('express');
const { addLocation, deleteLocation, getLocations, getLocationById, getLocationPosts } = require('../controllers/locationController');
const { verifyToken } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddlemalware');
const { check, validationResult } = require('express-validator');

const multer = require('multer'); // multer for handling file uploads

// Set up multer storage and file handling
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage });

const router = express.Router();

// Admins can create a location
router.post('/create', verifyToken, isAdmin, upload.single('thumbnail'), [
    check('name').notEmpty().withMessage('Locations name is required.'),
    check('coordinate').notEmpty().withMessage('Coordinate is required.'),
    check('comment').notEmpty().withMessage('Comment is required.'),
], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        console.log(req.file); // Debug Log the uploaded file for debugging

        // Check if thumbnail was uploaded
        if (!req.file) {
            return res.status(400).json({ message: 'Thumbnail is required.' });
        }

        const locationData = {
            name: req.body.name,
            coordinate: req.body.coordinate,
            comment: req.body.comment,
            thumbnail: req.file,
            rate: 0,
            cleanliness: 0,
            appearance: 0,
            wildlife: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };


        const newLocation = await addLocation(locationData);
        res.status(201).json(newLocation);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Delete a location
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const locationId = req.params.id;
        await deleteLocation(locationId);
        res.status(200).send('Location deleted successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Get all locations
router.get('/', verifyToken, async (req, res) => {
    try {
        const locations = await getLocations();
        res.status(200).json(locations);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Route to get location by locationId
router.get('/:locationId', verifyToken, async (req, res) => {
    try {
        const { locationId } = req.params;

        const location = await getLocationById(locationId);

        res.status(200).json(location);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Route to get posts for a specific locationId
router.get('/locationInfo/:locationId', verifyToken, async (req, res) => {
    const { locationId } = req.params;
    try {
        const data = await getLocationPosts(locationId);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



module.exports = router;