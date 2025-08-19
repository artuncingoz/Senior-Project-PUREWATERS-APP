// controllers/chatbotController.js

const fs = require('fs');
const { OpenAI } = require("openai");
const path = require('path');
const { firestore } = require('../config/firebase');
const dotenv = require('dotenv');
dotenv.config();

// OpenAI API Key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Declare min number of posts to start fine-tuning
const minPostFlag = 15;

// Max tokens that ChatGPT responds
const maxTokens = 400;

// Path for the JSONL file
const dataFilePath = './data/training_data.jsonl';

// Function to get model response
async function getModelResponse(prompt) {
  try {
    // Create response for fine-tuned model
    const response = await openai.chat.completions.create({
      model: process.env.FINETUNE_MODEL_ID,
      messages: [
        {
          role: "system",
          content: "You are an assistant that provides the user with information about water pollution and water quality in water resources in Turkey, such as lakes, rivers, and streams.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: maxTokens,
    });

    return response.choices[0].message.content.trim();

  } catch (error) {
    console.error('Error querying the fine-tuned model:', error);
    throw new Error('Internal server error');
  }
}

// Function to update post as fine-tuned
async function markPostAsFineTuned(post) {
  const postId = post.postId;

  try {
    const postRef = firestore.collection('posts').doc(postId);
    const postDoc = await postRef.get();

    // Check if the post exists
    if (!postDoc.exists) {
      throw new Error(`Post with ID ${postId} not found.`);
    }

    // Update the post to mark it as fine-tuned
    await postRef.update({
      doesTuned: true,
      updatedAt: new Date(),
    });

    console.log(`Post ${postId} marked as fine-tuned.`);
  } catch (error) {
    console.error(`Error marking post ${postId} as fine-tuned:`, error.message);
    throw new Error(`Failed to mark post ${postId} as fine-tuned.`);
  }
}

async function createAssistentContent(index, cleanliness, appearance, wildlife, comment, locationName, locationCleanliness, locationWildlife, locationAppearance) {
  const assistantContents = [
    `Water quality of the lake ${locationName} reported by users; The comment about  ${locationName} is: ${comment}`,

    `The quality of the lake ${locationName} based on the recent visitors feedback; Users' commented about ${locationName} are generaly like that: ${comment}`,

    `The quality of the lake ${locationName} according to the user reviews; Users' comments for ${locationName} are generaly like that: ${comment}`,

    `Water quality details for lake ${locationName} according to the latest posts; Users' comments for ${locationName} are generaly like that: "${comment}"`
  ];

  return assistantContents[index];
}

async function createUserContent(index, cleanliness, appearance, wildlife, comment, locationName, locationCleanliness, locationWildlife, locationAppearance) {
  const userContents = [
    `What is the water quality of ${locationName}? Please describe based on the latest posts.`,
    `Can you tell me the quality of  ${locationName}? Based on recent visitors feedbacks.`,
    `What is the quality of  ${locationName}, according to user reviews?`,
    `Please provide the water quality details for ${locationName} based on the latest posts.`
  ];
  console.log(locationName);
  return userContents[index];
}

// Function to create JSONL data from posts
async function createJsonlDataFromPosts(posts) {


  const jsonlData = await Promise.all(posts.map(async (post, index) => {
    const { comment, locationId, rates } = post;
    const cleanliness = rates.find(rate => rate.factor === 'Cleanliness').value;
    const appearance = rates.find(rate => rate.factor === 'Appearance').value;
    const wildlife = rates.find(rate => rate.factor === 'Wildlife').value;

    const locationRef = firestore.collection('locations').doc(locationId);
    const locationDoc = await locationRef.get();

    if (!locationDoc.exists) {
      throw new Error('Location not found');
    }

    const locationInfo = locationDoc.data();

    const userContents = [
      "What is the water quality of this lake? Please describe based on the latest posts.",
      "Can you tell me the quality of water at this lake? Based on recent visitors feedbacks.",
      "What is the quality of water at this lake, according to user reviews?",
      "Please provide the water quality details for this lake based on the latest posts."
    ];

    // Cycle through the user contents for creating different contents
    const userContent = await createUserContent(
      index % userContents.length,
      cleanliness,
      appearance,
      wildlife,
      comment,
      locationInfo.name,
      locationInfo.cleanliness,
      locationInfo.wildlife,
      locationInfo.appearance
    );
    const assistantContent = await createAssistentContent(
      index % userContents.length,
      cleanliness,
      appearance,
      wildlife,
      comment,
      locationInfo.name,
      locationInfo.cleanliness,
      locationInfo.wildlife,
      locationInfo.appearance
    );
    return {
      messages: [
        {
          role: "system",
          content: "You are an assistant that provides the user with information about water pollution and water quality in water resources in Turkey, such as lakes, rivers, and streams."
        },
        {
          role: "user",
          content: userContent
        },
        {
          role: "assistant",
          content: assistantContent
        }
      ]
    };
  }));

  // Convert to JSONL format and return the data as a string
  return jsonlData.map(item => JSON.stringify(item)).join("\n");
}

// Upload the file to OpenAI for fine-tuning
async function uploadFileForFineTuning(dataFilePath) {
  try {
    // Upload the file to OpenAI for fine-tuning
    const fileUploadResponse = await openai.files.create({
      file: fs.createReadStream(dataFilePath),
      purpose: 'fine-tune',
    });

    console.log('File uploaded successfully:', fileUploadResponse);

    // Return the fileUploadResponse to use later
    return fileUploadResponse;
  } catch (error) {
    console.error('Error uploading file to OpenAI:', error.message);
    throw new Error('File upload to OpenAI failed');
  }
}

// Function to fine-tune the model with the file ID
async function fineTuneModelWithStoredFile(fileId) {
  try {
    await openai.fineTuning.jobs.create({
      training_file: fileId,
      model: process.env.FINETUNE_MODEL_ID,
    });
  } catch (error) {
    console.error('Error during fine-tuning:', error.message);
    throw new Error('Fine-tuning process failed');
  }
}

// Admin trigger fine-tuning process
async function fineTuneWithStoredFile() {
  // Fetch posts where doesTuned is false and approved is true
  const postsSnapshot = await firestore.collection('posts')
    .where('doesTuned', '==', false)
    .where('approved', '==', true)
    .get();

  if (postsSnapshot.empty) {
    throw new Error('No posts found for fine-tuning.');
  }

  const posts = [];
  postsSnapshot.forEach(doc => posts.push(doc.data()));

  // Check if there are at least 15 posts for fine-tuning
  if (posts.length < minPostFlag) {
    console.log(`Not enough posts for fine-tuning. There need to be at least ${minPostFlag} posts. ${posts.length} post exist now`);
    throw new Error(`Not enough posts for fine-tuning. There need to be at least ${minPostFlag} posts. ${posts.length} post exist now`);
  }

  // Get the JSONL formatted data from posts
  const jsonlData = await createJsonlDataFromPosts(posts);

  // Check if 'data' directory exists, otherwise create it
  if (!fs.existsSync(path.dirname(dataFilePath))) {
    fs.mkdirSync(path.dirname(dataFilePath));
  }

  // Check if file exists and if it's empty
  let fileExists = fs.existsSync(dataFilePath);
  let isFileEmpty = true;

  if (fileExists) {
    const fileStats = fs.statSync(dataFilePath);
    isFileEmpty = fileStats.size === 0;
  }

  // Append the new post's data to the existing JSONL file
  if (!isFileEmpty) {
    // If file is not empty, append data with a new line (to avoid empty lines)
    fs.appendFileSync(dataFilePath, '\n' + jsonlData, 'utf8');
  } else {
    // If file is empty, write data directly without new line
    fs.writeFileSync(dataFilePath, jsonlData, 'utf8');
  }

  console.log('JSONL data saved successfully.');

  // Upload the file to OpenAI for fine-tuning, and wait for the success response
  const fileUploadResponse = await uploadFileForFineTuning(dataFilePath);

  // Start the fine-tuning process
  await fineTuneModelWithStoredFile(fileUploadResponse.id);

  // Mark posts as fine-tuned
  for (const post of posts) {
    //await markPostAsFineTuned(post);  // Pass the full post object
  }

  if (fs.existsSync(dataFilePath)) {
    //fs.unlinkSync(dataFilePath);  // Delete the file. If you want to store the file delete this part
    console.log('JSONL file deleted after fine-tuning.');
  }

  console.log('Fine-tuning process completed successfully.');
}

// Function to handle '/get-locations' endpoint
const getLocations = async (req) => { // Removed 'res' parameter
  try {
    const locationSnapshot = await firestore.collection('locations').limit(3).get();
    const locations = locationSnapshot.docs.map(doc => doc.data().name);

    return { locations }; // Return data instead of sending response
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw new Error('Internal Server Error'); // Throw error to be handled by router
  }
}

module.exports = {
  getLocations,
  fineTuneWithStoredFile,
  getModelResponse,
};
