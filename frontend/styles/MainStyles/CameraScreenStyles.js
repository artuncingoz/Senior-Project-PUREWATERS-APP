import { BottomTabBar } from "@react-navigation/bottom-tabs";
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  camera: {
    flex: 1,
  },
  BottomTabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#F1F0E8",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    paddingVertical: 10,
    height: 120,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  button: {
    alignSelf: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    margin: 100,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#D3D3D3",
    width: 80,
    height: 80,
  },
  button2: {
    alignSelf: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    margin: 100,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#D3D3D3",
    width: 50,
    height: 50,
  },
  text: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
  },
  image: {
    flex: 1,
    resizeMode: "contain",
    margin: 10,
  },
});

export default styles;
