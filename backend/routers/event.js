//routers/event.js
const express = require('express');
const { getUnapprovedEvents, approveEvent, rejectEvent, getApprovedEvents } = require('../controllers/eventController');
const { verifyToken } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddlemalware');

// Set up multer storage and file handling
const router = express.Router();

// Approve events and delete expired ones
router.get('/approved-events', verifyToken, async (req, res) => {
    try {
        // Call the approveEvents function to handle event approval logic
        const activeEvents = await getApprovedEvents();

        // Respond with the active events
        res.status(200).json(activeEvents);
    } catch (error) {
        // Handle errors and send a response
        res.status(400).send(error.message);
    }
});

// Get all unapproved events
router.get('/unapproved-events', verifyToken, isAdmin, async (req, res) => {
    try {
        const unapprovedEvents = await getUnapprovedEvents();
        res.status(200).json(unapprovedEvents);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Approve an event by eventId
router.post('/approve/:eventId', verifyToken, isAdmin, async (req, res) => {
    const { eventId } = req.params;
    const comment = req.body.comment;
    console.log(comment);
    try {
        await approveEvent(eventId, comment); // Approve the event and send notifications
        res.status(200).send(`Event ${eventId} approved and notifications sent.`);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

router.delete('/reject-event/:eventId', async (req, res) => {
    const { eventId } = req.params;

    if (!eventId) {
        return res.status(400).json({ message: 'Event ID is required' });
    }

    try {
        await rejectEvent(eventId);
        res.status(200).json({ message: 'Event successfully deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});


module.exports = router;