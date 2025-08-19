import { Header } from "@react-navigation/stack";
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 30,
    alignItems: "stretch",
    justifyContent: "flex-start",
    backgroundColor: "#F1F0E8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
    gap: 20,
  },
  container: {
    flex: 1,
    flexGrow: 1,
    padding: 20,
    gap: 20,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
    paddingVertical: 10,
    gap: 10,
    backgroundColor: "#f9f9f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#007BFF",
  },
  image: {
    width: "30%",
    height: 100,
    borderRadius: 5,
  },
  input: {
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#333",
    shadowColor: "#000",
    backgroundColor: "#f9f9f9",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.55,
    shadowRadius: 4,
    elevation: 2,
    borderColor: "#007BFF",
    borderWidth: 1,
    borderStyle: "dotted",
  },
  dropdown: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 20,
  },
  dropdownItem: {
    backgroundColor: "#F1F0E8",
    padding: 10,
    gap: 10,
    borderRadius: 10,
    width: "100%",
  },
  buttonReject: {
    width: "45%",
    height: 50,
    backgroundColor: "#D9534F",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#B52A2A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },

  buttonTextReject: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  buttonConfirm: {
    width: "45%",
    height: 50,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#388E3C",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },

  buttonTextConfirm: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#FF6B6B",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 10,
  },
  Header: {
    borderRadius: 5,
    width: "100%",
    textAlign: "center",
    fontSize: 18,
    color: "#333",
    fontSize: 18,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },

  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e509a",
  },

  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  starIcon: {
    color: "#FFD700",
  },

  starIconInactive: {
    color: "#ccc",
  },
});

export default styles;
