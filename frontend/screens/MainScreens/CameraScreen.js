import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { Button, Text, TouchableOpacity, View, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import styles from "../../styles/MainStyles/CameraScreenStyles";
import { Ionicons } from "@expo/vector-icons";


const CameraScreen = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [photos, setPhotos] = useState([]);
  const cameraRef = useRef(null);
  const navigation = useNavigation();

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      const newPhotos = [...photos, photo.uri];
      setPhotos(newPhotos);

      navigation.navigate('CameraSecond', { photos: newPhotos, setPhotos });
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }


  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera}>
        <View style={styles.BottomTabBar}>
          <TouchableOpacity style={{ position: "absolute" }} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={32} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={takePicture}>
          </TouchableOpacity>

        </View>
      </CameraView>
    </View>
  );
};



export default CameraScreen;