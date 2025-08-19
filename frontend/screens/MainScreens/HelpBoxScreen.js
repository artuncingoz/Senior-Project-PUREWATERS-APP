// frontend/components/HelpBoxScreen.js

import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { BASE_URL } from "../../IpAddress";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

function HelpBoxScreen() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [waterBody, setWaterBody] = useState(null);
  const [awaitingChoice, setAwaitingChoice] = useState(false);
  const [loading, setLoading] = useState(true); // For initial loading
  const scrollViewRef = useRef();

  const navigation = useNavigation();

  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    try {
      // Fetch initial locations
      const token = await AsyncStorage.getItem("userToken");
      const url = `${BASE_URL}/api/chatbot/get-locations`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}), // No body needed
      });

      if (!response.ok) {
        throw new Error("Failed to fetch locations from the server.");
      }

      const data = await response.json();
      const { locations } = data;

      // Prepare initial messages
      const purposeMessage = {
        text: "Welcome to the Water Quality Chatbot! I can provide you with information about the water quality of various lakes.",
        isUser: false,
      };

      const helpMessage = {
        text: "You can type 'help' at any time to see available commands.",
        isUser: false,
      };

      const locationsMessage = {
        text: "I provide some of the lakes and example questions. Please select a lake from the options below or ask your own question:",
        isUser: false,
        options: locations.map(
          (location) => `What is the water quality of ${location}?`
        ),
        isLocation: true, // Custom flag to identify location questions
      };

      setMessages([purposeMessage, helpMessage, locationsMessage]);
      setLoading(false);
      scrollToBottom();
    } catch (error) {
      console.error("Error initializing chat:", error);
      setLoading(false);
      setMessages([
        {
          text: "Sorry, something went wrong while initializing the chat.",
          isUser: false,
        },
      ]);
      scrollToBottom();
    }
  };

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage) {
      const userMessage = { text: message, isUser: true };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setMessage("");

      if (trimmedMessage.toLowerCase() === "help") {
        // Handle the help command
        const helpResponse = getHelpMessage();
        handleBotResponse(helpResponse);
      } else if (awaitingChoice && waterBody) {
        // Handle the user's choice for fine-tuned or real data
        const botResponse = await sendChoiceToBackend(
          trimmedMessage,
          waterBody
        );
        handleBotResponse(botResponse);
      } else {
        // Handle general queries
        const botResponse = await sendMessageToBackend(trimmedMessage);
        handleBotResponse(botResponse);
      }
    }
  };

  const getHelpMessage = () => {
    return {
      answer:
        "You can ask lake information by typing commands like:\n- What is the water quality of Karasu Lake?\n\nIf you mention a specific lake, I can provide options for real data or fine-tuned data.",
    };
  };

  const handleBotResponse = (botResponse) => {
    if (botResponse.question && botResponse.options) {
      // Ensure waterBody is correctly set
      if (!botResponse.waterBody) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: "Error: Water body not specified.", isUser: false },
        ]);
        return;
      }

      // Ask the user to choose between options
      setAwaitingChoice(true);
      setWaterBody(botResponse.waterBody);
      const botMessage = {
        text: botResponse.question,
        isUser: false,
        options: botResponse.options, // Add options to the message object
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } else {
      // Handle final response or error message
      setAwaitingChoice(false);
      setWaterBody(null);
      const botMessage = { text: botResponse.answer, isUser: false };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    }
    scrollToBottom();
  };

  const handleChoice = async (choice) => {
    if (!waterBody) return;

    // Add the user's choice as a message
    const userMessage = { text: choice, isUser: true };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setMessage("");
    setAwaitingChoice(false);
    setWaterBody(null);

    // Send the choice to the backend
    const botResponse = await sendChoiceToBackend(choice, waterBody);
    handleBotResponse(botResponse);
  };

  const handleLocationSelection = async (locationQuestion) => {
    // Add the location question as a user message
    const userMessage = { text: locationQuestion, isUser: true };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setMessage("");
    setAwaitingChoice(false);
    setWaterBody(null);

    // Send the location question to the backend
    const botResponse = await sendMessageToBackend(locationQuestion);
    handleBotResponse(botResponse);
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const sendMessageToBackend = async (message) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const url = new URL("/api/chatbot/ask-lake-info", BASE_URL);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: message }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response from the server.");
      }

      const data = await response.json();

      // Check if the response indicates a specific lake and needs choice
      if (data.waterBody && data.question && data.options) {
        return {
          question: data.question,
          options: data.options,
          waterBody: data.waterBody,
        };
      }

      return data;
    } catch (error) {
      console.error("Error sending message:", error);
      return { answer: "Sorry, something went wrong." };
    }
  };

  const sendChoiceToBackend = async (choice, waterBody) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const url = `${BASE_URL}/api/chatbot/lake-info-choice`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ choice, waterBody }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response from the server.");
      }

      return await response.json();
    } catch (error) {
      console.error("Error sending choice:", error);
      return { answer: "Sorry, something went wrong." };
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0} // Adjust if necessary
    >
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={32} color="#007BFF" />
          </TouchableOpacity>
        </View>
        {/* User Profile */}
        <View style={styles.profile}>
          <Ionicons name="water" size={36} color="#007BFF" />
          <Text style={{ color: "#007BFF" }}>Help Bot AI</Text>
          <TouchableOpacity></TouchableOpacity>
        </View>
      </View>

      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.chatContainer}
        onContentSizeChange={scrollToBottom}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#007BFF" />
        ) : (
          messages.map((msg, index) => (
            <View
              key={index}
              style={[
                styles.chatBubble,
                msg.isUser ? styles.chatBubbleRight : styles.chatBubbleLeft,
              ]}
            >
              <Text
                style={[
                  styles.chatText,
                  msg.isUser ? styles.chatTextRight : styles.chatTextLeft,
                ]}
              >
                {msg.text}
              </Text>
              {/* Render option buttons if present */}
              {!msg.isUser && msg.options && (
                <View style={styles.optionsContainer}>
                  {msg.isLocation
                    ? msg.options.map((option, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.optionButton}
                        onPress={() => handleLocationSelection(option)}
                      >
                        <Text style={styles.optionText}>{option}</Text>
                      </TouchableOpacity>
                    ))
                    : msg.options.map((option, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.optionButton}
                        onPress={() => handleChoice(option)}
                      >
                        <Text style={styles.optionText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Input Box */}
      {!loading && !awaitingChoice && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type message here..."
            placeholderTextColor="#9CA6AE"
            value={message}
            onChangeText={setMessage}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Ionicons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F0E8",
    alignItems: "center",
    alignSelf: "stretch",
    paddingTop: 0,
  },
  topBar: {
    width: "100%",
    height: 70, // Changed from '70' string to 70 number
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E5E1DA",
    paddingHorizontal: 20,
    paddingVertical: 0,
    borderColor: "#f9f9f9",
    borderWidth: 2,
    borderStyle: "dashed",
  },
  profile: {
    zIndex: 1000,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F0E8", // Text background
    borderRadius: 30, // Rounded edges
    padding: 10,
    margin: 10,
    width: "auto", // Auto width
    height: 60, // Fixed height
    gap: 20,
    borderColor: "#fff",
    borderWidth: 2,
  },
  chatContainer: {
    flexGrow: 1,
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  chatBubble: {
    maxWidth: "95%",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  chatBubbleLeft: {
    alignSelf: "flex-start",
    backgroundColor: "#E5E1DA",
    marginLeft: 0,
    borderColor: "#fff",
    borderWidth: 2,
  },
  chatBubbleRight: {
    alignSelf: "flex-end",
    backgroundColor: "#007BFF",
    marginRight: 0,
  },
  chatText: {
    fontSize: 16,
    lineHeight: 22,
  },
  chatTextLeft: {
    color: "#5D6066",
  },
  chatTextRight: {
    color: "#FFFFFF",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "95%",
    height: 60,
    backgroundColor: "#E5E1DA",
    borderColor: "#007BFF",
    borderWidth: 2,
    borderRadius: 32,
    paddingHorizontal: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
    paddingVertical: 10,
  },
  sendButton: {
    backgroundColor: "#007BFF",
    borderRadius: 32,
    height: 40,
    width: 70,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  optionButton: {
    backgroundColor: "#007BFF",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 10,
    marginBottom: 10,
  },
  optionText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  optionsContainer: {
    flexDirection: "row",
    marginTop: 10,
    justifyContent: "flex-start",
    flexWrap: "wrap",
  },
});

export default HelpBoxScreen;
