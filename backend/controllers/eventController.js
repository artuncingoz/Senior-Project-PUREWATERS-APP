//controllers/eventController.js
const admin = require('firebase-admin');
const firestore = admin.firestore();

const getApprovedEvents = async () => {
    const eventsToReturn = []; // Array to hold events that are still active
    const currentTimestamp = admin.firestore.Timestamp.now(); // Get current timestamp

    // Fetch all events
    const eventSnapshot = await firestore.collection('events')
        .where('doesApprove', '==', true)
        .get();

    // Iterate over each event
    for (const eventDoc of eventSnapshot.docs) {
        const eventData = eventDoc.data();
        const eventFinish = eventData.eventFinish;

        // Check if the eventFinish is today or in the future
        if (eventFinish.seconds >= currentTimestamp.seconds) {
            // If eventFinish is today or in the future, add it to the array
            eventsToReturn.push({
                eventId: eventDoc.id,
                ...eventData
            });
        } else {
            // If eventFinish is past today, delete the event and remove eventInfo from the location
            try {
                const eventId = eventDoc.id;
                const locationRef = firestore.collection('locations').doc(eventData.locationId);

                // Delete the event
                await eventDoc.ref.delete();
                console.log(`Deleted event with ID: ${eventId}`);

                // Remove the eventInfo from the location
                await locationRef.update({
                    eventInfo: admin.firestore.FieldValue.delete() // Delete eventInfo field
                });
                console.log(`Removed eventInfo from location with ID: ${eventData.locationId}`);
            } catch (error) {
                console.error("Error deleting event or updating location:", error);
            }
        }
    }

    // Return all events that are still active
    return eventsToReturn;
};

// Get all events with doesApprove = false
const getUnapprovedEvents = async () => {
    const eventsSnapshot = await firestore.collection('events')
        .where('doesApprove', '==', false)
        .get();

    const unapprovedEvents = [];
    eventsSnapshot.forEach(doc => {
        unapprovedEvents.push({ eventId: doc.id, ...doc.data() });
    });

    return unapprovedEvents;
};

// Approve an event and notify all users
const approveEvent = async (eventId, newComment) => {
    const eventRef = firestore.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
        throw new Error('Event not found');
    }

    const eventData = eventDoc.data();
    const { eventStart, eventFinish, locationId } = eventData;

    // Update event to set doesApprove to true
    await eventRef.update({ doesApprove: true });

    // Fetch the location name
    const locationRef = firestore.collection('locations').doc(locationId);
    const locationDoc = await locationRef.get();
    if (!locationDoc.exists) {
        throw new Error('Location not found');
    }

    const locationName = locationDoc.data().name;

    // Update the location entity's eventInfo field with the new event data
    await locationRef.update({
        eventStart: eventStart,
        eventFinish: eventFinish,
        eventId: eventRef.id,
        eventComment: newComment,
    });

    await eventRef.update({
        comment: newComment,
    });
    // Send notifications to all users
    const usersSnapshot = await firestore.collection('users').get();
    for (const userDoc of usersSnapshot.docs) {
        const notificationRef = firestore.collection('notifications').doc();
        await notificationRef.set({
            userId: userDoc.id,
            doesEvent: true,
            message: `The event at location "${locationName}" has started and will last until ${eventFinish.toDate()}.`,
            createdAt: new Date(),
            read: false,
        });
    }

    console.log(`Event with ID: ${eventId} approved and notifications sent to all users.`);
};

const rejectEvent = async (eventId) => {
    const eventRef = firestore.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
        throw new Error('Event not found');
    }

    // Get the locationId from the event document
    const locationId = eventDoc.data().locationId;

    // Delete the event document from the "events" collection
    await eventRef.delete();
    console.log(`Event with ID: ${eventId} has been successfully deleted.`);

    // Check if the location exists
    const locationRef = firestore.collection('locations').doc(locationId);
    const locationDoc = await locationRef.get();

    if (locationDoc.exists) {
        const locationData = locationDoc.data();

        // Check if the eventInfo field exists
        if (locationData.eventId) {

            // Correctly delete the eventInfo field from the location document
            try {
                // Deleting the entire eventInfo map
                await locationRef.update({
                    eventStart: admin.firestore.FieldValue.delete(),
                    eventFinish: admin.firestore.FieldValue.delete(),
                    eventId: admin.firestore.FieldValue.delete(),
                    eventComment: admin.firestore.FieldValue.delete(),
                });

                console.log(`EventInfo for location with ID: ${locationId} has been deleted.`);
            } catch (error) {
                console.error('Error deleting eventInfo:', error);
            }
        } else {
            console.log('No eventInfo found in location document.');
        }
    } else {
        console.error('Location not found');
    }
};





module.exports = {
    getApprovedEvents,
    getUnapprovedEvents,
    approveEvent,
    rejectEvent,
};
