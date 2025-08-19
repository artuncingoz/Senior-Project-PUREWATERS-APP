//controllers/locationController.js
const admin = require('firebase-admin');
const { firestore } = require('../config/firebase');


// ------------------- LOCATION CONTROLLERS -------------------

const addLocation = async ({ name, coordinate, thumbnail, comment, rate, cleanliness, appearance, wildlife, eventInfo }) => {

    // Check if the locationId exists in the database
    const locationRef = firestore.collection('locations').doc(name);
    const locationDoc = await locationRef.get();

    if (locationDoc.exists) {
        throw new Error('Invalid location name. The specified location name exists.');
    }

    // Upload the thumbnail to Firebase Storage
    const bucket = admin.storage().bucket();
    const blob = bucket.file(`locations/${Date.now()}_${thumbnail.originalname}`);
    const blobStream = blob.createWriteStream({
        resumable: false,
        contentType: thumbnail.mimetype,
    });

    return new Promise((resolve, reject) => {
        blobStream.on('error', (error) => {
            console.error(`Unable to upload image, something went wrong: ${error}`);
            reject(`Unable to upload image, something went wrong: ${error}`);
        });

        blobStream.on('finish', async () => {

            const url = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

            try {
                // Set the file to be publicly accessible
                await blob.makePublic();  // This makes the file publicly accessible

                // Store the location data in Firestore with the public URL
                const locationRef = firestore.collection('locations').doc();
                await locationRef.set({
                    name,
                    coordinate,
                    comment,
                    thumbnail: url,  // Store the publicly accessible URL
                    locationId: locationRef.id,
                    rate,
                    cleanliness,
                    appearance,
                    wildlife,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                resolve({ locationId: locationRef.id, thumbnail: url });
            } catch (error) {
                console.error('Error making the file public or creating location in Firestore:', error);
                reject('Failed to create location in Firestore.');
            }
        });

        // Pass the file buffer for uploading
        blobStream.end(thumbnail.buffer);
    });
};

// Get all locations
const getLocations = async () => {
    const locations = [];
    const locationSnapshot = await firestore.collection('locations').get();

    // Iterate over all locations
    for (const doc of locationSnapshot.docs) {
        const locationData = doc.data();
        const locationId = doc.id;

        // Check if eventInfo exists
        if (locationData.eventInfo) {
            const { eventFinish, eventId } = locationData.eventInfo;

            // Check if eventFinish exists and if the event is finished (current time >= eventFinish)
            if (eventFinish) {
                const currentTimestamp = admin.firestore.Timestamp.now(); // Get current timestamp

                // Compare current time with eventFinish using the seconds property
                if (currentTimestamp.seconds >= eventFinish.seconds) {
                    // If current time is greater than or equal to eventFinish, delete the event and remove eventInfo
                    try {
                        // Delete the event from the "events" collection
                        const eventRef = firestore.collection('events').doc(eventId);
                        await eventRef.delete();
                        console.log(`Deleted event with ID: ${eventId}`);

                        // Remove the eventInfo from the location
                        await firestore.collection('locations').doc(locationId).update({
                            eventInfo: admin.firestore.FieldValue.delete(), // Delete eventInfo field
                        });
                        console.log(`Removed eventInfo from location with ID: ${locationId}`);
                    } catch (error) {
                        console.error("Error deleting event or updating location:", error);
                    }
                }
            }
        }

        // Add the location data to the locations array
        locations.push({ id: locationId, ...locationData });
    }

    return locations;
};

// Delete a location by its ID
const deleteLocation = async (locationId) => {
    const locationRef = firestore.collection('locations').doc(locationId);
    const locationDoc = await locationRef.get();

    if (!locationDoc.exists) {
        throw new Error('Location not found');
    }

    const locationData = locationDoc.data();
    const thumbnailUrl = locationData.thumbnail;

    // Delete the thumbnail from Cloud Storage
    const bucket = admin.storage().bucket();
    const fileName = thumbnailUrl.split('/').pop(); // Get the file name from the URL
    const file = bucket.file(`locations/${fileName}`); // Specify the path to the file in Cloud Storage

    await file.delete().catch(err => {
        console.error('Error deleting thumbnail from Cloud Storage:', err);
    });

    // Delete posts associated with this location
    const postsSnapshot = await firestore.collection('posts')
        .where('locationId', '==', locationId)
        .get();

    if (!postsSnapshot.empty) {
        for (const postDoc of postsSnapshot.docs) {
            const postData = postDoc.data();
            const photoUrls = postData.photos;

            // Delete each photo associated with the post from Cloud Storage
            if (photoUrls && photoUrls.length > 0) {
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

            // Delete the post from Firestore
            await postDoc.ref.delete();
            console.log(`Post ${postDoc.id} deleted successfully.`);
        }
    }

    // Delete the location from Firestore
    await locationRef.delete();
    console.log(`Location ${locationId} and all related posts deleted successfully.`);
};

// Get location by locationId
const getLocationById = async (locationId) => {
    try {
        // Reference to the location document in Firestore by locationId
        const locationRef = firestore.collection('locations').doc(locationId);
        const locationDoc = await locationRef.get();

        if (!locationDoc.exists) {
            throw new Error('Location not found');
        }

        // Return the location data
        return { id: locationDoc.id, ...locationDoc.data() };
    } catch (error) {
        throw new Error(`Error fetching location: ${error.message}`);
    }
};

// Get location info with posts for a specific locationId
const getLocationPosts = async (locationId) => {
    try {

        const locationRef = firestore.collection('locations').doc(locationId);
        const locationDoc = await locationRef.get();

        if (!locationDoc.exists) {
            throw new Error(`Location with ID ${locationId} not found.`);
        }

        const postSnapshot = await firestore.collection('posts').where('approved', '==', true).where('locationId', '==', locationId).get();

        const locationInfo = locationDoc.data();

        // If no posts are found, just return the location info without any posts
        if (postSnapshot.empty) {
            return [{ locationInfo, posts: [] }];
        }

        const posts = [];

        // Iterate through posts for this location and gather data
        for (const postDoc of postSnapshot.docs) {
            const postData = postDoc.data();

            // Fetch the user data for this post (using userId from the post)
            const userSnapshot = firestore.collection('users').doc(postData.userId);
            const userDoc = await userSnapshot.get();

            if (userSnapshot.empty) {
                throw new Error(`User with ID ${postData.userId}, and post id: ${postData.post}not found.`);
            }

            const userData = userDoc.data();

            // Combine post data and user info (name, surname)
            const postWithUserInfo = {
                postId: postDoc.id,
                title: postData.title,
                comment: postData.comment,
                photos: postData.photos,
                rates: postData.rates,
                userInfo: {
                    userName: userData.name,
                    userSurname: userData.surname
                }
            };

            posts.push(postWithUserInfo);
        }

        // Return the data as an array of objects
        return [{ locationInfo, posts }];

    } catch (error) {
        throw new Error(`Error fetching location posts: ${error.message}`);
    }
};

module.exports = {
    addLocation,
    getLocations,
    deleteLocation,
    getLocationById,
    getLocationPosts,
};