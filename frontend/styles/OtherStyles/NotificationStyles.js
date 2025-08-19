import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  notificationPanel: {
    position: "absolute",
    top: 110,
    width: 500,
    backgroundColor: "rgba(124, 124, 124, 0.2)",
    padding: 16,
    right: 45,
    marginHorizontal: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 10,
    height: "auto",
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notificationTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#f9f9f9",
    backgroundColor: "rgba(124, 124, 124, 0.1)",
  },
  separator: {
    height: 1,
    backgroundColor: "#f9f9f9",
    marginVertical: 10,
  },
  notificationContent: {
    flex: 1,
    flexWrap: "wrap",
    marginRight: 10,
    fontSize: 14,
    color: "#ccc",
    paddingRight: 20,
  },
  notificationBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    backgroundColor: "#E5E1DA",
    borderWidth: 1,
    borderColor: "white",
  },
  unreadNotification: {
    borderColor: "#fff",
    backgroundColor: "#F1F0E8",
  },
  readNotification: {
    borderColor: "white",
    backgroundColor: "#3214",
  },
  markAllAsReadButton: {
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 5,
    backgroundColor: "#444",
    height: 45,
    justifyContent: "center",
  },
  markAllAsReadText: {
    color: "white",
    fontWeight: "bold",
  },
  deleteAllNotificationsButton: {
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 5,
    backgroundColor: "#ff0000",
    height: 45,
    justifyContent: "center",
  },
  deleteAllNotificationsText: {
    color: "white",
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
});

export default styles;
