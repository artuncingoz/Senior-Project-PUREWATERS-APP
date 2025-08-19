import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import styles from "../../styles/AuthStyles/ForgotPasswordScreenStyles";
import { BASE_URL } from "../../IpAddress";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

const ForgotPasswordScreen = ({ navigation }) => {
    const [email, setEmail] = useState("");

    const handleResetPassword = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            Alert.alert("Error", "Please enter an email address.");
            return;
        }

        if (!emailRegex.test(email)) {
            Alert.alert("Error", "Please enter a valid email address.");
            return;
        }

        try {
            // Initialize Firebase Auth
            const auth = getAuth();

            // Use Firebase's sendPasswordResetEmail method
            await sendPasswordResetEmail(auth, email);

            // Notify user and navigate to login screen
            Alert.alert(
                "Success",
                "A password reset email has been sent to your email address. Please check your inbox."
            );
            navigation.replace("Login");
        } catch (error) {
            // Handle errors from Firebase
            console.error("Error resetting password:", error);
            Alert.alert("Error", error.message || "Failed to reset password.");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.description}>
                Enter your email address to reset your password.
            </Text>
            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={"#ffffff"}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                returnKeyType="done"
            />
            <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
                <Text style={styles.buttonText}>Reset Password</Text>
            </TouchableOpacity>
        </View>
    );
};

export default ForgotPasswordScreen;
