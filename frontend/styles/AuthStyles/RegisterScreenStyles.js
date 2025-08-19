import { Header } from "@react-navigation/stack";
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: '100%',
		paddingVertical: 100,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
		gap: 20,
		backgroundColor: "#F1F0E8",
	},
	icon: {
		width: 100,
		height: 100,
	},
	input: {
		flex: 1,
		width: "100%",
		height: 40,
		borderWidth: 1,
		borderColor: "#B3C8CF",
		borderRadius: 10,
		paddingHorizontal: 10,
		backgroundColor: "#E5E1DA",
		fontSize: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.35,
		shadowRadius: 4,
		elevation: 2,


	},
	countryButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 10,
	},
	selectedCountry: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	countryText: {
		color: '#000',
	},
	placeholderText: {
		color: '#1e509a',
	},

	buttonLogin: {
		justifyContent: 1,
		height: 40,
		alignContent: "center",
		backgroundColor: "#E5E1DA",
		paddingHorizontal: 12,
		borderRadius: 15,
		width: "auto%",
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#B3C8CF",
		borderRadius: 10,
		fontSize: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.35,
		shadowRadius: 4,
		elevation: 2,
		justifyContent: "center",
	},

	button: {
		width: "auto%",
		height: 50,
		borderRadius: 10,
		backgroundColor: "#89A8B2",
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 2,
		borderColor: "#007AFF",
		marginBottom: 20,
	},
	buttonText: {
		color: "#1e509a",
		fontSize: 16,
		fontWeight: "auto",

	},
	HeaderText: {
		fontSize: 46,
		fontWeight: "bold",
		color: "#1e509a",
		marginBottom: 0,
	},
	buttoncontainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignContent: "center",
		marginTop: 10,
		width: "100%",
		gap: 10,
	},
	buttoncontainer2: {
		width: "100%",
		flexDirection: "column",
		alignContent: "center",
		marginTop: 10,
		justifyContent: "space-between",
		gap: 10,
	},
});

export default styles;
