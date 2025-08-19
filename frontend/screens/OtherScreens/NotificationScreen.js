import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Modal,
  Dimensions,
  ScrollView,
  Image,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "../../styles/OtherStyles/NotificationStyles.js";
import { BASE_URL } from "../../IpAddress";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const NotificationScreen = ({ isNotificationVisible, toggleNotifications }) => {
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [posts, setPosts] = useState([]);
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;

  const extractLocationNameFromMessage = (message) => {
    const match = message.match(/The event at location "(.*?)"/);
    return match ? match[1] : null;
  };

  // Fetch Notifications
  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        setIsLoggedIn(false);
        return;
      }

      setIsLoggedIn(true);
      const url = new URL("/api/user/notifications/desc", BASE_URL);
      const response = await fetch(url,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const fetchLocationAndPosts = async (notification) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        throw new Error("Token not found.");
      }

      // Extract locationName from notification message
      const locationName = extractLocationNameFromMessage(notification.message);
      if (!locationName) {
        throw new Error(
          "Failed to extract location name from notification message."
        );
      }

      const locationsUrl = `${BASE_URL}/api/locations`;
      const locationsResponse = await fetch(locationsUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!locationsResponse.ok) {
        throw new Error("Failed to fetch locations.");
      }

      const locations = await locationsResponse.json();
      const location = locations.find((loc) => loc.name === locationName);

      if (!location || !location.id) {
        throw new Error("Location not found for the given name.");
      }

      const locationInfoUrl = `${BASE_URL}/api/locations/locationInfo/${location.id}`;
      const locationInfoResponse = await fetch(locationInfoUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!locationInfoResponse.ok) {
        throw new Error("Failed to fetch location details.");
      }

      const locationData = await locationInfoResponse.json();
      setSelectedLocation(locationData[0]?.locationInfo || {});
      setPosts(locationData[0]?.posts || []);
      setPopupVisible(true);
    } catch (error) {
      console.error("Error in fetchLocationAndPosts:", error.message);
      setSelectedLocation({
        name: "Error fetching data",
        comment: "Unable to retrieve the details for this event.",
      });
      setPosts([]);
      setPopupVisible(true);
    }
  };

  const doesNotificationEvent = [
    { id: 1, message: "Event notification", doesEvent: true },
    { id: 2, message: "Non-event notification", doesEvent: false },
  ];


  const handleNotificationClick = async (notification) => {
    try {
      setSelectedNotification(notification);
      if (notification.doesEvent) {
        await fetchLocationAndPosts(notification);
      }
      await markAsRead(notification.id);
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };


  // Mark a Notification as Read
  const markAsRead = async (id) => {
    if (!isLoggedIn) return;
    try {
      const token = await AsyncStorage.getItem("userToken");
      const url = new URL(`/api/user/notifications/${id}/read`, BASE_URL);
      await fetch(url,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });
      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Delete Notification
  const deleteNotification = async (id) => {
    if (!isLoggedIn) return;
    try {
      const token = await AsyncStorage.getItem("userToken");
      const url = new URL(`/api/user/notifications/${id}`, BASE_URL);
      await fetch(url,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      setNotifications((prevNotifications) =>
        prevNotifications.filter((notification) => notification.id !== id)
      );
    } catch (error) {
      console.error("Error deleting notification: ", error);
    }
  };

  // Mark All Notifications as Read
  const markAllAsRead = async () => {
    if (!isLoggedIn) return;
    try {
      const token = await AsyncStorage.getItem("userToken");
      const url = new URL("/api/user/notifications/read-all", BASE_URL);
      await fetch(url,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Delete All Notifications
  const deleteAllNotifications = async () => {
    if (!isLoggedIn) return;
    try {
      const token = await AsyncStorage.getItem("userToken");
      const url = new URL("/api/user/deleteAllnotifications", BASE_URL);
      await fetch(url,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      setNotifications([]);
    } catch (error) {
      console.error("Error deleting all notifications:", error);
    }
  };

  const renderStars = (value) => {
    const stars = [];
    for (let i = 0; i < value; i++) {
      stars.push(<Text key={i}>⭐</Text>);
    }
    return stars;
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      if (isLoggedIn) {
        fetchNotifications();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  useEffect(() => {
    if (isNotificationVisible) {
      Animated.timing(slideAnim, {
        toValue: screenWidth * 0.1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenWidth,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isNotificationVisible]);

  return (
    <Modal transparent={true} visible={isNotificationVisible} animationType="none">
      <View style={{ flex: 1 }}>
        <Animated.View
          style={[
            styles.notificationPanel,
            { width: screenWidth * 0.8, transform: [{ translateX: slideAnim }] },
          ]}
        >
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>Notifications</Text>
            <TouchableOpacity onPress={toggleNotifications}>
              <Ionicons name="close-outline" size={30} color="black" />
            </TouchableOpacity>
          </View>
          <View style={styles.separator} />

          <View style={{ flex: 1, maxHeight: 400 }}>
            {notifications.length === 0 ? (
              <Text style={{ textAlign: "center", color: "#fff", fontSize: 20, marginTop: 10, marginBottom: 10 }}>
                No New Notifications
              </Text>
            ) : (
              <ScrollView
                contentContainerStyle={{ paddingBottom: 10, paddingRight: 10 }}
                showsVerticalScrollIndicator={true}
              >
                {notifications.map((notification) => (
                  <View
                    key={notification.id}
                    style={[
                      styles.notificationBox,
                      notification.read
                        ? styles.readNotification
                        : styles.unreadNotification,
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => handleNotificationClick(notification)}
                      style={{ flex: 1 }}
                    >
                      <Text
                        style={[
                          styles.notificationContent,
                          { color: notification.read ? "#fff" : "#000" },
                        ]}
                      >
                        {notification.message}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteNotification(notification.id)}
                      style={{ marginLeft: 10 }}
                    >
                      <Ionicons name="trash-outline" size={24} color="red" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
          <View style={styles.separator} />


          {notifications.length > 0 && (
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
              <TouchableOpacity
                style={[styles.markAllAsReadButton, { flex: 1, marginRight: 5 }]}
                onPress={markAllAsRead}
              >
                <Text style={styles.markAllAsReadText}>Mark All as Read</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteAllNotificationsButton, { flex: 1, marginLeft: 5 }]}
                onPress={deleteAllNotifications}
              >
                <Text style={styles.deleteAllNotificationsText}>
                  Delete All Notifications
                </Text>
              </TouchableOpacity>
            </View>
          )}


        </Animated.View>
      </View>


      {isPopupVisible && selectedLocation && (
        <Modal transparent={true} visible={isPopupVisible} animationType="fade">
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            }}
          >
            <View
              style={{
                width: "90%",
                maxHeight: "80%",
                backgroundColor: "#fff",
                borderRadius: 10,
                padding: 20,
              }}
            >
              <TouchableOpacity
                style={{ alignSelf: "flex-end" }}
                onPress={() => setPopupVisible(false)}
              >
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>

              <ScrollView
                contentContainerStyle={{
                  paddingVertical: 10,
                }}
                showsVerticalScrollIndicator={true}
              >
                {selectedLocation?.thumbnail && (
                  <ImageBackground
                    source={{ uri: selectedLocation.thumbnail }}
                    style={{
                      width: "100%",
                      height: 200,
                      marginBottom: 10,
                      borderRadius: 10,
                    }}
                    imageStyle={{ borderRadius: 10 }}
                  >
                    <View style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", padding: 10 }}>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "bold",
                          color: "#fff",
                          textAlign: "center",
                        }}
                      >
                        {selectedLocation?.name || "Location Name"}
                      </Text>
                      <Text style={{ fontSize: 16, color: "#fff", textAlign: "center", marginTop: 5 }}>
                        Overall Rate: {selectedLocation.rate ? selectedLocation.rate.toFixed(1) : "0"} ⭐
                      </Text>
                    </View>
                  </ImageBackground>
                )}

                <Text style={{ marginBottom: 10, color: "#333", textAlign: "center" }}>
                  {selectedLocation?.comment || "No additional information available."}
                </Text>

                {posts?.length > 0 ? (
                  posts.map((post, index) => (
                    <View
                      key={post.postId}
                      style={{
                        width: "100%",
                        marginBottom: 15,
                        padding: 15,
                        borderWidth: 1,
                        borderColor: "#ddd",
                        borderRadius: 10,
                        backgroundColor: "#f9f9f9",
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "bold",
                          fontSize: 16,
                          marginBottom: 5,
                          color: "#444",
                        }}
                      >
                        {post.title}
                      </Text>
                      <Text style={{ color: "#555", marginBottom: 10 }}>
                        {post.comment || "No comments available."}
                      </Text>

                      {post.photos?.map((photo, photoIndex) => (
                        <Image
                          key={photoIndex}
                          source={{ uri: photo }}
                          style={{
                            width: "100%",
                            height: 150,
                            borderRadius: 8,
                            marginBottom: 10,
                          }}
                        />
                      ))}

                      <Text style={{ fontWeight: "bold", marginTop: 10 }}>Rates:</Text>
                      {post.rates &&
                        post.rates.map((rate, rateIndex) => (
                          <View key={rateIndex} style={{ flexDirection: "row" }}>
                            <Text>
                              {rate.factor}: {renderStars(rate.value)}
                            </Text>
                          </View>
                        ))}
                    </View>
                  ))
                ) : (
                  <Text style={{ color: "#777", marginTop: 20 }}>No posts available.</Text>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

    </Modal>
  );
};

export default NotificationScreen;