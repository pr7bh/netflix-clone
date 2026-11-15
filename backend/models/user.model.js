import mongoose from "mongoose";

const myListItemSchema = new mongoose.Schema(
	{
		id: { type: Number, required: true },
		title: { type: String, required: true },
		image: String,
		contentType: { type: String, enum: ["movie", "tv"], required: true },
		addedAt: { type: Date, default: Date.now },
	},
	{ _id: false }
);

const continueWatchingItemSchema = new mongoose.Schema(
	{
		id: { type: Number, required: true },
		title: { type: String, required: true },
		image: String,
		contentType: { type: String, enum: ["movie", "tv"], required: true },
		trailerKey: String,
		progress: { type: Number, default: 0 }, // seconds played
		duration: { type: Number, default: 0 }, // total seconds
		updatedAt: { type: Date, default: Date.now },
	},
	{ _id: false }
);

const profileSchema = new mongoose.Schema({
	name: { type: String, required: true, trim: true },
	avatar: { type: String, default: "/avatar1.png" },
	isKids: { type: Boolean, default: false },
	myList: { type: [myListItemSchema], default: [] },
	continueWatching: { type: [continueWatchingItemSchema], default: [] },
});

const userSchema = mongoose.Schema({
	username: { type: String, required: true, unique: true },
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	image: { type: String, default: "" },
	searchHistory: { type: Array, default: [] },
	profiles: { type: [profileSchema], default: [] },
});

export const User = mongoose.model("User", userSchema);
