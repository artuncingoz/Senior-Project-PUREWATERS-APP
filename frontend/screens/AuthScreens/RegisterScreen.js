import React, { useState } from "react";
import { Image, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, LogBox } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import styles from "../../styles/AuthStyles/RegisterScreenStyles";
import { BASE_URL } from '../../IpAddress';

import CountryPicker from 'react-native-country-picker-modal'

import { auth, firestore } from '../../config/firebaseclient'; // Import Firebase services
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; // Firestore service

LogBox.ignoreLogs([
  'Warning: CountryModal:',
  'Warning: CountryItem: Support for defaultProps will be removed',
  'Warning: Main: Support for defaultProps will be removed',
  'Warning: CountryPicker: Support for defaultProps will be removed',
  'Warning: CountryModal: Support for defaultProps will be removed',
  'Warning: HeaderModal: Support for defaultProps will be removed',
  'Warning: CountryFilter: Support for defaultProps will be removed',
  'Warning: CountryList: Support for defaultProps will be removed',
  // This will catch all defaultProps warnings for any component
  'Support for defaultProps will be removed from function components'
]);

const RegisterScreen = ({ navigation }) => {
  const [name, setFirstName] = useState("");
  const [surname, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [password, setPassword] = useState("");

  const [countryCode, setCountryCode] = useState('TR')
  const [withCountryNameButton, setWithCountryNameButton] = useState(false)
  const [withFlag, setWithFlag] = useState(true)
  const [withFilter, setWithFilter] = useState(true)
  const [withAlphaFilter, setWithAlphaFilter] = useState(false)
  const [withCallingCode, setWithCallingCode] = useState(false)
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const handleRegister = async () => {

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name) {
      Alert.alert("Error", "Please enter your name.");
      return;
    }

    if (!surname) {
      Alert.alert("Error", "Please enter your surname.");
      return;
    }

    if (!country) {
      Alert.alert("Error", "Please select your country.");
      return;
    }

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
      // Register the user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store additional user information in Firestore
      await setDoc(doc(firestore, "users", user.uid), {
        name,
        surname,
        email,
        country: country.name,
        role: 'common',
        profilePictureUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Optional: Send a confirmation email to the user
      //await sendEmailVerification(user);

      Alert.alert("Registration successful", `Welcome, ${name}!`);

      // Redirect to the login screen after successful registration
      navigation.navigate('Login');

    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };


  const onSelect = (country) => {
    setCountryCode(country.cca2)
    setCountry(country)
    setShowCountryPicker(false)
  }



  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/logo.png")}
        style={{ width: 100, height: 120, marginBottom: 0 }}
      />
      <Text style={styles.HeaderText}>Pure Waters</Text>

      <View style={styles.buttoncontainer}>
        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor={"#1e509a"}
          value={name}
          onChangeText={setFirstName}
          returnKeyType="done"
        />
        <TextInput
          style={styles.input}
          placeholder="Surname"
          placeholderTextColor={"#1e509a"}
          value={surname}
          onChangeText={setLastName}
          returnKeyType="done"
        />
      </View>
      <View style={styles.buttoncontainer2}>
        <TextInput
          style={styles.buttonLogin}
          placeholder="Email"
          placeholderTextColor={"#1e509a"}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          returnKeyType="done"
        />

        <View style={styles.countryPickerContainer}>
          <CountryPicker
            visible={showCountryPicker}
            onClose={() => setShowCountryPicker(false)}
            onSelect={(selectedCountry) => {
              setCountry(selectedCountry);
              setCountryCode(selectedCountry.cca2);
              setShowCountryPicker(false);
            }}
            withFilter
            withFlag={true}
            withCountryNameButton={true}
            renderFlagButton={() => (
              <TouchableOpacity
                style={[
                  styles.buttonLogin,
                  {
                    alignItems: 'flex-start',
                    paddingLeft: 12
                  }
                ]}
                onPress={() => setShowCountryPicker(true)}
              >
                <Text style={[
                  styles.buttonText,
                  {
                    color: "#1e509a",
                    fontSize: 16,
                    fontWeight: "auto",
                  }
                ]}>
                  {country && country.name ? country.name : 'Select Country'}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
        <TextInput
          style={styles.buttonLogin}
          placeholder="Password"
          placeholderTextColor={"#6C7C99"}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          returnKeyType="done"
        />
        <View style={styles.buttoncontainer}>
          <TouchableOpacity style={styles.buttonLogin} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.buttonText}>Already have an account? Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonLogin} onPress={handleRegister}>
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default RegisterScreen;