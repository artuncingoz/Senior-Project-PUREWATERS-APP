import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: 20,
    backgroundColor: "#F1F0E8", 
    padding: 20,
    alignItems: "center",
    paddingBottom: 30,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 50,
    backgroundColor: "#F1F0E8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
    gap: 30,
  },
  label: {
    borderRadius: 5,
    width: "100%",
    textAlign: "start",
    fontSize: 18,
    fontWeight: "bold",
    color: "#007BFF",
    padding: 10,
  },
  label2: {
    borderRadius: 5,
    width: "100%",
    textAlign: "start",
    fontSize: 16,
    color: "#555",
    padding: 10,
  },
  label3: {
    borderRadius: 5,
    width: "100%",
    textAlign: "start",
    fontSize: 14,
    color: "#1e509a",
    padding: 10,
  },

  title: {
    height: 45,
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
  },

  profilecontainer: {
    width: "auto",
    borderRadius: 10,
    gap: 20,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },

  /** HEADER **/
  headerContainer: {
    backgroundColor: "#1e509a", 
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: "center",
    marginBottom: 10,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "#f9f9f9", 
    marginBottom: 10,
  },
  noProfilePicture: {
    color: "#f9f9f9", 
    fontSize: 14,
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f9f9f9", 
    borderRadius: 8,
    overflow: "hidden",
  },
  searchInput: {
    flex: 1,
    padding: 10,
    fontSize: 14,
    color: "#333",
  },
  searchButton: {
    backgroundColor: "#007BFF",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchButtonText: {
    color: "#f9f9f9", 
    fontWeight: "600",
  },

  /** GROUP **/
  groupContainer: {
    marginHorizontal: 10,
    marginBottom: 20,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#B3C8CF",
  },
  locationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007BFF", 
    marginBottom: 10,
  },

  /** POST **/
  postItem: {
    backgroundColor: "#F1F0E8", 
    borderRadius: 8,
    marginBottom: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#B3C8CF",
  },
  postTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    padding: 10,
  },
  postImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 5,
  },
  rateContainer: {
    padding: 10,
    gap: 10,
  },

  /** MODAL **/
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenPhoto: {
    width: "90%",
    height: "70%",
    borderRadius: 10,
  },
  closeModalButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "#f9f9f9", 
    borderRadius: 20,
    padding: 5,
  },
  closeModalButtonText: {
    fontSize: 20,
    color: "#333",
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

  /** LOADING **/
  loadingIndicator: {
    marginTop: 50,
    color: "#007BFF",
  },

  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  },
});

export default styles;
