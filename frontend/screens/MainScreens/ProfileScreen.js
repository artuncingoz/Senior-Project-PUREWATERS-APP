import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Button,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import PostScreen from "./PostScreen";
import CameraSecondScreen from "../OtherScreens/CameraSecondScreen";
import { BASE_URL } from "../../IpAddress";
import * as ImagePicker from "expo-image-picker";

const validCountries = ["US", "TR", "GB", "FR", "DE", "AR", "UK"];

import { signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "../../config/firebaseclient";

const ProfileScreen = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    surname: "",
    email: "",
    country: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [editedProfile, setEditedProfile] = useState({});
  const [postCount, setPostCount] = useState(0);
  const navigation = useNavigation();

  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");

      if (!token) {
        throw new Error("Token not found.");
      }

      const url = new URL("/api/user/info", BASE_URL);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setUser(data);
      setProfile({
        name: data.name,
        surname: data.surname,
        email: data.email,
        country: data.country,
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user profile:", error.message);
      Alert.alert("Error", error.message);
      setLoading(false);
    }
  };

  const fetchPostCount = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const url = new URL("/api/post/allPostsByCurrentUser/desc", BASE_URL);

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const posts = await response.json();
        setPostCount(posts.length);
      } else {
        Alert.alert("Error", "Failed to fetch posts.");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while fetching posts.");
    }
  };

  const handlePostUpload = async () => {
    try {

      const token = await AsyncStorage.getItem("userToken");
      const url = new URL("/api/post/upload", BASE_URL);
      const formData = new FormData();
      formData.append("post", {

      });
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      Alert.alert("Success", "Post uploaded successfully!");

      await fetchPostCount();
    } catch (error) {
      console.error("Error uploading post:", error.message);
      Alert.alert("Error", error.message);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");

      if (!validCountries.includes(profile.country)) {
        throw new Error("Invalid country selected");
      }

      const url = new URL("/api/user/update/info", BASE_URL);
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      Alert.alert("Success", "Profile updated successfully!");
      setEditing(false);
      fetchUserProfile();
    } catch (error) {
      console.error("Error updating profile:", error.message);
      Alert.alert("Error", error.message);
    }
  };

  const handleSavePassword = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");

      const url = new URL("/api/user/update/password", BASE_URL);
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      Alert.alert("Success", "Password updated successfully!");
      setNewPassword("");
    } catch (error) {
      console.error("Error updating password:", error.message);
      Alert.alert("Error", error.message);
    }
  };

  const handleUploadPhoto = async () => {
    try {

      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Media library access is required to upload a photo."
        );
        return;
      }


      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets) {
        const token = await AsyncStorage.getItem("userToken");


        const formData = new FormData();
        formData.append("profilePicture", {
          uri: result.assets[0].uri,
          name: "profile.jpg",
          type: "image/jpeg",
        });

        const url = new URL("/api/user/uploadProfilePicture", BASE_URL);


        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        setUser({ ...user, profilePictureUrl: data.profilePictureUrl });
        Alert.alert("Success", "Profile picture uploaded successfully!");
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error.message);
      Alert.alert("Error", error.message);
    }
  };

  const signOut = async () => {
    try {

      await firebaseSignOut(auth);
      console.log("Signed out successfully");

      navigation.replace("Login");
    } catch (error) {
      console.error("Error signing out: ", error.message);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    handlePostUpload;
    fetchPostCount();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>User information is not available.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {user.profilePictureUrl ? (
        <Image
          source={{ uri: user.profilePictureUrl }}
          style={styles.profilePictureUrl}
        />
      ) : (
        <TouchableOpacity
          style={styles.addPhotoButton}
          onPress={handleUploadPhoto}
        >
          <Text style={styles.addPhotoText}>Add Photo</Text>
        </TouchableOpacity>
      )}

      <Button
        title="Change Profile Picture"
        onPress={handleUploadPhoto}
        color="#2b7a78"
      />

      {!editing ? (
        <>
          <View style={styles.container2}>
            <View style={styles.card}>
              <Text style={styles.label}>
                Name: <Text style={styles.value}>{user.name}</Text>
              </Text>
              <Text style={styles.label}>
                Surname: <Text style={styles.value}>{user.surname}</Text>
              </Text>
              <Text style={styles.label}>
                Email: <Text style={styles.value}>{user.email}</Text>
              </Text>
              <Text style={styles.label}>
                Post Count: <Text style={styles.value}>{postCount}</Text>
              </Text>
              <Text style={styles.label}>
                Country: <Text style={styles.value}>{user.country}</Text>
              </Text>
            </View>
          </View>

          <Button
            title="Edit Profile"
            onPress={() => setEditing(true)}
            color="#007BFF"
          />
          {user.role === "admin" && (
            <Button
              title="Admin Panel"
              color="#007BFF"
              onPress={() => navigation.navigate("AdminPanel")}
            />
          )}
          <Button title="Sign Out" onPress={signOut} color="#dc3545" />
        </>
      ) : (
        <ScrollView style={styles.editContainer}>
          <Text style={styles.label}>Name:</Text>

          <TextInput
            style={
              styles.input
            }
            value={profile.name}
            onChangeText={(text) =>
              setProfile({ ...profile, name: text })
            }
          />

          <Text style={styles.label}>Surname:</Text>

          <TextInput
            style={
              styles.input
            }
            value={
              profile.surname
            }
            onChangeText={(text) =>
              setProfile({ ...profile, surname: text })
            }
          />

          <Text style={styles.label}>Email:</Text>

          <TextInput
            style={
              styles.input
            }
            value={profile.email}
            onChangeText={(text) =>
              setProfile({ ...profile, email: text })
            }
            editable={false}
          />

          <Text style={styles.label}>Country:</Text>

          <TextInput
            style={styles.input}
            value={profile.country}
            onChangeText={(text) => setProfile({ ...profile, country: text })}
            editable={false}
          />

          <Text style={styles.label}>New Password:</Text>
          <TextInput
            style={
              styles.input
            }
            secureTextEntry
            value={newPassword}
            onChangeText={(text) =>
              setNewPassword(text)
            }
          />

          <Button title="Save New Password" onPress={handleSavePassword} />
          <Button
            title="Save Profile Changes"
            onPress={handleSaveProfile}
            color="#28a745"
          />
          <Button title="Cancel" onPress={() => setEditing(false)} />
        </ScrollView>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: 20,
    backgroundColor: "#F1F0E8",
    padding: 20,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingBottom: 120,
  },
  profileContainer: {
    width: "100%",
    padding: 10,
    borderRadius: 10,
    gap: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  profilePictureUrl: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 0,
    borderColor: "#B3C8CF",
    borderWidth: 3,
    borderRadius: 100,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "#ddd",
  },
  addPhotoText: {
    color: "#555",
    fontSize: 14,
  },
  label: {
    marginBottom: 10,
    fontSize: 16,
    color: "#333",
  },
  labelTitle: {
    fontWeight: "bold",
    justifyContent: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    marginBottom: 20,
    marginTop: 20,
  },
  input: {
    marginBottom: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#999",
    borderStyle: "dotted",
    borderRadius: 5,
    backgroundColor: "#fff",
    height: 40,
  },
  editContainer: {
    width: "100%",
    padding: 0,
    marginBottom: 10,
  },
  container2: {
    flex: 1,
    backgroundColor: "#F1F0E8",
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#2b7a78",
  },
  card: {
    backgroundColor: "#ffffff",
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
    width: "95%",
    minHeight: 300,
    justifyContent: "center",
    marginBottom: 20,
    gap: 30,
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#17252a",
    width: 300,
  },
  value: {
    fontWeight: "normal",
    color: "#3aafa9",
  },
});

export default ProfileScreen;
