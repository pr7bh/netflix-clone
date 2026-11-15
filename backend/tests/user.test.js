/**
 * User controller unit tests — profiles, watchlist, continue watching.
 * Uses t.mock.method() to avoid real DB calls.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
	createProfile,
	updateProfile,
	deleteProfile,
	addToWatchlist,
	removeFromWatchlist,
	updateContinueWatching,
	getContinueWatching,
} from "../controllers/user.controller.js";
import { User } from "../models/user.model.js";
import { mockReq, mockRes } from "./helpers.js";

// ── Shared builders ───────────────────────────────────────────────────────────

function makeProfile(overrides = {}) {
	const p = {
		_id: "prof1",
		name: "Main",
		avatar: "/avatar1.png",
		isKids: false,
		myList: [],
		continueWatching: [],
		deleteOne: () => {},
		...overrides,
	};
	return p;
}

function makeUser(profiles) {
	const arr = profiles ?? [makeProfile()];
	arr.id = (id) => arr.find((p) => String(p._id) === String(id)) ?? null;
	return {
		_id: "user123",
		profiles: arr,
		save: async () => {},
	};
}

// ── Profiles ──────────────────────────────────────────────────────────────────

describe("createProfile", () => {
	test("rejects empty name", async (t) => {
		const user = makeUser();
		t.mock.method(User, "findById", async () => user);
		const res = mockRes();
		await createProfile(mockReq({ body: { name: "   " }, user }), res);
		assert.equal(res._status, 400);
		assert.match(res._body.message, /name is required/i);
	});

	test("rejects when at 5-profile limit", async (t) => {
		const profiles = Array.from({ length: 5 }, (_, i) => makeProfile({ _id: `p${i}`, name: `P${i}` }));
		const user = makeUser(profiles);
		t.mock.method(User, "findById", async () => user);
		const res = mockRes();
		await createProfile(mockReq({ body: { name: "Sixth" }, user }), res);
		assert.equal(res._status, 400);
		assert.match(res._body.message, /maximum/i);
	});

	test("creates profile successfully", async (t) => {
		const user = makeUser();
		t.mock.method(User, "findById", async () => user);
		const res = mockRes();
		await createProfile(mockReq({ body: { name: "Kids", isKids: true }, user }), res);
		assert.equal(res._status, 201);
		assert.equal(res._body.success, true);
	});
});

describe("updateProfile", () => {
	test("returns 404 for unknown profile id", async (t) => {
		const user = makeUser();
		t.mock.method(User, "findById", async () => user);
		const res = mockRes();
		await updateProfile(mockReq({ params: { profileId: "nonexistent" }, body: { name: "X" }, user }), res);
		assert.equal(res._status, 404);
	});

	test("updates name and isKids", async (t) => {
		const profile = makeProfile({ _id: "p1", name: "Old" });
		const user = makeUser([profile]);
		t.mock.method(User, "findById", async () => user);
		const res = mockRes();
		await updateProfile(
			mockReq({ params: { profileId: "p1" }, body: { name: "Updated", isKids: true }, user }),
			res
		);
		assert.equal(res._body.success, true);
	});
});

describe("deleteProfile", () => {
	test("refuses to delete last profile", async (t) => {
		const user = makeUser(); // 1 profile
		t.mock.method(User, "findById", async () => user);
		const res = mockRes();
		await deleteProfile(mockReq({ params: { profileId: "prof1" }, user }), res);
		assert.equal(res._status, 400);
		assert.match(res._body.message, /last profile/i);
	});

	test("returns 404 for unknown profile id", async (t) => {
		const profiles = [makeProfile({ _id: "p1" }), makeProfile({ _id: "p2" })];
		const user = makeUser(profiles);
		t.mock.method(User, "findById", async () => user);
		const res = mockRes();
		await deleteProfile(mockReq({ params: { profileId: "unknown" }, user }), res);
		assert.equal(res._status, 404);
	});
});

// ── Watchlist ─────────────────────────────────────────────────────────────────

describe("addToWatchlist", () => {
	test("rejects missing id/title/contentType", async (t) => {
		const user = makeUser();
		const res = mockRes();
		await addToWatchlist(
			mockReq({ params: { profileId: "prof1" }, body: { title: "Movie" }, user }),
			res
		);
		assert.equal(res._status, 400);
		assert.match(res._body.message, /required/i);
	});

	test("rejects duplicate entry with 409", async (t) => {
		const profile = makeProfile({ myList: [{ id: 42, title: "Existing", contentType: "movie" }] });
		const user = makeUser([profile]);
		t.mock.method(User, "findById", async () => user);
		const res = mockRes();
		await addToWatchlist(
			mockReq({
				params: { profileId: "prof1" },
				body: { id: 42, title: "Existing", contentType: "movie" },
				user,
			}),
			res
		);
		assert.equal(res._status, 409);
		assert.match(res._body.message, /already/i);
	});

	test("adds new item successfully", async (t) => {
		const user = makeUser();
		t.mock.method(User, "findById", async () => user);
		const res = mockRes();
		await addToWatchlist(
			mockReq({
				params: { profileId: "prof1" },
				body: { id: 100, title: "New Movie", contentType: "movie" },
				user,
			}),
			res
		);
		assert.equal(res._status, 201);
		assert.equal(res._body.success, true);
	});
});

describe("removeFromWatchlist", () => {
	test("removes item by contentId", async (t) => {
		const profile = makeProfile({
			myList: [
				{ id: 7, title: "Remove Me", contentType: "movie" },
				{ id: 8, title: "Keep Me", contentType: "movie" },
			],
		});
		const user = makeUser([profile]);
		t.mock.method(User, "findById", async () => user);
		const res = mockRes();
		await removeFromWatchlist(
			mockReq({ params: { profileId: "prof1", contentId: "7" }, user }),
			res
		);
		assert.equal(res._body.success, true);
		assert.equal(profile.myList.some((i) => i.id === 7), false);
		assert.equal(profile.myList.some((i) => i.id === 8), true);
	});
});

// ── Continue Watching ─────────────────────────────────────────────────────────

describe("updateContinueWatching", () => {
	test("rejects missing required fields", async () => {
		const user = makeUser();
		const res = mockRes();
		await updateContinueWatching(
			mockReq({ params: { profileId: "prof1" }, body: { title: "Movie" }, user }),
			res
		);
		assert.equal(res._status, 400);
	});

	test("skips saving when progress < 5 s (new entry)", async (t) => {
		const user = makeUser();
		t.mock.method(User, "findById", async () => user);
		const res = mockRes();
		await updateContinueWatching(
			mockReq({
				params: { profileId: "prof1" },
				body: { id: 1, title: "Movie", contentType: "movie", progress: 3 },
				user,
			}),
			res
		);
		assert.equal(res._body.success, true);
		assert.equal(res._body.skipped, true);
	});

	test("marks completed when progress > 95% of duration", async (t) => {
		const profile = makeProfile({
			continueWatching: [{ id: 10, progress: 90, duration: 100 }],
		});
		const user = makeUser([profile]);
		t.mock.method(User, "findById", async () => user);
		const res = mockRes();
		await updateContinueWatching(
			mockReq({
				params: { profileId: "prof1" },
				body: { id: 10, title: "Movie", contentType: "movie", progress: 97, duration: 100 },
				user,
			}),
			res
		);
		assert.equal(res._body.completed, true);
	});

	test("updates existing entry progress", async (t) => {
		const profile = makeProfile({
			continueWatching: [{ id: 5, title: "Movie", contentType: "movie", progress: 30, duration: 200, trailerKey: "abc", updatedAt: new Date() }],
		});
		const user = makeUser([profile]);
		t.mock.method(User, "findById", async () => user);
		const res = mockRes();
		await updateContinueWatching(
			mockReq({
				params: { profileId: "prof1" },
				body: { id: 5, title: "Movie", contentType: "movie", progress: 60, duration: 200 },
				user,
			}),
			res
		);
		assert.equal(res._body.success, true);
		assert.equal(profile.continueWatching[0].progress, 60);
	});
});

describe("getContinueWatching", () => {
	test("returns 404 for unknown profile", async () => {
		const user = makeUser();
		const res = mockRes();
		await getContinueWatching(
			mockReq({ params: { profileId: "nonexistent" }, user }),
			res
		);
		assert.equal(res._status, 404);
	});

	test("returns sorted list newest first", async () => {
		const older = { id: 1, title: "Old", updatedAt: new Date("2024-01-01") };
		const newer = { id: 2, title: "New", updatedAt: new Date("2024-06-01") };
		const profile = makeProfile({ continueWatching: [older, newer] });
		const user = makeUser([profile]);
		const res = mockRes();
		await getContinueWatching(
			mockReq({ params: { profileId: "prof1" }, user }),
			res
		);
		assert.equal(res._body.success, true);
		assert.equal(res._body.continueWatching[0].id, 2, "newer item should be first");
	});
});
