import axios from "axios";
import { ENV_VARS } from "../config/envVars.js";

export const fetchFromTMDB = async (url) => {
	const separator = url.includes("?") ? "&" : "?";
	const urlWithKey = `${url}${separator}api_key=${ENV_VARS.TMDB_API_KEY}`;

	const options = { headers: { accept: "application/json" } };

	const response = await axios.get(urlWithKey, options);

	if (response.status !== 200) {
		throw new Error("Failed to fetch data from TMDB" + response.statusText);
	}

	return response.data;
};
