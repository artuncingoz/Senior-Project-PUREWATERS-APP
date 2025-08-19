import React, { useRef, useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  Alert,
  Image,
  TextInput,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "../../styles/OtherStyles/MapScreenStyles";
import { BASE_URL } from "../../IpAddress";
import { TouchableWithoutFeedback, Keyboard } from "react-native";
import { ImageBackground } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const MapScreen = ({ route }) => {
  const mapRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [coordinates, setCoordinates] = useState([]);
  const [region, setRegion] = useState({
    latitude: 39.52,
    longitude: 32.52,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  });
  const [errorMessage, setErrorMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [posts, setPosts] = useState(null);
  const [locationId, setLocationId] = useState(null);
  const [externalFunction, setExternalFunction] = useState(null);
  const [takeLocationId, setTakeLocationId] = useState(null);
  const [approvedEvents, setApprovedEvents] = useState([]);

  const [eventInfo, setEventInfo] = useState(null);

  useEffect(() => {
    const fetchCoordinates = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");

        const url = new URL("/api/locations", BASE_URL);
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();

          // console.log("DATA FROM LOCATIONJS:", data);
          // console.log('LocationData:', data.locationData); //undefined

          if (data && Array.isArray(data)) {
            const formattedCoordinates = data.map((location) => {
              const [latitude, longitude] = location.coordinate
                .split(" ")
                .map((coord) => parseFloat(coord));
              return {
                ...location,
                coordinate: { latitude, longitude },
              };
            });
            setCoordinates(formattedCoordinates);
          } else {
            setCoordinates([]);
          }
        } else {
          console.error("Failed to fetch coordinates");
        }
      } catch (error) {
        console.error("Error fetching coordinates:", error.message);
      }
    };

    setExternalFunction(() => fetchCoordinates);
    fetchCoordinates();

    const intervalId = setInterval(() => {
      fetchCoordinates();
    }, 300000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const fetchApprovedEvents = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        const url = new URL("/api/event/approved-events", BASE_URL);
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setApprovedEvents(data);
        } else {
          console.error("Failed to fetch approved events");
        }
      } catch (error) {
        console.error("Error fetching approved events:", error.message);
      }
    };

    fetchApprovedEvents();
  }, []);

  useEffect(() => {
    let locationSubscription;

    const getUserLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Location permission is required.");
          return;
        }

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (location) => {
            const { latitude, longitude } = location.coords;
            setUserLocation({ latitude, longitude });
            const newRegion = {
              latitude,
              longitude,
              latitudeDelta: 0.03,
              longitudeDelta: 0.03,
            };
            setRegion(newRegion);
            mapRef.current?.animateToRegion(newRegion, 1000);
            //console.log(userLocation)
          }
        );
      } catch (error) {
        console.error("Error fetching user location:", error.message);
      }
    };

    getUserLocation();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 3) {
      const filteredSuggestions = coordinates.filter((location) =>
        location.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery, coordinates]);

  const handleSuggestionClick = (location) => {
    Keyboard.dismiss();
    const newRegion = {
      latitude: location.coordinate.latitude,
      longitude: location.coordinate.longitude,
      latitudeDelta: 0.03,
      longitudeDelta: 0.03,
    };
    mapRef.current.animateToRegion(newRegion, 1000);

    setSelectedLocation(location);
    setSuggestions([]);
    //setSearchQuery(location.name);
  };

  useEffect(() => {
    const fetchPosts = async (locationId) => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          console.error("Token not found.");
          return;
        }

        const url = new URL(
          `/api/locations/locationInfo/${locationId}`,
          BASE_URL
        );
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();

          // console.log("Fetched Posts:", data);
          setPosts(data[0]?.posts || []);
          // console.log("Data:", data);
          // console.log("Posts:", JSON.stringify(data[0].posts, null, 2));
        } else {
          const errorData = await response.json();
          console.error("Failed to fetch data:", errorData);
        }
      } catch (error) {
        console.error("Error fetching posts:", error.message);
      }
    };
  }, [coordinates]);

  const MarkerClick = async (location, locationId) => {
    try {
      setSelectedLocation(location);

      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        console.error("Token not found.");
        return;
      }

      const locationUrl = new URL(
        `/api/locations/locationInfo/${locationId}`,
        BASE_URL
      );
      const locationResponse = await fetch(locationUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (locationResponse.ok) {
        const locationData = await locationResponse.json();
        const posts = locationData[0].posts;
        //console.log("Posts before processing:", posts); // Debug log

        const userUrl = new URL("/api/user/all", BASE_URL);
        const userResponse = await fetch(userUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const hasEvent = approvedEvents.some(
          (event) => event.locationId === location.locationId
        );

        let eventInfo = null;
        if (hasEvent) {
          const event = approvedEvents.find(
            (event) => event.locationId === location.locationId
          );
          eventInfo = {
            comment: event.comment,
            start: event.eventStart,
            finish: event.eventFinish,
          };
        }

        if (userResponse.ok) {
          const users = await userResponse.json();
          //console.log("Users data:", users); // Debug log

          const postsWithUserInfo = posts.map((post) => {
            //console.log("Processing post for user:", post.userInfo); // Debug log

            const matchingUser = users.find(
              (user) =>
                user.name === post.userInfo.userName &&
                user.surname === post.userInfo.userSurname
            );

            //console.log("Found matching user:", matchingUser); // Debug log

            if (!matchingUser) {
              return post;
            }

            return {
              ...post,
              userInfo: {
                userName: post.userInfo.userName,
                userSurname: post.userInfo.userSurname,
                profilePictureUrl: matchingUser.profilePictureUrl || null,
                email: matchingUser.email || null,
              },
            };
          });

          //console.log("Final processed posts:", postsWithUserInfo); // Debug log
          setPosts(postsWithUserInfo);
          setPopupVisible(true);
          setEventInfo(eventInfo);
        }
      }
    } catch (error) {
      console.error("Error:", error);
    }

    setPopupVisible(true);
  };

  const formatDate = (timestamp) => {
    if (timestamp && timestamp._seconds) {
      const date = new Date(timestamp._seconds * 1000);
      return date.toLocaleString();
    }
    return "N/A";
  };

  const renderStars = (value) => {
    const stars = [];
    for (let i = 0; i < value; i++) {
      stars.push(<Text key={i}>⭐</Text>);
    }
    return stars;
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    const foundLocation = coordinates.find((location) =>
      location.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (foundLocation) {
      const newRegion = {
        latitude: foundLocation.coordinate.latitude,
        longitude: foundLocation.coordinate.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      };
      mapRef.current.animateToRegion(newRegion, 1000);
    } else {
      Alert.alert("Not Found", "No matching location found.");
    }
  };

  useEffect(() => {
    if (route.params?.setVisible && route.params?.sendLocationId) {
      setPopupVisible(route.params.setVisible);
      setTakeLocationId(route.params.sendLocationId);

      if (externalFunction) {
        externalFunction();
      }
    }
  }, [route.params]);

  useEffect(() => {
    if (isPopupVisible && takeLocationId && coordinates) {
      const location = coordinates.find((item) => item.id === takeLocationId);
      if (location) {
        setSelectedLocation(location);
        MarkerClick(location, takeLocationId);
      }
    }
  }, [takeLocationId]);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        {!isPopupVisible && (
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a location"
            value={searchQuery}
            returnKeyType="done"
            onChangeText={(text) => setSearchQuery(text)}
          />
        )}
      </View>

      {!isPopupVisible && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((location, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleSuggestionClick(location)}
              style={styles.suggestionItem}
            >
              <Text style={styles.suggestionText}>{location.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={(newRegion) => setRegion(newRegion)}
      >
        <Marker
          coordinate={
            userLocation
              ? {
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                }
              : { latitude: 37.7749, longitude: -122.4194 }
          }
          title="My Location"
          pinColor="#007BFF"
        />

        {coordinates.map((location) => {
          const hasEvent = approvedEvents.some(
            (event) => event.locationId === location.locationId
          );

          return (
            <Marker
              key={location.id}
              coordinate={location.coordinate}
              pinColor={hasEvent ? "green" : "red"}
              onPress={() => MarkerClick(location, location.id)}
            />
          );
        })}

        {coordinates.map((data, index) => (
          <Marker
            key={index}
            coordinate={data.coordinate} // Use the coordinate object for each marker
            onPress={() => MarkerClick(data, data.id)} // Ensure 'data.id' is passed as 'locationId'
          ></Marker>
        ))}
      </MapView>

      {coordinates.map((data, index) => (
        <Marker
          key={index}
          coordinate={data.coordinate} // Use the coordinate object for each marker
          onPress={() => MarkerClick(data, data.id)} // Ensure 'data.id' is passed as 'locationId'
        ></Marker>
      ))}

      {errorMessage && (
        <Text style={{ color: "red", textAlign: "center" }}>
          {errorMessage}
        </Text>
      )}

      {isPopupVisible && selectedLocation && (
        <ScrollView style={styles.markercontaine}>
          <View
            style={{
              position: "absolute",
              left: 40,
              top: 40,
              width: 40,
              height: 40,
              borderRadius: 50,
              backgroundColor: "rgba(124, 124, 124, 0.6)",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 100,
            }}
          >
            <TouchableOpacity
              style={{ width: "auto", height: "auto" }}
              onPress={() => setPopupVisible(false)}
            >
              <Ionicons name="arrow-back" size={32} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.popupcontainer}>
            {selectedLocation.thumbnail && (
              <ImageBackground
                source={{ uri: selectedLocation.thumbnail }}
                style={{
                  flex: 1,
                  justifyContent: "flex-end",
                  alignItems: "baseline",
                  width: "100%",
                  height: 250,
                  borderWidth: 3,
                  borderColor: "#B3C8CF",
                  borderStyle: "dotted",
                  overflow: "hidden",
                  borderRadius: 20,
                }}
                resizeMode="cover"
              >
                <View style={styles.imagetextbg}>
                  <Text
                    style={{
                      fontSize: 26,
                      fontWeight: "bold",
                      color: "white",
                      textShadowColor: "rgba(0, 0, 0, 0.8)",
                      textShadowOffset: { width: -1, height: 1 },
                      textShadowRadius: 10,
                    }}
                  >
                    {selectedLocation.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 20,
                      color: "white",
                      textShadowColor: "rgba(0, 0, 0, 0.8)",
                      textShadowOffset: { width: -1, height: 1 },
                      textShadowRadius: 10,
                    }}
                  >
                    Overall Rate:{" "}
                    {selectedLocation.rate
                      ? selectedLocation.rate.toFixed(1)
                      : "0"}{" "}
                    ⭐
                  </Text>
                </View>
              </ImageBackground>
            )}

            <View>
              {isPopupVisible && selectedLocation && eventInfo && (
                <View style={styles.popupcontainer}>
                  <Text>
                    There is an event in this location: {eventInfo.comment}
                  </Text>
                  <Text>Event Start: {formatDate(eventInfo.start)}</Text>
                  <Text>Event Finish: {formatDate(eventInfo.finish)}</Text>
                </View>
              )}
            </View>
            <View style={styles.commentstyle}>
              <Text style={{ fontWeight: "normal" }}>
                {selectedLocation.comment}
              </Text>
            </View>
          </View>

          <View style={styles.popupcontainer}>
            <ScrollView>
              {posts && posts.length > 0 ? (
                posts.map((post, index) => (
                  <View
                    key={post.postId}
                    style={[
                      styles.popupcontainer2,
                      {
                        marginBottom: 30,
                        padding: 15,
                        borderRadius: 16,
                        backgroundColor: "#F1F0E8",
                        borderColor: "#B3C8CF",
                        shadowColor: "rgba(146, 146, 146, 0.6)",
                        shadowOpacity: 0.2,
                        shadowRadius: 16,
                        elevation: 5,
                        borderWidth: 2,
                        borderStyle: "dotted",
                      },
                    ]}
                  >
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginTop: 10 }}
                      contentContainerStyle={
                        post.photos?.length === 1
                          ? {
                              justifyContent: "center",
                              alignItems: "center",
                              flex: 1,
                            }
                          : {}
                      }
                    >
                      {post.photos &&
                        post.photos.map((photo, photoIndex) => (
                          <Image
                            key={photoIndex}
                            source={{ uri: photo }}
                            style={{
                              width: 200,
                              height: 200,
                              marginRight: 10,
                              borderRadius: 16,
                              borderWidth: 3,
                              borderColor: "#B3C8CF",
                              borderStyle: "dotted",
                              alignContent: "center",
                            }}
                          />
                        ))}
                    </ScrollView>

                    <View style={styles.container2}>
                      {post.userInfo.profilePictureUrl ? (
                        <Image
                          source={{ uri: post.userInfo.profilePictureUrl }}
                          style={styles.profileImage}
                        />
                      ) : (
                        <View
                          style={[
                            styles.profileImage,
                            {
                              backgroundColor: "#ddd",
                              justifyContent: "center",
                              alignItems: "center",
                            },
                          ]}
                        >
                          <Text>No Image</Text>
                        </View>
                      )}
                      <Text>
                        {post.userInfo.userName} {post.userInfo.userSurname}
                      </Text>
                      <TouchableOpacity style={styles.linkIcon}>
                        <Text style={styles.linkText}>🔗</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.commentstyle}>
                      <Text
                        style={{
                          fontWeight: "800",
                          paddingBottom: 20,
                          fontSize: 18,
                        }}
                      >
                        {post.title}
                      </Text>
                      <Text style={{ fontWeight: "medium" }}>
                        {post.comment}
                      </Text>
                    </View>

                    {post.rates &&
                      post.rates.map((rate, rateIndex) => (
                        <View key={rateIndex} style={styles.ratingContainer}>
                          <Text style={styles.label}>
                            {rate.factor.charAt(0).toUpperCase() +
                              rate.factor.slice(1)}
                            :
                          </Text>
                          {renderStars(rate.value)}
                        </View>
                      ))}
                  </View>
                ))
              ) : (
                <Text
                  style={{ textAlign: "center", fontSize: 16, color: "#999" }}
                >
                  No posts have been added for this location yet.
                </Text>
              )}
            </ScrollView>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default MapScreen;
