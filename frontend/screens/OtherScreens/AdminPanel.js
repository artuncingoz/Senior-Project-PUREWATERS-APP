import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    Modal,
    FlatList,
    Image,
    Keyboard
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "../../styles/OtherStyles/AdminPanelStyles.js";
import { BASE_URL } from '../../IpAddress';


const AdminPanel = () => {
    const [currentView, setCurrentView] = useState("menu");
    const [locationName, setLocationName] = useState("");
    const [locationComment, setLocationComment] = useState("");
    const [coordinate, setCoordinate] = useState("");
    const [thumbnail, setThumbnail] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchUserText, setSearchUserText] = useState("");
    const [posts, setPosts] = useState([]);
    const [selectedPost, setSelectedPost] = useState(null);
    const [searchPostText, setSearchPostText] = useState("");
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [deleteMessage, setDeleteMessage] = useState("");
    const [rejectMessage, setRejectMessage] = useState("");
    const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
    const [searchEventText, setSearchEventText] = useState("");
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [events, setEvents] = useState([]);
    const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
    const [eventComment, setEventComment] = useState("");

    const handleDelete = (postId) => {
        if (!deleteMessage.trim()) {
            Alert.alert("Error", "Please enter a reason for deletion.");
            return;
        }
        deletePost(postId, deleteMessage);
        setIsDeleteModalVisible(false);
        setDeleteMessage("");
        setSelectedPost(null);
    };

    const handleReject = (postId) => {
        if (!rejectMessage.trim()) {
            Alert.alert("Error", "Please enter a reason for rejection.");
            return;
        }
        rejectPost(postId, rejectMessage);
        setIsRejectModalVisible(false);
        setRejectMessage("");
        setSelectedPost(null);
    };


    const fetchLocations = async () => {
        try {
            const token = await AsyncStorage.getItem("userToken");
            const url = new URL("/api/locations", BASE_URL);
            const response = await fetch(url,
                {
                    headers: { Authorization: `Bearer ${token}` },
                });
            const data = await response.json();
            setLocations(data);
        } catch (error) {
            Alert.alert("Error", "Could not fetch locations.");
        }
    };

    const deleteLocation = async (locationId) => {
        const token = await AsyncStorage.getItem("userToken");

        try {
            const url = new URL(`/api/locations/${locationId}`, BASE_URL);
            const response = await fetch(url,
                {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                Alert.alert("Success", "Location deleted successfully!");
                setLocations((prevLocations) =>
                    prevLocations.filter(location => location.id !== locationId)
                );
                setSelectedLocation(null);
            } else {
                Alert.alert("Error", "Failed to delete location.");
            }
        } catch (error) {
            Alert.alert("Error", "An error occurred while deleting the location.");
        }
    };

    const fetchUsers = async () => {
        try {
            const token = await AsyncStorage.getItem("userToken");
            const url = new URL("/api/user/all", BASE_URL);
            const response = await fetch(url,
                {
                    headers: { Authorization: `Bearer ${token}` },
                });
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            Alert.alert("Error", "Could not fetch users.");
        }
    };

    const deleteUser = async (email) => {
        const token = await AsyncStorage.getItem("userToken");

        try {
            const url = new URL(`/api/user/admin/delete/${email}`, BASE_URL);
            const response = await fetch(url,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                Alert.alert("Success", "User deleted successfully!");
                setUsers((prevUsers) =>
                    prevUsers.filter((user) => user.email !== email)
                );
                setSelectedUser(null);
            } else {
                Alert.alert("Error", "Failed to delete user.");
            }
        } catch (error) {
            Alert.alert("Error", "An error occurred while deleting the user.");
        }
    };

    const fetchPosts = async () => {
        try {
            const token = await AsyncStorage.getItem("userToken");
            const url = new URL("/api/post/allposts/desc", BASE_URL);
            const response = await fetch(url,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setPosts(data);
            } else {
                Alert.alert("Error", "Failed to fetch posts.");
            }
        } catch (error) {
            Alert.alert("Error", "An error occurred while fetching posts.");
        }
    };

    const fetchApprovedPosts = async () => {
        try {
            const token = await AsyncStorage.getItem("userToken");
            const url = new URL("/api/post/approved/desc", BASE_URL);
            const response = await fetch(url,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setPosts(data);
            } else {
                Alert.alert("Error", "Failed to fetch approved posts.");
            }
        } catch (error) {
            Alert.alert("Error", "An error occurred while fetching approved posts.");
        }
    };

    const fetchUnapprovedPosts = async () => {
        try {
            const token = await AsyncStorage.getItem("userToken");
            const url = new URL("/api/post/unapproved/desc", BASE_URL);
            const response = await fetch(url,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setPosts(data);
            } else {
                Alert.alert("Error", "Failed to fetch unapproved posts.");
            }
        } catch (error) {
            Alert.alert("Error", "An error occurred while fetching unapproved posts.");
        }
    };


    const approvePost = async (postId) => {
        try {
            const token = await AsyncStorage.getItem("userToken");
            const url = new URL(`/api/post/approve/${postId}`, BASE_URL);
            const response = await fetch(url, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                Alert.alert("Success", "Post approved successfully!");
                setPosts((prevPosts) =>
                    prevPosts.map((post) =>
                        post.id === postId ? { ...post, approved: true } : post
                    )
                );
            } else {
                Alert.alert("Error", "Failed to approve post.");
            }
        } catch (error) {
            Alert.alert("Error", "An error occurred while approving the post.");
        }
    };

    const rejectPost = async (postId, message) => {
        try {
            if (!message.trim()) {
                Alert.alert("Error", "Please enter a reason for rejection.");
                return;
            }

            const token = await AsyncStorage.getItem("userToken");
            const url = new URL(`/api/post/unapprove/${postId}`, BASE_URL);
            const response = await fetch(url,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ message }),
                }
            );

            if (response.ok) {
                Alert.alert("Success", "Post reject successfully!");
                setPosts((prevPosts) =>
                    prevPosts.filter((post) => post.id !== postId)
                );
            } else {
                Alert.alert("Error", "Failed to reject post.");
            }
        } catch (error) {
            Alert.alert("Error", "An error occurred while rejecting the post.");
        }
    };

    const deletePost = async (postId, message) => {
        try {
            if (!message.trim()) {
                Alert.alert("Error", "Please enter a reason for deletion.");
                return;
            }
            const token = await AsyncStorage.getItem("userToken");
            const url = new URL(`/api/post/${postId}`, BASE_URL);
            const response = await fetch(url, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error("Error response:", errorData);
                Alert.alert("Error", "Failed to delete post.");
                return;
            }

            Alert.alert("Success", "Post deleted successfully!");
            setPosts((prevPosts) =>
                prevPosts.filter((post) => post.id !== postId)
            );
        } catch (error) {
            console.error("Error occurred:", error.message);
            Alert.alert("Error", "An error occurred while deleting the post.");
        }
    };


    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission required", "Access permission to the gallery must be granted.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            const imageUri = result.assets ? result.assets[0].uri : result.uri;
            setThumbnail(imageUri);
        }
    };

    const handleLocationFormSubmit = async () => {
        const coordinateRegex = /^-?\d{1,2}\.\d{1,4}\s-?\d{1,3}\.\d{1,4}$/;

        if (!coordinateRegex.test(coordinate)) {
            Alert.alert("Invalid Format", "Coordinate format should be '12.1234 123.1234' or '-12.1234 -123.1234'.");
            return;
        }

        const [latitude, longitude] = coordinate.split(" ").map(Number);

        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            Alert.alert("Invalid Coordinates", "Latitude must be between -90 and 90, and longitude between -180 and 180.");
            return;
        }

        if (!locationName || !locationComment || !thumbnail) {
            Alert.alert("Invalid Input", "All fields are required.");
            return;
        }

        const token = await AsyncStorage.getItem("userToken");
        const formData = new FormData();
        formData.append("name", locationName);
        formData.append("comment", locationComment);
        formData.append("coordinate", coordinate);
        formData.append("thumbnail", {
            uri: thumbnail,
            name: "thumbnail.jpg",
            type: "image/jpeg",
        });

        try {
            const url = new URL(`/api/locations/create`, BASE_URL);
            const response = await fetch(url,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                    body: formData,
                }
            );

            if (response.ok) {
                Alert.alert("Success", "Location added successfully.");
                setCurrentView("locations");
                setLocationName("");
                setLocationComment("");
                setCoordinate("");
                setThumbnail(null);
            } else {
                Alert.alert("Error", "Could not add location.");
            }
        } catch (error) {
            Alert.alert("Error", "An error occurred.");
        }
    };

    const fineTune = async () => {
        try {
            const token = await AsyncStorage.getItem("userToken");
            const url = new URL("/api/chatbot/admin/fine-tune", BASE_URL);
            const response = await fetch(url,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                });
            const data = await response.json();
            setLocations(data);
        } catch (error) {
            Alert.alert("Error", "Could not fine tune.");
        }
    };

    const fetchApprovedEvents = async () => {
        try {
            const token = await AsyncStorage.getItem("userToken");
            const url = new URL("/api/event/approved-events", BASE_URL);
            const response = await fetch(url,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setEvents(data);
            } else {
                Alert.alert("Error", "Failed to fetch approved events.");
            }
        } catch (error) {
            Alert.alert("Error", "An error occurred while fetching approved events.");
        }
    };

    const fetchUnapprovedEvents = async () => {
        try {
            const token = await AsyncStorage.getItem("userToken");
            const url = new URL("/api/event/unapproved-events", BASE_URL);
            const response = await fetch(url,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setEvents(data);
            } else {
                Alert.alert("Error", "Failed to fetch unapproved events.");
            }
        } catch (error) {
            Alert.alert("Error", "An error occurred while fetching unapproved events.");
        }
    };

    const deleteEvent = async (eventId) => {
        try {
            const token = await AsyncStorage.getItem("userToken");
            const url = new URL(`/api/event/reject-event/${eventId}`, BASE_URL);
            const response = await fetch(url, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error("Error response:", errorData);
                Alert.alert("Error", "Failed to delete event.");
                return;
            }

            Alert.alert("Success", "Event deleted successfully!");
            setEvents((prevEvents) =>
                prevEvents.filter((event) => event.eventId !== eventId)
            );
        } catch (error) {
            console.error("Error occurred:", error.message);
            Alert.alert("Error", "An error occurred while deleting the event.");
        }
    };

    const approveEvent = async (eventId, comment) => {
        try {
            if (!comment.trim()) {
                Alert.alert("Error", "Please enter a comment for event.");
                return;
            }
            const token = await AsyncStorage.getItem("userToken");
            const url = new URL(`/api/event/approve/${eventId}`, BASE_URL);
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ comment }),
            });

            if (response.ok) {
                Alert.alert("Success", "Event approved successfully!");
                setEvents((prevEvents) =>
                    prevEvents.map((event) =>
                        event.eventId === eventId ? { ...event, doesApprove: true } : event
                    )
                );
            } else {
                Alert.alert("Error", "Failed to approve event.");
            }
        } catch (error) {
            Alert.alert("Error", "An error occurred while approving the event.");
        }
    };

    if (currentView === "menu") {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Admin Panel</Text>
                <TouchableOpacity
                    onPress={() => setCurrentView("locations")}
                    style={styles.menuButton}
                >
                    <Text style={styles.menuButtonText}>Locations</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => {
                        setCurrentView("users");
                        fetchUsers();
                    }}
                    style={styles.menuButton}
                >
                    <Text style={styles.menuButtonText}>Users</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setCurrentView("posts")}
                    style={styles.menuButton}
                >
                    <Text style={styles.menuButtonText}>Posts</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setCurrentView("events")}
                    style={styles.menuButton}
                >
                    <Text style={styles.menuButtonText}>Events</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => {
                        Alert.alert(
                            "Are you sure?",
                            "You are about to start the Fine Tune process. This will make changes to the AI. Do you confirm?",
                            [
                                {
                                    text: "Cancel",
                                },
                                {
                                    text: "Confirm",
                                    onPress: () => fineTune(),
                                },
                            ],
                            { cancelable: true }
                        );
                    }}
                    style={styles.fineTuneButton}
                >
                    <Text style={styles.menuButtonText}>Fine Tune</Text>
                </TouchableOpacity>

            </View>
        );
    }

    if (currentView === "locations") {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Locations</Text>
                <TouchableOpacity
                    onPress={() => {
                        setLocationName("");
                        setLocationComment("");
                        setCoordinate("");
                        setThumbnail(null);
                        setCurrentView("add");
                    }}
                    style={styles.menuButton}
                >
                    <Text style={styles.menuButtonText}>Add Location</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => {
                        setSelectedLocation(null);
                        setCurrentView("search");
                        fetchLocations();
                    }}
                    style={styles.menuButton}
                >
                    <Text style={styles.menuButtonText}>Search & Delete Locations</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setCurrentView("menu")}
                    style={styles.backButton}
                >
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (currentView === "users") {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Users</Text>
                <TextInput
                    placeholder="Search by Name & Surname or Email"
                    value={searchUserText}
                    onChangeText={setSearchUserText}
                    style={styles.input}
                />
                <FlatList
                    data={users.filter((user) =>
                        user.name.toLowerCase().includes(searchUserText.toLowerCase()) ||
                        user.surname.toLowerCase().includes(searchUserText.toLowerCase()) ||
                        user.email.toLowerCase().includes(searchUserText.toLowerCase())
                    )}
                    keyExtractor={(item) => item.email}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => { setSelectedUser(item) }}
                            style={styles.listItem}
                        >
                            {item.profilePictureUrl ? (
                                <Image
                                    source={{ uri: item.profilePictureUrl }}
                                    style={styles.profileImage}
                                />
                            ) : (
                                <View style={styles.profileImagePlaceholder}>
                                    <Text>No Image</Text>
                                </View>
                            )}
                            <View>
                                <Text style={styles.listText}>{item.name} {item.surname} - {item.country}</Text>
                                <Text style={styles.listText}>{item.email}</Text>
                            </View>
                        </TouchableOpacity>

                    )}
                />
                {selectedUser && (
                    <View style={styles.detailsContainer}>
                        <TouchableOpacity
                            onPress={() => setSelectedUser(null)}
                            style={styles.closeButton}
                        >
                            <Text style={styles.closeButtonText}>×</Text>
                        </TouchableOpacity>
                        {selectedUser.profilePictureUrl ? (
                            <Image
                                source={{ uri: selectedUser.profilePictureUrl }}
                                style={styles.profileImageDetails}
                            />
                        ) : (
                            <View style={styles.profileImagePlaceholder}>
                                <Text>No Image</Text>
                            </View>
                        )}
                        <Text>Name: {selectedUser.name}</Text>
                        <Text>Surname: {selectedUser.surname}</Text>
                        <Text>Country: {selectedUser.country}</Text>
                        <Text>Email: {selectedUser.email}</Text>
                        <TouchableOpacity
                            onPress={() => deleteUser(selectedUser.email)}
                            style={styles.deleteButton}
                        >
                            <Text style={styles.deleteButtonText}>Delete User</Text>
                        </TouchableOpacity>
                    </View>
                )}
                <TouchableOpacity
                    onPress={() => {
                        setSelectedUser(null);
                        setCurrentView("menu");
                    }}
                    style={styles.backButton}
                >
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (currentView === "add") {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Add Location</Text>
                <TextInput
                    placeholder="Location Name"
                    value={locationName}
                    onChangeText={setLocationName}
                    style={styles.input}
                    returnKeyType="done"
                />
                <TextInput
                    placeholder="Location Comment"
                    value={locationComment}
                    onChangeText={setLocationComment}
                    style={styles.input}
                    multiline={true}
                    returnKeyType="done"
                    onEndEditing={() => Keyboard.dismiss()}
                    blurOnSubmit={true}
                />
                <TextInput
                    placeholder="Coordinates (e.g. 12.1234 123.1234)"
                    value={coordinate}
                    onChangeText={setCoordinate}
                    style={styles.input}
                    returnKeyType="done"
                />
                {thumbnail && <Image source={{ uri: thumbnail }} style={styles.thumbnail} />}
                <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                    <Text style={styles.imagePickerText}>Pick Thumbnail</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleLocationFormSubmit}
                    style={styles.submitButton}
                >
                    <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setCurrentView("locations")}
                    style={styles.backButton}
                >
                    <Text style={styles.backButtonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (currentView === "search") {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Search & Delete Locations</Text>
                <TextInput
                    placeholder="Search Locations"
                    value={searchText}
                    onChangeText={setSearchText}
                    style={styles.input}
                />
                <FlatList
                    data={locations.filter(location =>
                        location.name.toLowerCase().includes(searchText.toLowerCase())
                    )}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => setSelectedLocation(item)}
                            style={styles.listItem}
                        >
                            <Image
                                source={{ uri: item.thumbnail }}
                                style={styles.locationThumbnail}
                            />
                            <Text style={styles.listText}>{item.name}</Text>
                        </TouchableOpacity>
                    )}
                />
                {selectedLocation && (
                    <View style={styles.detailsContainer}>
                        <TouchableOpacity
                            onPress={() => setSelectedLocation(null)}
                            style={styles.closeButton}
                        >
                            <Text style={styles.closeButtonText}>×</Text>
                        </TouchableOpacity>
                        {selectedLocation.thumbnail ? (
                            <Image
                                source={{ uri: selectedLocation.thumbnail }}
                                style={styles.locationThumbnail}
                            />
                        ) : (
                            <View style={styles.locationThumbnailPlaceholder}>
                                <Text>No Image</Text>
                            </View>
                        )}
                        <Text>Name: {selectedLocation.name}</Text>
                        <Text>Location ID: {selectedLocation.locationId}</Text>
                        <Text>Coordinates: {selectedLocation.coordinate}</Text>
                        <TouchableOpacity
                            onPress={() => deleteLocation(selectedLocation.id)}
                            style={styles.deleteButton}
                        >
                            <Text style={styles.deleteButtonText}>Delete Location</Text>
                        </TouchableOpacity>
                    </View>
                )}
                <TouchableOpacity
                    onPress={() => setCurrentView("locations")}
                    style={styles.backButton}
                >
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (currentView === "posts") {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Posts</Text>

                <TouchableOpacity
                    onPress={() => {
                        setCurrentView("allPosts");
                        setSelectedPost(null);
                        fetchPosts();
                    }}
                    style={styles.menuButton}
                >
                    <Text style={styles.menuButtonText}>All Posts</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => {
                        setCurrentView("approvedPosts");
                        setSelectedPost(null);
                        fetchApprovedPosts();
                    }}
                    style={styles.menuButton}
                >
                    <Text style={styles.menuButtonText}>Approved Posts</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => {
                        setCurrentView("unapprovedPosts");
                        setSelectedPost(null);
                        fetchUnapprovedPosts();
                    }}
                    style={styles.menuButton}
                >
                    <Text style={styles.menuButtonText}>Unapproved Posts</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setCurrentView("menu")}
                    style={styles.backButton}
                >
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (currentView === "allPosts") {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>All Posts</Text>

                <TextInput
                    placeholder="Search Posts"
                    value={searchPostText}
                    onChangeText={setSearchPostText}
                    style={styles.input}
                />

                <FlatList
                    data={posts.filter((post) =>
                        post.title.toLowerCase().includes(searchPostText.toLowerCase())
                    )}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => setSelectedPost(item)}
                            style={styles.listItem}
                        >
                            <Text style={styles.listText}>{item.title}</Text>
                        </TouchableOpacity>
                    )}
                />

                {selectedPost && (
                    <View style={styles.detailsContainer}>
                        <TouchableOpacity
                            onPress={() => setSelectedPost(null)}
                            style={styles.closeButton}
                        >
                            <Text style={styles.closeButtonText}>×</Text>
                        </TouchableOpacity>

                        <FlatList
                            horizontal={true}
                            data={selectedPost.photos}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => (
                                <Image source={{ uri: item }} style={styles.postImage} />
                            )}
                        />

                        <Text style={styles.titleText}>Title: {selectedPost.title}</Text>
                        <Text>Comment: {selectedPost.comment}</Text>

                        <Text style={styles.label}>Location: {selectedPost.locationName}</Text>
                        <Text style={styles.label}>User: {selectedPost.userName} {selectedPost.userSurname}</Text>
                        <Text>
                            Created At: {new Date(selectedPost.createdAt._seconds * 1000).toLocaleString()}
                        </Text>
                        <Text>
                            Updated At: {new Date(selectedPost.updatedAt._seconds * 1000).toLocaleString()}
                        </Text>

                        <View style={styles.ratesContainer}>
                            {selectedPost.rates.map((rate, index) => (
                                <Text key={index}>
                                    {rate.factor}: {rate.value}
                                </Text>
                            ))}
                        </View>

                        <Text style={styles.label}>
                            Approved: {selectedPost.approved ? 'Yes' : 'No'}
                        </Text>

                        {selectedPost.approved ? (
                            <TouchableOpacity
                                onPress={() => setIsDeleteModalVisible(true)}
                                style={styles.deleteButton}
                            >
                                <Text style={styles.deleteButtonText}>Delete Post</Text>
                            </TouchableOpacity>
                        ) : (
                            <View>
                                <TouchableOpacity
                                    onPress={() => {
                                        approvePost(selectedPost.id);
                                        setSelectedPost(null);
                                        fetchPosts();
                                    }}
                                    style={styles.approveButton}
                                >
                                    <Text style={styles.approveButtonText}>Approve Post</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => {
                                        setIsRejectModalVisible(true);
                                    }}
                                    style={styles.rejectButton}
                                >
                                    <Text style={styles.rejectButtonText}>Reject Post</Text>
                                </TouchableOpacity>

                            </View>
                        )}
                    </View>
                )}

                <TouchableOpacity
                    onPress={() => setCurrentView("posts")}
                    style={styles.backButton}
                >
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>

                <Modal
                    visible={isDeleteModalVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setIsDeleteModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Enter a reason for deletion</Text>
                            <TextInput
                                placeholder="Reason for deletion"
                                value={deleteMessage}
                                onChangeText={setDeleteMessage}
                                style={styles.input}
                            />
                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    onPress={() => setIsDeleteModalVisible(false)}
                                    style={styles.cancelButton}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        handleDelete(selectedPost.id);
                                    }}
                                    style={styles.confirmButton}
                                >
                                    <Text style={styles.confirmButtonText}>Confirm</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                <Modal
                    visible={isRejectModalVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setIsRejectModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Enter a reason for rejection</Text>
                            <TextInput
                                placeholder="Reason for rejection"
                                value={rejectMessage}
                                onChangeText={setRejectMessage}
                                style={styles.input}
                            />
                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    onPress={() => setIsRejectModalVisible(false)}
                                    style={styles.cancelButton}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleReject(selectedPost.id)}
                                    style={styles.confirmButton}
                                >
                                    <Text style={styles.confirmButtonText}>Confirm</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        );
    }

    if (currentView === "approvedPosts") {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Approved Posts</Text>

                <TextInput
                    placeholder="Search Posts"
                    value={searchPostText}
                    onChangeText={setSearchPostText}
                    style={styles.input}
                />

                <FlatList
                    data={posts.filter((post) => post.approved && post.title.toLowerCase().includes(searchPostText.toLowerCase()))}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => setSelectedPost(item)}
                            style={styles.listItem}
                        >
                            <Text style={styles.listText}>{item.title}</Text>
                        </TouchableOpacity>
                    )}
                />

                {selectedPost && (
                    <View style={styles.detailsContainer}>
                        <TouchableOpacity
                            onPress={() => setSelectedPost(null)}
                            style={styles.closeButton}
                        >
                            <Text style={styles.closeButtonText}>×</Text>
                        </TouchableOpacity>

                        <Text style={styles.titleText}>Title: {selectedPost.title}</Text>
                        <Text>Comment: {selectedPost.comment}</Text>

                        <Text style={styles.label}>Location: {selectedPost.locationName}</Text>
                        <Text style={styles.label}>User: {selectedPost.userName}</Text>
                        <Text>
                            Created At: {new Date(selectedPost.createdAt._seconds * 1000).toLocaleString()}
                        </Text>
                        <Text>
                            Updated At: {new Date(selectedPost.updatedAt._seconds * 1000).toLocaleString()}
                        </Text>

                        <FlatList
                            horizontal={true}
                            data={selectedPost.photos}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => (
                                <Image source={{ uri: item }} style={styles.postImage} />
                            )}
                        />

                        <View style={styles.ratesContainer}>
                            {selectedPost.rates.map((rate, index) => (
                                <Text key={index}>
                                    {rate.factor}: {rate.value}
                                </Text>
                            ))}
                        </View>

                        <Text style={styles.label}>
                            Approved: {selectedPost.approved ? 'Yes' : 'No'}
                        </Text>

                        <TouchableOpacity
                            onPress={() => setIsDeleteModalVisible(true)}
                            style={styles.deleteButton}
                        >
                            <Text style={styles.deleteButtonText}>Delete Post</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity
                    onPress={() => setCurrentView("posts")}
                    style={styles.backButton}
                >
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>

                <Modal
                    visible={isDeleteModalVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setIsDeleteModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Enter a reason for deletion</Text>
                            <TextInput
                                placeholder="Reason for deletion"
                                value={deleteMessage}
                                onChangeText={setDeleteMessage}
                                style={styles.input}
                            />
                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    onPress={() => setIsDeleteModalVisible(false)}
                                    style={styles.cancelButton}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        handleDelete(selectedPost.id);
                                        setIsDeleteModalVisible(false);
                                    }}
                                    style={styles.confirmButton}
                                >
                                    <Text style={styles.confirmButtonText}>Confirm</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        );
    }

    if (currentView === "unapprovedPosts") {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Unapproved Posts</Text>

                <TextInput
                    placeholder="Search Posts"
                    value={searchPostText}
                    onChangeText={setSearchPostText}
                    style={styles.input}
                />

                <FlatList
                    data={posts.filter((post) => !post.approved && post.title.toLowerCase().includes(searchPostText.toLowerCase()))}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => setSelectedPost(item)}
                            style={styles.listItem}
                        >
                            <Text style={styles.listText}>{item.title}</Text>
                        </TouchableOpacity>
                    )}
                />

                {selectedPost && (
                    <View style={styles.detailsContainer}>
                        <TouchableOpacity
                            onPress={() => setSelectedPost(null)}
                            style={styles.closeButton}
                        >
                            <Text style={styles.closeButtonText}>×</Text>
                        </TouchableOpacity>

                        <Text style={styles.titleText}>Title: {selectedPost.title}</Text>
                        <Text>Comment: {selectedPost.comment}</Text>

                        <Text style={styles.label}>Location: {selectedPost.locationName}</Text>
                        <Text style={styles.label}>User: {selectedPost.userName}</Text>
                        <Text>
                            Created At: {new Date(selectedPost.createdAt._seconds * 1000).toLocaleString()}
                        </Text>
                        <Text>
                            Updated At: {new Date(selectedPost.updatedAt._seconds * 1000).toLocaleString()}
                        </Text>

                        <FlatList
                            horizontal={true}
                            data={selectedPost.photos}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => (
                                <Image source={{ uri: item }} style={styles.postImage} />
                            )}
                        />

                        <View style={styles.ratesContainer}>
                            {selectedPost.rates.map((rate, index) => (
                                <Text key={index}>
                                    {rate.factor}: {rate.value}
                                </Text>
                            ))}
                        </View>

                        <Text style={styles.label}>
                            Approved: {selectedPost.approved ? 'Yes' : 'No'}
                        </Text>

                        <View>
                            <TouchableOpacity
                                onPress={() => {
                                    approvePost(selectedPost.id);
                                    setSelectedPost(null);
                                }}
                                style={styles.approveButton}
                            >
                                <Text style={styles.approveButtonText}>Approve Post</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => {
                                    setIsRejectModalVisible(true);
                                }}
                                style={styles.rejectButton}
                            >
                                <Text style={styles.rejectButtonText}>Reject Post</Text>
                            </TouchableOpacity>

                        </View>
                    </View>
                )}

                <TouchableOpacity
                    onPress={() => setCurrentView("posts")}
                    style={styles.backButton}
                >
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>

                <Modal
                    visible={isRejectModalVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setIsRejectModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Enter a reason for rejection</Text>
                            <TextInput
                                placeholder="Reason for rejection"
                                value={rejectMessage}
                                onChangeText={setRejectMessage}
                                style={styles.input}
                            />
                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    onPress={() => setIsRejectModalVisible(false)}
                                    style={styles.cancelButton}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleReject(selectedPost.id)}
                                    style={styles.confirmButton}
                                >
                                    <Text style={styles.confirmButtonText}>Confirm</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        );
    }

    if (currentView === "events") {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Events</Text>

                <TouchableOpacity
                    onPress={() => {
                        setCurrentView("approvedEvents");
                        setSelectedEvent(null);
                        fetchApprovedEvents();
                    }}
                    style={styles.menuButton}
                >
                    <Text style={styles.menuButtonText}>Approved Events</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => {
                        setCurrentView("unapprovedEvents");
                        setSelectedEvent(null);
                        fetchUnapprovedEvents();
                    }}
                    style={styles.menuButton}
                >
                    <Text style={styles.menuButtonText}>Unapproved Events</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setCurrentView("menu")}
                    style={styles.backButton}
                >
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (currentView === "approvedEvents") {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Approved Events</Text>

                <TextInput
                    placeholder="Search Events"
                    value={searchEventText}
                    onChangeText={setSearchEventText}
                    style={styles.input}
                />
                <FlatList
                    data={events.filter((event) => event.doesApprove)}
                    keyExtractor={(item) => item.eventId.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => setSelectedEvent(item)}
                            style={styles.listItem}
                        >
                            <Text style={styles.listText}>{item.locationName}</Text>
                        </TouchableOpacity>
                    )}
                />

                {selectedEvent && (
                    <View style={styles.detailsContainer}>
                        <TouchableOpacity
                            onPress={() => setSelectedEvent(null)}
                            style={styles.closeButton}
                        >
                            <Text style={styles.closeButtonText}>×</Text>
                        </TouchableOpacity>

                        <Text style={styles.label}>Location: {selectedEvent.locationName}</Text>
                        <Text style={styles.label}>Comment: {selectedEvent.comment}</Text>
                        <Text>
                            Event Start: {new Date(selectedEvent.eventStart._seconds * 1000).toLocaleString()}
                        </Text>
                        <Text>
                            Event Finish: {new Date(selectedEvent.eventFinish._seconds * 1000).toLocaleString()}
                        </Text>
                        <Text>
                            Created At: {new Date(selectedEvent.createdAt._seconds * 1000).toLocaleString()}
                        </Text>
                        <Text>
                            Updated At: {new Date(selectedEvent.updatedAt._seconds * 1000).toLocaleString()}
                        </Text>

                        <TouchableOpacity
                            onPress={() => {
                                deleteEvent(selectedEvent.eventId);
                                setSelectedEvent(null);
                            }}
                            style={styles.deleteButton}
                        >
                            <Text style={styles.deleteButtonText}>Delete Event</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity
                    onPress={() => setCurrentView("events")}
                    style={styles.backButton}
                >
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (currentView === "unapprovedEvents") {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Unapproved Events</Text>

                <TextInput
                    placeholder="Search Events"
                    value={searchEventText}
                    onChangeText={setSearchEventText}
                    style={styles.input}
                />

                <FlatList
                    data={events.filter((event) => !event.doesApprove)}
                    keyExtractor={(item) => item.eventId.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => setSelectedEvent(item)}
                            style={styles.listItem}
                        >
                            <Text style={styles.listText}>{item.locationName}</Text>
                        </TouchableOpacity>
                    )}
                />

                {selectedEvent && (
                    <View style={styles.detailsContainer}>
                        <TouchableOpacity
                            onPress={() => setSelectedEvent(null)}
                            style={styles.closeButton}
                        >
                            <Text style={styles.closeButtonText}>×</Text>
                        </TouchableOpacity>

                        <Text style={styles.label}>Location: {selectedEvent.locationName}</Text>
                        <Text>
                            Event Start: {new Date(selectedEvent.eventStart._seconds * 1000).toLocaleString()}
                        </Text>
                        <Text>
                            Event Finish: {new Date(selectedEvent.eventFinish._seconds * 1000).toLocaleString()}
                        </Text>
                        <Text>
                            Created At: {new Date(selectedEvent.createdAt._seconds * 1000).toLocaleString()}
                        </Text>
                        <Text>
                            Updated At: {new Date(selectedEvent.updatedAt._seconds * 1000).toLocaleString()}
                        </Text>

                        <TouchableOpacity
                            onPress={() => {
                                setIsCommentModalVisible(true);
                            }}
                            style={styles.approveButton}
                        >
                            <Text style={styles.approveButtonText}>Approve Event</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                deleteEvent(selectedEvent.eventId);
                                setSelectedEvent(null);
                            }}
                            style={styles.deleteButton}
                        >
                            <Text style={styles.deleteButtonText}>Reject Event</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity
                    onPress={() => setCurrentView("events")}
                    style={styles.backButton}
                >
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>

                <Modal
                    visible={isCommentModalVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setIsCommentModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Enter comment for event</Text>
                            <TextInput
                                placeholder="Event comment"
                                value={eventComment}
                                onChangeText={setEventComment}
                                style={styles.input}
                            />
                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    onPress={() => {
                                        setIsCommentModalVisible(false);
                                        setEventComment("");
                                    }}
                                    style={styles.cancelButton}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        approveEvent(selectedEvent.eventId, eventComment);
                                        setIsCommentModalVisible(false);
                                        setEventComment("");
                                        setSelectedEvent(null);
                                    }}
                                    style={styles.confirmButton}
                                >
                                    <Text style={styles.confirmButtonText}>Confirm</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal >
            </View >
        );
    }

    return null;
};

export default AdminPanel;