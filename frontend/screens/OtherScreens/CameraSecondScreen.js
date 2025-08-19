import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import styles from "../../styles/OtherStyles/CameraSecondScreenStyles";
import { BASE_URL } from "../../IpAddress";

const CameraSecondScreen = ({ route }) => {
  const { photos = [], setPhotos } = route.params;
  const navigation = useNavigation();
  const [locationName, setLocationName] = useState("");
  const [cleanliness, setCleanliness] = useState(0);
  const [appearance, setAppearance] = useState(0);
  const [wildlife, setWildlife] = useState(0);
  const [comment, setComment] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [locations, setLocations] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [markerColor, setMarkerColor] = useState("#007BFF"); // default blue

  const handleColorSelect = (color) => {
    setMarkerColor(color);
  };

  const fetchUserLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error("Error fetching user location:", error);
    }
  };

  useEffect(() => {
    fetchUserLocation();
    getAllLocations()
      .then((locations) => {
        setLocations(locations);
        setFilteredLocations(locations);
      })
      .catch((error) => {
        console.error("Error loading locations:", error);
      });
  }, []);

  const getAllLocations = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const url = new URL("/api/locations/", BASE_URL);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const locations = await response.json();
        return locations;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch locations");
      }
    } catch (error) {
      console.error("Error fetching locations:", error.message);
      throw error;
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const filterLocationsByDistance = (locations) => {
    if (!userLocation) return;

    const { latitude: userLat, longitude: userLon } = userLocation;
    const filtered = locations.filter((location) => {
      const [lat, lon] = location.coordinate.split(" ").map(Number);
      const distance = calculateDistance(userLat, userLon, lat, lon);
      return distance <= 1; // Locations within 1 km
    });

    setFilteredLocations(filtered);
  };

  useEffect(() => {
    if (userLocation) {
      filterLocationsByDistance(locations);
    }
  }, [userLocation, locations]);

  const handleSearch = (text) => {
    setLocationName(text);

    if (text === "") {
      filterLocationsByDistance(locations);
    }

    const filteredByDistance = locations.filter((location) => {
      const [lat, lon] = location.coordinate.split(" ").map(Number);
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        lat,
        lon
      );
      return distance <= 1;
    });

    const filtered = filteredByDistance.filter((location) =>
      location.name.toLowerCase().includes(text.toLowerCase())
    );

    setFilteredLocations(filtered);
  };

  const handleRating = (field, value) => {
    if (field === "cleanliness") setCleanliness(value);
    if (field === "appearance") setAppearance(value);
    if (field === "wildlife") setWildlife(value);
  };

  const renderRating = (field, value) => (
    <View style={styles.ratingContainer}>
      <Text style={styles.label}>
        {field.charAt(0).toUpperCase() + field.slice(1)}:
      </Text>
      <View style={styles.starsContainer}>
        {[...Array(5)].map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleRating(field, index + 1)}
          >
            <FontAwesome
              name={index < value ? "star" : "star-o"}
              size={24}
              color={index < value ? "#FFD700" : "#ccc"}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const handleConfirm = async () => {
    if (!postTitle || !selectedLocationId) {
      Alert.alert("Error", "Please fill in all fields and select a location!");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("userToken");
      const formData = new FormData();
      formData.append("title", postTitle);
      formData.append("comment", comment);
      formData.append("locationId", selectedLocationId);
      formData.append("cleanliness", cleanliness);
      formData.append("appearance", appearance);
      formData.append("wildlife", wildlife);

      photos.forEach((uri, index) => {
        formData.append("photos", {
          uri: uri,
          type: "image/jpeg",
          name: `photo_${index + 1}.jpg`,
        });
      });

      const url = new URL(`/api/post/create`, BASE_URL);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        Alert.alert("Success!", "Photos and post have been submitted.");
        navigation.navigate("Home", { screen: "Map" });
      } else {
        const errorData = await response.json();
        Alert.alert("Error!", errorData.message || "Something went wrong.");
      }
    } catch (error) {
      Alert.alert("Error!", error.message || "Something went wrong.");
    }
  };

  const handleReject = () => {
    setPhotos([]);
    navigation.navigate("Home", { screen: "Camera" });
  };

  const handleAddPhoto = () => {
    navigation.navigate("Home", { screen: "Camera" });
  };

  return (
    <ScrollView contentContainerStyle={[styles.scrollContainer]}>
      <TextInput
        style={styles.input}
        placeholder="Location Name"
        value={locationName}
        onChangeText={handleSearch}
        returnKeyType="done"
      />

      {locationName.length > 0 && filteredLocations.length > 0 && (
        <View style={styles.dropdown}>
          {filteredLocations.map((location) => (
            <TouchableOpacity
              key={location.id}
              onPress={() => {
                setLocationName(location.name);
                setSelectedLocationId(location.locationId);
                setFilteredLocations([]);
              }}
            >
              <Text style={styles.dropdownItem}>{location.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {photos.length > 0 && (
        <View style={styles.imageContainer}>
          {photos.map((uri, index) => (
            <Image
              key={index}
              source={{ uri: uri }}
              style={[styles.image, { marginRight: 10 }]}
            />
          ))}
        </View>
      )}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 20,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "#007BFF",
          backgroundColor: "#e1e1e1",
          borderStyle: "dashed",
        }}
      >
        <TouchableOpacity onPress={handleAddPhoto}>
          <Ionicons name="camera" size={32} color="#007BFF" />
        </TouchableOpacity>
        <Text>Add photo</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Post Title"
        value={postTitle}
        onChangeText={setPostTitle}
        returnKeyType="done"
      />
      <TextInput
        style={styles.input}
        placeholder="Comment"
        value={comment}
        onChangeText={setComment}
        returnKeyType="done"
      />

      {renderRating("cleanliness", cleanliness)}
      {renderRating("appearance", appearance)}
      {renderRating("wildlife", wildlife)}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.buttonReject} onPress={handleReject}>
          <Text style={styles.buttonTextReject}>Reject</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.buttonConfirm} onPress={handleConfirm}>
          <Text style={styles.buttonTextConfirm}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default CameraSecondScreen;
