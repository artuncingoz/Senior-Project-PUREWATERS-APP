import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar, LogBox } from "react-native";
import { auth } from "./config/firebaseclient";
import { onAuthStateChanged, getIdTokenResult, signOut } from "firebase/auth";
import { BASE_URL } from "@env";

LogBox.ignoreLogs([
  "CountryModal: Support for defaultProps will be removed",
  "Flag: Support for defaultProps will be removed from function components",
  "Warning: CountryModal:",
  "Warning: Failed prop type",
  "Warning: CountryItem: Support for defaultProps will be removed",
  "Warning: Main: Support for defaultProps will be removed",
  "Warning: CountryPicker: Support for defaultProps will be removed",
  "Warning: CountryModal: Support for defaultProps will be removed",
  "Warning: HeaderModal: Support for defaultProps will be removed",
  "Warning: CountryFilter: Support for defaultProps will be removed",
  "Warning: CountryList: Support for defaultProps will be removed",
  "Support for defaultProps will be removed from function components",
]);

import LoginScreen from "./screens/AuthScreens/LoginScreen";
import RegisterScreen from "./screens/AuthScreens/RegisterScreen";
import ForgotPasswordScreen from "./screens/AuthScreens/ForgotPasswordScreen";

import HomeScreen from "./screens/MainScreens/HomeScreen";
import ProfileScreen from "./screens/MainScreens/ProfileScreen";
import PostScreen from "./screens/MainScreens/PostScreen";
import CameraScreen from "./screens/MainScreens/CameraScreen";

import CameraSecondScreen from "./screens/OtherScreens/CameraSecondScreen";
import AdminPanel from "./screens/OtherScreens/AdminPanel";
import MapScreen from "./screens/OtherScreens/MapScreen";
import { useNavigation } from "@react-navigation/native";

const Stack = createNativeStackNavigator();

export default function App() {
  const screenOptions = ({ route }) => ({
    headerStyle: { backgroundColor: "#000000", elevation: 0 },
    headerTintColor: "#fff",
    headerTitleStyle: { fontWeight: "bold" },
    headerRight: () => null,
  });

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={screenOptions}>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: "Login", headerShown: false }}
        />
        <Stack.Screen
          name="ForgotPasswordScreen"
          component={ForgotPasswordScreen}
          options={{ title: "Forgot Password Screen" }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: "Register" }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Home", headerShown: false }}
        />
        <Stack.Screen
          name="Map"
          component={MapScreen}
          options={{ title: "Map", headerShown: false }}
        />
        <Stack.Screen
          name="Camera"
          component={CameraScreen}
          options={{
            title: "Camera",
            headerLeft: () => null,
            headerRight: () => null,
          }}
        />
        <Stack.Screen
          name="CameraSecond"
          component={CameraSecondScreen}
          options={{
            title: "CameraSecond",
            headerLeft: () => null,
            headerRight: () => null,
          }}
        />
        <Stack.Screen
          name="Post"
          component={PostScreen}
          options={{ title: "Post", headerLeft: () => null }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: "Profile", headerLeft: () => null }}
        />
        <Stack.Screen
          name="AdminPanel"
          component={AdminPanel}
          options={{
            title: "Admin Panel",
            headerLeft: () => null,
          }}
        />
      </Stack.Navigator>

      <StatusBar hidden={false} />
    </NavigationContainer>
  );
}
