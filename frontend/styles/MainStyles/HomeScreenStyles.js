import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 100,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "20%",
  },
  button: {
    backgroundColor: "#FF6B6B",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 1,
  },
  buttonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  iconStyle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -150 }, { translateY: -300 }],
    width: 300,
    padding: 100,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  }
});

export default styles;