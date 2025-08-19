// routers/chatbotRouter.js

const express = require('express');
const { firestore } = require('../config/firebase');
const { verifyToken } = require('../middleware/authMiddleware');
const { getModelResponse, fineTuneWithStoredFile, getLocations } = require('../controllers/chatbotController');
const { isAdmin } = require('../middleware/roleMiddlemalware'); // Ensure correct filename and path
const { SessionsClient } = require('dialogflow');
const router = express.Router();
const dotenv = require('dotenv');
dotenv.config();

process.env.GOOGLE_APPLICATION_CREDENTIALS = '../backend/config/dialoges.json';
// Dialogflow setup
const projectId = "********";
const sessionId = `session-${new Date().getTime()}`;
const languageCode = 'en-US';

// Create a new session client for Dialogflow Essentials
const sessionClient = new SessionsClient();

// For Essentials, use sessionPath
const sessionPath = sessionClient.sessionPath(projectId, sessionId);

// Function to detect the intent using Dialogflow Essentials
async function detectIntent(query) {
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: query,
        languageCode: languageCode,
      },
    },
  };

  const responses = await sessionClient.detectIntent(request);
  const result = responses[0].queryResult;

  return result;
}

// Route: POST /api/chatbot/get-locations
router.post('/get-locations', verifyToken, async (req, res) => {
  try {
    const data = await getLocations(req); // Pass only 'req'
    res.status(200).json(data); // Send response here
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route: POST /api/chatbot/ask-lake-info
router.post('/ask-lake-info', verifyToken, async (req, res) => {
  const { prompt } = req.body;
  console.log('User prompt:', prompt);

  if (!prompt) {
    return res.status(400).json({ message: 'Question is required' });
  }

  try {
    // Step 1: Detect intent using Dialogflow
    const result = await detectIntent(prompt);
    console.log('Detected intent:', result.intent ? result.intent.displayName : 'No intent detected');
    console.log('Detected parameters:', result.parameters); // Log the parameters to see the actual structure

    // Step 2: Check if the detected intent is relevant
    const relevantIntents = [
      'What is the water quality of lake?'
    ];

    if (!result.intent || !relevantIntents.includes(result.intent.displayName)) {
      return res.status(200).json({
        answer: 'Please ask only about water quality-related questions.',
      });
    }

    // Step 3: Extract water body name
    // Corrected extraction
    const waterBodyField = result.parameters.fields.water_body?.listValue;
    const waterBody = waterBodyField?.values?.[0]?.stringValue;

    if (!waterBody) {
      return res.status(200).json({
        answer: 'Please specify the name of the water body in your question.',
      });
    }

    // Step 4: Ask user for preference
    return res.status(200).json({
      question: `What do you want to know about ${waterBody}?`,
      options: ['I want fine tuned data', 'I want real data'],
      waterBody: waterBody, // Ensure this is correctly sent
    });

  } catch (error) {
    console.error('Error processing the prompt:', error);
    res.status(500).json({ message: 'Internal Server Error' }); // Ensure only one response is sent
  }
});

// Route: POST /api/chatbot/lake-info-choice
router.post('/lake-info-choice', verifyToken, async (req, res) => {
  const { choice, waterBody } = req.body;
  console.log('User choice:', choice, 'Water body:', waterBody);

  if (!choice || !waterBody) {
    return res.status(400).json({ message: 'Choice and water body are required.' });
  }

  try {
    if (choice === 'I want fine tuned data') {
      // Fetch GPT response for fine-tuned data
      const gptResponse = await getModelResponse(`What is the water quality of ${waterBody}?`);
      return res.status(200).json({ answer: gptResponse });
    } else if (choice === 'I want real data') {
      // Fetch real data from Firestore
      const locationSnapshot = await firestore
        .collection('locations')
        .get();

      const locationDoc = locationSnapshot.docs.find(doc => doc.data().name.toLowerCase() === waterBody.toLowerCase());

      if (!locationDoc) {
        return res.status(200).json({ answer: 'Location data not found in Database.' });
      }

      const locationData = locationDoc.data();
      const { comment, rate, wildlife, cleanliness, appearance } = locationData;

      // Prepare the response
      const realDataResponse = `General Description: ${comment || 'N/A'}
        
      Overall rate: ${rate ? rate.toFixed(2) : 'N/A'} / 5
      Wildlife: ${wildlife ? wildlife.toFixed(2) : 'N/A'} / 5
      Cleanliness: ${cleanliness ? cleanliness.toFixed(2) : 'N/A'} / 5
      Appearance: ${appearance ? appearance.toFixed(2) : 'N/A'} / 5
      `;
      return res.status(200).json({ answer: realDataResponse });
    } else {
      return res.status(200).json({ answer: 'Invalid Choice. Please ask the question again' });
    }
  } catch (error) {
    console.error('Error processing user choice:', error);
    res.status(500).json({ message: 'Internal Server Error' }); // Ensure only one response is sent
  }
});

// Route: POST /api/chatbot/admin/fine-tune
router.post('/admin/fine-tune', verifyToken, isAdmin, async (req, res) => {
  try {
    const fineTuneResponse = await fineTuneWithStoredFile();
    res.status(200).json({ message: 'Fine-tuning process started successfully.', fineTuneResponse });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
