import React, { useState } from "react";
import { Image, View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { auth } from '../../config/firebaseclient'; // Import Firebase auth
import styles from "../../styles/AuthStyles/LoginScreenStyles";
import Icon from "react-native-vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'; // Import modular functions
import { BASE_URL } from '../../IpAddress'

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      Alert.alert("Error", "Please enter an email address.");
      return;
    }

    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    if (!password) {
      Alert.alert("Error", "Please enter a password.");
      return;
    }

    try {
      // Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Get the Firebase ID token
      const token = await user.getIdToken();
      // Send user data and token to backend
      const url = new URL("/api/user/login", BASE_URL);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error("Login failed.");
      }

      const data = await response.json();
      await AsyncStorage.setItem("userToken", data.token);
      //console.log(token);

      // Navigate to home screen after successful login
      navigation.replace("Home");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleRegister = () => {
    navigation.navigate("Register");
  };

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPasswordScreen");
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/logo.png")}
        style={{ width: 100, height: 120, marginBottom: 0 }}
      />
      <Text style={styles.HeaderText}>Pure Waters</Text>


      <View style={styles.container}>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={"#1e509a"}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          returnKeyType="done"

        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={"#1e509a"}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          returnKeyType="done"
        />
      </View>

      <TouchableOpacity onPress={handleForgotPassword}>
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

      <View style={styles.buttoncontainer}>
        <TouchableOpacity style={styles.buttonLogin} onPress={handleRegister}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonLogin} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};



export default LoginScreen;