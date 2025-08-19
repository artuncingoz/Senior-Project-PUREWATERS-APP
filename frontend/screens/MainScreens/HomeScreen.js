import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Image, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import MapScreen from "../OtherScreens/MapScreen";
import ProfileScreen from "../MainScreens/ProfileScreen";
import CameraScreen from "../MainScreens/CameraScreen";
import HelpBoxScreen from "../MainScreens/HelpBoxScreen";
import PostScreen from "../MainScreens/PostScreen";
import NotificationScreen from "../OtherScreens/NotificationScreen";
import { BASE_URL } from "../../IpAddress";
import styles from "../../styles/OtherStyles/MapScreenStyles";

const Tab = createBottomTabNavigator();

const HomeScreen = ({ navigation }) => {
  const [isNotificationVisible, setNotificationVisible] = useState(false);

  const toggleNotifications = () => {
    setNotificationVisible((prev) => !prev);
  };

  useEffect(() => {
    const checkUnreadNotifications = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (!token) return;
        const url = new URL("/api/user/hasUnread", BASE_URL);
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const json = await response.json();
        if (json.hasUnread) {
        }
      } catch (error) {
        console.error("Error checking notifications:", error.message);
      }
    };

    const interval = setInterval(checkUnreadNotifications, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: "#F1F0E8",
          },
          headerTintColor: "#fff",
          headerTitleAlign: "left",
          headerTitle: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={require("../../assets/logo.png")}
                style={{ width: 24, height: 24, marginRight: 10 }}
              />
              <Text
                style={{ color: "#007BFF", fontWeight: "700", fontSize: 24 }}
              >
                PureWaters
              </Text>
            </View>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={toggleNotifications}
              style={{ marginRight: 20 }}
            >
              <Ionicons
                name="notifications-outline"
                size={30}
                color="#007BFF"
              />
            </TouchableOpacity>
          ),
          tabBarStyle: {
            position: "absolute",
            padding: 10,
            left: 10,
            right: 10,
            bottom: 10,
            backgroundColor: "#F1F0E8",
            borderRadius: 36,
            borderColor: "#d9d9d9",
            height: 120,
            marginBottom: -30,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.15,
            shadowRadius: 5,
          },


          tabBarActiveTintColor: "#007BFF",
          tabBarActiveBackgroundColor: "#E5E1DA",

          tabBarInactiveTintColor: "#AAAAAA",

          tabBarItemStyle: {
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 25,
            marginHorizontal: 6,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.35,
            shadowRadius: 15,
            elevation: 3,
          },
        }}
      >
        <Tab.Screen
          name="Map"
          component={MapScreen}
          options={{
            tabBarShowLabel: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="map-outline" size={26} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Camera"
          component={CameraScreen}
          options={{
            headerShown: false,
            tabBarStyle: { display: "none" },
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="camera-outline" size={26} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="HelpBox"
          component={HelpBoxScreen}
          options={{
            tabBarShowLabel: false,
            tabBarStyle: { display: "none" },
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="chatbox-ellipses-outline"
                size={26}
                color={color}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Post"
          component={PostScreen}
          options={{
            tabBarShowLabel: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="create-outline" size={26} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarShowLabel: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={26} color={color} />
            ),
          }}
        />
      </Tab.Navigator>

      {isNotificationVisible && (
        <NotificationScreen
          isNotificationVisible={isNotificationVisible}
          toggleNotifications={toggleNotifications}
        />
      )}
    </View>
  );
};

export default HomeScreen;
