import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  Alert,
  TextInput,
  Keyboard,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "../../styles/MainStyles/PostScreenStyles";
import { BASE_URL } from "../../IpAddress";
import { Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LogBox } from 'react-native';
import { useNavigation } from "@react-navigation/native";

LogBox.ignoreAllLogs();


const PostScreen = () => {
  const [groupedPosts, setGroupedPosts] = useState([]);
  const [allPostsBackup, setAllPostsBackup] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [editedComment, setEditedComment] = useState("");
  const inputRef = useRef(null);
  const [isPhotoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [editedRates, setEditedRates] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [locationIdArray, setLocationIdArray] = useState([]);

  const navigation = useNavigation();


  const updateRates = (newRates) => {
    setEditedRates(newRates);
  };


  useEffect(() => {

  }, [editedRates]);

  const GetPhotoLake = async () => {
    try {

      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        console.error("Token not found.");
        return;
      }

      const url = new URL(`/api/locations`, BASE_URL);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });


      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to fetch posts for the location------------>>>>>><:", errorData);
      }

      if (response.ok) {
        const data = await response.json();

        if (data && Array.isArray(data)) {
          const formattedCoordinates = data.map(location => {
            const [latitude, longitude] = location.coordinate.split(' ').map(coord => parseFloat(coord));
            return {
              ...location,
              coordinate: { latitude, longitude },
            };
          });
          formattedCoordinates.forEach(item => {

            setLocationIdArray((prevArray) => [...prevArray, item]);

          });
        } else {

        }

      } else {
        console.error("Failed to fetch posts for the location--------------->");
      }
    } catch (error) {
      console.error("Error fetching posts------:", error.message);
    }
  };


  const fetchGroupedPosts = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        throw new Error("Token could not found.");
      }

      const response = await fetch(`${BASE_URL}/api/post/grouped/asc`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Could not fetch data.");
      }

      const groupedData = await response.json();
      setGroupedPosts(groupedData);
      setAllPostsBackup(groupedData);
      GetPhotoLake();
    } catch (error) {
      Alert.alert("Hata", error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        throw new Error("Token not found.");
      }

      const response = await fetch(`${BASE_URL}/api/user/info`, {

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response);

      if (!response.ok) {
        throw new Error("User information could not be retrieved.");
      }

      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const deletePost = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        throw new Error("Token could not found.");
      }
      const deleteMessage = "Inappropriate content";

      const response = await fetch(`${BASE_URL}/api/post/${selectedPost.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: deleteMessage }),
      });



      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Post could not be deleted.");
      }

      Alert.alert("Success", "Post deleted successfully!");


      const updatedPosts = groupedPosts
        .map((group) => ({
          ...group,
          posts: group.posts.filter((post) => post.id !== selectedPost.id),
        }))
        .filter((group) => group.posts.length > 0);

      setGroupedPosts(updatedPosts);
      setEditMode(false);
    } catch (error) {
      Alert.alert("Hata", error.message);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchGroupedPosts(), fetchUserProfile()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

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

  const handleUpdatePost = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        throw new Error("Token not found.");
      }

      const payload = {
        title: selectedPost.title,
        comment: editedComment,
        rates: editedRates || [],
      };

      const response = await fetch(
        `${BASE_URL}/api/post/update/${selectedPost.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Post could not be updated");
      }

      Alert.alert("Success", "Post updated!");

      const updatedPosts = groupedPosts.map((group) => {
        if (group.posts.some((post) => post.id === selectedPost.id)) {
          return {
            ...group,
            posts: group.posts.map((post) =>
              post.id === selectedPost.id
                ? { ...post, comment: editedComment, rates: editedRates }
                : post
            ),
          };
        }
        return group;
      });

      setGroupedPosts(updatedPosts);
      setEditMode(false);
    } catch (error) {
      Alert.alert("Hata", error.message);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);

    if (text.trim().length >= 3) {
      const filteredGroupedPosts = allPostsBackup
        .map((group) => ({
          ...group,

          posts: group.posts.filter((post) =>
            post.title.toLowerCase().includes(text.trim().toLowerCase())
          ),

        }))
        .filter((group) => group.posts.length > 0);

      setGroupedPosts(filteredGroupedPosts);

    } else {

      setGroupedPosts(allPostsBackup);
    }
  };

  const resetSearch = () => {
    setSearchQuery("");
    setGroupedPosts(allPostsBackup);
  };

  const renderHeader = () => (
    <View style={styles.container}>
      <View style={styles.profilecontainer}>
        {user && (
          <View style={styles.profilecontainer}>
            {user.profilePictureUrl ? (
              <Image
                source={{ uri: user.profilePictureUrl }}
                style={styles.profilePicture}
              />
            ) : (
              <Text style={styles.noProfilePicture}>No Profile Picture</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );

  const renderPhotoModal = () => (
    <Modal
      visible={isPhotoModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setPhotoModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.closeModalButton}
          onPress={() => setPhotoModalVisible(false)}
        >
          <Text style={styles.closeModalButtonText}>×</Text>
        </TouchableOpacity>
        {selectedPhoto && (
          <Image
            source={{ uri: selectedPhoto }}
            style={styles.fullscreenPhoto}
          />
        )}
      </View>
    </Modal>
  );

  return (
    <>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("Map", {
            setVisible: true,
            sendLocationId: post.locationId,
          })
        }
      ></TouchableOpacity>

      {editMode && selectedPost ? (
        <ScrollView style={styles.scrollContainer}>
          <View
            style={{
              backgroundColor: "#f9f9f9",
              padding: 15,
              borderRadius: 16,
              borderWidth: 0.5,
              borderStyle: "dotted",
              borderColor: "#007BFF",
            }}
          >
            <TouchableOpacity
              style={{
                position: "absolute",
                width: "auto",
                height: "auto",
                top: -40,
              }}
              onPress={() => setEditMode(false)}
            >
              <Ionicons name="arrow-back" size={32} color="#007BFF" />
            </TouchableOpacity>

            <Text style={styles.label}>Post Title:</Text>
            <View style={styles.title}>
              <Text style={styles.label2}>{selectedPost.title}</Text>
            </View>


            {selectedPost.photos && selectedPost.photos.length > 0 && (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("Map", {
                    setVisible: true,
                    sendLocationId: selectedPost.locationId,
                  })
                }
              >
                <Image
                  source={{ uri: selectedPost.photos[0] }}
                  style={{ width: "100%", height: 200, marginTop: 10, borderRadius: 10 }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}

            {Array.isArray(locationIdArray) && (

              locationIdArray.map((item) => {

                if (String(item.locationId) === String(selectedId)) {

                  return (
                    <TouchableOpacity onPress={() => navigation.navigate('Map', { setVisible: true, sendLocationId: selectedId })}>
                      <Image

                        source={{ uri: item.thumbnail }}
                        style={{ width: '100%', height: 150, marginTop: 10 }}
                      />
                    </TouchableOpacity>
                  );
                }
                return null;
              })
            )}


            <Text style={styles.label}>Comment:</Text>

            <TextInput
              style={[
                styles.title,
                {
                  backgroundColor: "#fff",
                  padding: 10,
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 8,
                  marginBottom: 15,
                  height: 100,
                  textAlignVertical: "top",
                },
              ]}
              value={editedComment}
              onChangeText={(text) => setEditedComment(text)}
              placeholder="Edit your comment here"
              returnKeyType="done"
              multiline
              onSubmitEditing={() => Keyboard.dismiss()}
            />

            <Text style={styles.label}>Photos:</Text>
            {selectedPost.photos && selectedPost.photos.length > 0 ? (
              <FlatList
                horizontal={true}
                data={selectedPost.photos}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedPhoto(item);
                      setPhotoModalVisible(true);
                    }}
                  >
                    <Image source={{ uri: item }} style={styles.postImage} />
                  </TouchableOpacity>
                )}
              />
            ) : (
              <Text style={styles.noPhotoText}>Photo could not find.</Text>
            )}

            <Text style={styles.label}>Scores:</Text>
            {editedRates.map((rate, index) => (
              <View key={index} style={styles.rateContainer}>
                <Text style={styles.label3}>{rate.factor} (1-5) :</Text>
                <TextInput
                  style={styles.rateInput}
                  keyboardType="numeric"
                  defaultValue={String(rate.value)}
                  onChangeText={(value) => {
                    const updatedRates = [...editedRates];
                    updatedRates[index] = {
                      ...rate,
                      value: Math.min(Math.max(Number(value), 0), 5),
                    };
                    setEditedRates(updatedRates);
                  }}
                />
              </View>
            ))}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.buttonConfirm}
                onPress={handleUpdatePost}
              >
                <Text style={styles.buttonTextConfirm}>Update</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.buttonReject}
                onPress={() =>
                  Alert.alert(
                    "Confirm Delete",
                    "Are you sure you want to delete this post?",
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Delete", onPress: deletePost },
                    ]
                  )
                }
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ width: 10, height: 120 }}></View>
        </ScrollView>
      ) : (
        <FlatList
          data={groupedPosts}
          keyExtractor={(item) => item.locationData.id || `group-${Math.random()}`}
          ListHeaderComponent={renderHeader}
          renderItem={({ item, index: locationIndex }) => {
            const isLastLocation = locationIndex === groupedPosts.length - 1;
            const lastPostIndex = item.posts.length - 1;

            return (
              <View
                style={[
                  styles.groupContainer,
                  isLastLocation && lastPostIndex === 0
                    ? { marginBottom: 120 }
                    : null,
                  isLastLocation && lastPostIndex > 0
                    ? { marginBottom: 120 }
                    : null,

                ]}
              >
                <Text style={styles.locationName}>
                  {item.locationData?.name || "Unnamed Location"}
                </Text>
                <FlatList
                  data={item.posts}
                  keyExtractor={(post) => post.id || `post-${Math.random()}`}
                  renderItem={({ item: post, index: postIndex }) => (
                    <TouchableOpacity
                      style={styles.postItem}
                      onPress={() => {
                        setSelectedPost(post);
                        setEditedComment(post.comment);
                        setEditedRates(post.rates || []);
                        setEditMode(true);
                      }}
                    >
                      <Text style={styles.postTitle}>{post.title}</Text>
                      <FlatList
                        data={post.photos || []}
                        horizontal
                        keyExtractor={(photo, index) => `${post.id}-${index}`}
                        renderItem={({ item: photo }) => (
                          <Image
                            source={{ uri: photo }}
                            style={styles.postImage}
                          />
                        )}
                      />
                    </TouchableOpacity>
                  )}
                />
              </View>
            );
          }}
        />
      )}
      {renderPhotoModal()}
    </>
  );
};

export default PostScreen;