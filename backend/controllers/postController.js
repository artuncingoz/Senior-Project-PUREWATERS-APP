//controllers/postController.js
const admin = require('firebase-admin');
const { firestore } = require('../config/firebase');

// ------------------- POST CONTROLLERS -------------------

// Create a new post with validated rates
const addPost = async ({ title, comment, locationId, userId, photos, cleanliness, wildlife, appearance, approved, doesTuned }) => {
    // Validate if cleanliness, wildlife, and appearance are provided
    if (cleanliness === undefined || wildlife === undefined || appearance === undefined) {
        throw new Error('Rates must be provided as cleanliness, wildlife, and appearance.');
    }

    // Create a rates array
    const rates = [
        { factor: 'Cleanliness', value: cleanliness },
        { factor: 'Appearance', value: appearance },
        { factor: 'Wildlife', value: wildlife },
    ];

    // Validate the rates array
    rates.forEach(rate => {
        if (rate.value < 0 || rate.value > 5) {
            throw new Error(`${rate.factor} rate must be between 0 and 5.`);
        }
    });

    // Check if the locationId exists in the locations collection
    const locationRef = firestore.collection('locations').doc(locationId);
    const locationDoc = await locationRef.get();

    if (!locationDoc.exists) {
        throw new Error('Location not found');
    }

    if (!photos || photos.length < 1 || photos.length > 3) {
        throw new Error('You must upload at least one and at most three photos.');
    }

    const photoUrls = [];
    const bucket = admin.storage().bucket();

    // Upload each photo to Firebase Storage
    for (const photo of photos) {
        const blob = bucket.file(`posts/${Date.now()}_${photo.originalname}`);
        const blobStream = blob.createWriteStream({
            resumable: false,
            contentType: photo.mimetype,
        });

        await new Promise((resolve, reject) => {
            blobStream.on('error', (error) => {
                console.error('Error uploading image:', error);
                reject('Unable to upload image, something went wrong.');
            });

            blobStream.on('finish', () => {
                const url = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

                // Make the file publicly accessible (optional, remove if privacy is needed)
                blob.makePublic().then(() => {
                    console.log('File is now public:', url);
                    photoUrls.push(url);  // Store the URL
                    resolve();
                }).catch((err) => {
                    console.error('Error making the file public:', err);
                    reject('Error making the file public');
                });
            });

            // Pass the file buffer for uploading
            blobStream.end(photo.buffer);
        });
    }

    // After all photos are uploaded, create the post in Firestore
    try {
        const postRef = firestore.collection('posts').doc();
        await postRef.set({
            title,
            comment,
            locationId,
            userId,
            photos: photoUrls,  // Store the photo URLs in Firestore
            rates,  // Store the rates array as a single field
            approved: approved || false,  // Default to false if not provided
            doesTuned: doesTuned || false,  // Default to false if not provided
            createdAt: new Date(),
            updatedAt: new Date(),
            postId: postRef.id,
        });



        return { postId: postRef.id, photos: photoUrls, rates };
    } catch (error) {
        console.error('Error creating post in Firestore:', error);
        throw new Error('Failed to create post in Firestore.');
    }
};

async function calculateLocationRate(locationId) {
    // Retrieve all posts for this location
    const postSnapshot = await firestore.collection('posts')
        .where('locationId', '==', locationId)
        .get();

    if (postSnapshot.empty) {
        throw new Error('No posts found for this location');
    }

    let totalcleanliness = 0;
    let totalappearance = 0;
    let totalwildlife = 0;
    let postCount = 0;

    // Loop through all posts to calculate the sum of each rate
    postSnapshot.forEach((doc) => {
        const postData = doc.data();
        totalcleanliness += Number(postData.rates.find(rate => rate.factor === 'Cleanliness').value);
        totalappearance += Number(postData.rates.find(rate => rate.factor === 'Appearance').value);
        totalwildlife += Number(postData.rates.find(rate => rate.factor === 'Wildlife').value);

        postCount++;
    });

    // Calculate the average rates for cleanliness, appearance, and wildlife
    const averagecleanliness = totalcleanliness / postCount;
    const averageappearance = totalappearance / postCount;
    const averagewildlife = totalwildlife / postCount;

    // Calculate the overall average rate for the location
    const overallRate = (averagecleanliness + averageappearance + averagewildlife) / 3;

    // Update the location's rate in Firestore
    const locationRef = firestore.collection('locations').doc(locationId);
    const locationDoc = await locationRef.get(); // Get location data

    if (!locationDoc.exists) {
        throw new Error(`Location with ID ${locationId} not found`);
    }

    const locationData = locationDoc.data(); // Get location data
    await locationRef.update({
        rate: overallRate,
        cleanliness: averagecleanliness,
        appearance: averageappearance,
        wildlife: averagewildlife,
    });

    // If the average cleanliness is below 2, send notifications to users
    if (overallRate < 2) {

        if (locationData.eventInfo && locationData.eventInfo.eventId) {
            // If eventId exists in eventInfo, don't create a new event
            console.log(`Event already exists for location: ${locationData.name}. No new event will be created.`);
        } else {

            const usersSnapshot = await firestore.collection('users').get(); // Get all users

            // Iterate over each user and send a notification
            for (const userDoc of usersSnapshot.docs) {
                const notificationRef = firestore.collection('notifications').doc();

                await notificationRef.set({
                    userId: userDoc.id,
                    locationId: locationId,
                    doesEvent: false,
                    message: `In location "${locationData.name}" the average cleanliness rate is below 2`,
                    createdAt: new Date(),
                    read: false,
                });
            }

            // Create a new event entity in the Firestore database
            const eventRef = firestore.collection('events').doc(); // Create a new document in the "events" collection
            const eventStart = admin.firestore.Timestamp.now(); // Firestore Timestamp for the event start
            const eventFinish = admin.firestore.Timestamp.fromDate(new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)); // 7 days later
            const doesApprove = false; // Initially set to false

            await eventRef.set({
                locationName: locationData.name,
                locationId: locationId,
                eventStart: eventStart,
                eventFinish: eventFinish,
                doesApprove: doesApprove,
                comment: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
    }
    console.log(`Location rate calculated: ${overallRate}\n ${locationRef}`);
    return overallRate;
};

// Get all posts for a specific location by locationId
const getPostsByLocationId = async (locationId, sortOrder) => {
    const posts = [];
    const postSnapshot = await firestore.collection('posts')
        .where('locationId', '==', locationId)
        .where('approved', '==', true) // Filter by approved posts
        .orderBy('createdAt', sortOrder === 'asc' ? 'asc' : 'desc') // Order by createdAt (descending)
        .get();

    postSnapshot.forEach(doc => posts.push({ id: doc.id, ...doc.data() }));

    return posts;
};

const deletePostById = async (postId, userId, userRole, deleteMessage) => {
    const postRef = firestore.collection('posts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
        throw new Error('Post not found');
    }

    const postData = postDoc.data();
    const postOwnerId = postData.userId; // Get the userId of the post owner

    // Allow deletion if the user is the post owner or an admin
    if (userId !== postOwnerId && userRole !== 'admin') {
        throw new Error('You do not have permission to delete this post.');
    }

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

    if (userRole == 'admin') {
        const notificationRef = firestore.collection('notifications').doc();
        await notificationRef.set({
            userId: postOwnerId,
            postId,
            doesEvent: false,
            message: `Your "${postData.title}" post has been deleted. For the reason "${deleteMessage}"`,
            createdAt: new Date(),
            read: false,
        });
    }

    await calculateLocationRate(postData.locationId);

    console.log(`Post ${postId} deleted successfully.`);
};

// Admin approves a specific post
const approvePost = async (postId) => {
    const postRef = firestore.collection('posts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
        throw new Error('Post not found.');
    }

    const postData = postDoc.data();

    // Log the userId to verify
    const userId = postData.userId;

    // Use await to get the user document
    const userRef = await firestore.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Approve the post
    await postRef.update({ approved: true });

    const notificationRef = firestore.collection('notifications').doc();
    await notificationRef.set({
        userId,
        postId,
        doesEvent: false,
        message: `Your "${postData.title}" post has been approved.`,
        createdAt: new Date(),
        read: false,
    });

    await calculateLocationRate(postData.locationId);

    console.log(`Post ${postId} approved successfully and notification sent.`);
};

// Get all approved posts by current user
const getApprovedPostsByCurrentUser = async (userId, sortOrder) => {
    const posts = [];
    const postSnapshot = await firestore.collection('posts')
        .where('approved', '==', true) // Filter by approved posts
        .where('userId', '==', userId)
        .orderBy('createdAt', sortOrder === 'asc' ? 'asc' : 'desc') // Order by createdAt (descending)
        .get();

    postSnapshot.forEach(doc => posts.push({ id: doc.id, ...doc.data() }));

    return posts;
};

// Get all approved posts for all existing users
const getApprovedPosts = async (sortOrder) => {
    const approvedPosts = [];

    // Fetch all approved posts
    const postSnapshot = await firestore.collection('posts')
        .where('approved', '==', true) // Filter by approved posts
        .orderBy('createdAt', sortOrder === 'asc' ? 'asc' : 'desc') // Order by createdAt (ascending or descending)
        .get();

    // Iterate over each post
    for (const postDoc of postSnapshot.docs) {
        const postData = postDoc.data();

        // Fetch user data by userId from users collection
        const userRef = firestore.collection('users').doc(postData.userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userData = userDoc.data();

        // Fetch location data based on locationId in the post
        const locationRef = firestore.collection('locations').doc(postData.locationId);
        const locationDoc = await locationRef.get();

        // Check if the location document exists
        if (!locationDoc.exists) {
            console.error(`Location with ID ${postData.locationId} not found.`);
            throw new Error(`Location with ID ${postData.locationId} not found.`);
        }

        const locationData = locationDoc.data();

        // Combine the post data with user name, surname, and location name
        const postWithUserAndLocation = {
            id: postDoc.id,
            ...postData,
            userName: userData.name,
            userSurname: userData.surname,
            locationName: locationData.name,
        };

        approvedPosts.push(postWithUserAndLocation); // Add the enriched post data to the array
    }

    return approvedPosts; // Return the array with posts enriched with user and location info
};

// Get all  posts for current common users
const allPostsByCurrentUser = async (userId, sortOrder) => {
    const posts = [];
    const postSnapshot = await firestore.collection('posts')
        .where('userId', '==', userId)
        .orderBy('createdAt', sortOrder === 'asc' ? 'asc' : 'desc') // Order by createdAt (descending)
        .get();

    postSnapshot.forEach(doc => posts.push({ id: doc.id, ...doc.data() }));

    return posts;
};

// Get all posts (only accessible by admin)
const getAllPosts = async (sortOrder) => {
    const allPosts = [];

    // Fetch all posts
    const postSnapshot = await firestore.collection('posts')
        .orderBy('createdAt', sortOrder === 'asc' ? 'asc' : 'desc') // Order by createdAt (ascending or descending)
        .get();

    // Iterate over each post
    for (const postDoc of postSnapshot.docs) {
        const postData = postDoc.data();

        // Fetch user data by userId from users collection
        const userRef = firestore.collection('users').doc(postData.userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userData = userDoc.data();
        // Get the first matching user document

        // Fetch location data based on locationId in the post
        const locationRef = firestore.collection('locations').doc(postData.locationId);
        const locationDoc = await locationRef.get();

        // Check if the location document exists
        if (!locationDoc.exists) {
            console.error(`Location with ID ${postData.locationId} not found.`);
            throw new Error(`Location with ID ${postData.locationId} not found.`);
        }

        const locationData = locationDoc.data();

        // Combine the post data with user name, surname, and location name
        const postWithUserAndLocation = {
            id: postDoc.id,
            ...postData,
            userName: userData.name,
            userSurname: userData.surname,
            locationName: locationData.name,
        };

        allPosts.push(postWithUserAndLocation); // Add the enriched post data to the array
    }

    return allPosts; // Return the array with posts enriched with user and location info
};

// Admin gets all unapproved posts
const getUnapprovedPosts = async (sortOrder) => {
    const unapprovedPosts = [];

    // Fetch all unapproved posts
    const postSnapshot = await firestore.collection('posts')
        .where('approved', '==', false) // Filter by unapproved posts
        .orderBy('createdAt', sortOrder === 'asc' ? 'asc' : 'desc') // Order by createdAt (ascending or descending)
        .get();

    // Iterate over each post
    for (const postDoc of postSnapshot.docs) {
        const postData = postDoc.data();

        // Fetch user data by userId from users collection
        const userRef = firestore.collection('users').doc(postData.userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userData = userDoc.data();

        // Fetch location data based on locationId in the post
        const locationRef = firestore.collection('locations').doc(postData.locationId);
        const locationDoc = await locationRef.get();

        // Check if the location document exists
        if (!locationDoc.exists) {
            console.error(`Location with ID ${postData.locationId} not found.`);
            throw new Error(`Location with ID ${postData.locationId} not found.`);
        }

        const locationData = locationDoc.data();

        // Combine the post data with user name, surname, and location name
        const postWithUserAndLocation = {
            id: postDoc.id,
            ...postData,
            userName: userData.name,
            userSurname: userData.surname,
            locationName: locationData.name,
        };

        unapprovedPosts.push(postWithUserAndLocation);
    }

    return unapprovedPosts;
};

// Update post method without explicit `if` checks
const updatePost = async (postId, { title, comment, rates }) => {
    const postRef = firestore.collection('posts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
        throw new Error('Post not found.');
    }

    // Build update data dynamically by filtering out undefined properties
    const updateData = {
        updatedAt: new Date(), // Always update `updatedAt`
        ...(title && { title }), // Add title if provided
        ...(comment && { comment }), // Add comment if provided
        ...(rates && { rates }), // Add rates if provided
        approved: false, // Set approved to false after updating
    };

    try {
        await postRef.update(updateData);
        console.log(`Post ${postId} updated successfully.`);
    } catch (error) {
        console.error('Error updating post:', error);
        throw new Error('Failed to update post.');
    }
};

// Get posts by grouped by locations ID's and their datas
// Get posts by grouped by locations ID's and their datas
const getPostsGroupedByLocation = async (userId, sortOrder) => {
    try {
        // Fetch all locations
        const locationSnapshot = await firestore.collection('locations').get();

        if (locationSnapshot.empty) {
            throw new Error('No locations found.');
        }

        const groupedPosts = [];

        // Iterate over each location to get the posts
        for (const locationDoc of locationSnapshot.docs) {
            const locationData = locationDoc.data();
            const locationId = locationDoc.id;

            // Fetch posts for the locationId and filter by userId
            // Sort posts based on the sortOrder ('asc' or 'desc')
            const postSnapshot = await firestore
                .collection('posts')
                .where('locationId', '==', locationId)
                .where('userId', '==', userId) // Filter posts by current user's userId
                .orderBy('createdAt', sortOrder === 'asc' ? 'asc' : 'desc') // Sort posts
                .get();

            const posts = [];

            // Use a for...of loop to handle async/await when fetching user data
            for (const doc of postSnapshot.docs) {
                const postData = doc.data();
                // Fetch user document to retrieve name, surname, and profile picture
                const userRef = firestore.collection('users').doc(postData.userId);
                const userDoc = await userRef.get();

                // If userDoc does not exist, you can handle it or skip
                let userData = {};
                if (userDoc.exists) {
                    userData = userDoc.data();
                }

                // Push combined post data + user data
                posts.push({
                    id: doc.id,
                    ...postData,
                    userName: userData.name || '',
                    userSurname: userData.surname || '',
                    profilePictureUrl: userData.profilePictureUrl || ''
                });
            }

            if (posts.length > 0) {
                // Add the location and its posts to the grouped posts array
                groupedPosts.push({
                    locationData,
                    posts,
                });
            }
        }

        // If no posts found for any location
        if (groupedPosts.length === 0) {
            return { message: 'No posts found for this user under any location.' };
        }

        return groupedPosts;
    } catch (error) {
        throw new Error(`Error fetching posts grouped by location: ${error.message}`);
    }
};


// Unapprove and delete post (Admin only)
const unapprovePost = async (postId, newMessage) => {
    // Get the post document from Firestore
    const postRef = firestore.collection('posts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
        // If the post doesn't exist, log the error and throw it
        console.error(`Post with ID ${postId} not found.`);
        throw new Error('Post not found');
    }

    const postData = postDoc.data();
    const photoUrls = postData.photos || [];  // Get the photos array (up to 3 photos)

    // Log the userId to verify
    const userId = postData.userId;

    // Delete all photos associated with the post
    try {
        for (const photoUrl of photoUrls) {
            const fileName = photoUrl.split('/').pop(); // Get the file name from the URL

            // Check if the fileName is correctly extracted
            if (!fileName) {
                throw new Error('Invalid file name extracted from URL');
            }
            const bucket = admin.storage().bucket();
            const file = bucket.file(`posts/${fileName}`); // Specify the path to the file in Cloud Storage


            // Delete the photo from Firebase Storage
            await file.delete();
        }
    } catch (error) {
        console.error('Error deleting photos from Firebase Storage:', error);
        throw new Error('Failed to delete photos from Firebase Storage');
    }


    const notificationRef = firestore.collection('notifications').doc();
    await notificationRef.set({
        userId,
        postId,
        doesEvent: false,
        message: `Your "${postData.title}" post has been rejected. For the reason ${newMessage}`,
        createdAt: new Date(),
        read: false,
    });

    console.log(`Post ${postId} rejected successfully and notification sent.`);

    // Delete the post document from Firestore
    try {
        await postRef.delete();
        console.log(`Post ${postId} unapproved and deleted successfully.`);
        return { message: 'Post unapproved and deleted successfully.' };
    } catch (error) {
        console.error(`Error deleting post with ID ${postId}:`, error);
        throw new Error('Failed to delete post');
    }
};

module.exports = {
    addPost,
    getPostsByLocationId,
    deletePostById,
    approvePost,
    getApprovedPostsByCurrentUser,
    getApprovedPosts,
    allPostsByCurrentUser,
    getAllPosts,
    getUnapprovedPosts,
    updatePost,
    getPostsGroupedByLocation,
    unapprovePost,
};