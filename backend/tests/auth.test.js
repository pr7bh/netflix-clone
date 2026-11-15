/**
 * Auth controller unit tests.
 * Uses t.mock.method() to mock DB calls; validation paths need no mocking at all.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import bcryptjs from "bcryptjs";
import { signup, login, logout, authCheck } from "../controllers/auth.controller.js";
import { User } from "../models/user.model.js";
import { mockReq, mockRes } from "./helpers.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fakeUserInstance(overrides = {}) {
	return {
		_id: "u1",
		email: "test@test.com",
		username: "testuser",
		image: "/avatar1.png",
		profiles: [{ name: "testuser", avatar: "/avatar1.png" }],
		password: "$2b$10$fakehashedpassword1234567890",
		save: async () => {},
		toObject() { return { ...this, toObject: undefined, save: undefined }; },
		...overrides,
	};
}

// ── signup ────────────────────────────────────────────────────────────────────

describe("signup", () => {
	test("rejects missing fields", async () => {
		const res = mockRes();
		await signup(mockReq({ body: { email: "a@b.com" } }), res);
		assert.equal(res._status, 400);
		assert.equal(res._body.success, false);
		assert.match(res._body.message, /required/i);
	});

	test("rejects invalid email format", async () => {
		const res = mockRes();
		await signup(mockReq({ body: { email: "notanemail", password: "pass123", username: "user" } }), res);
		assert.equal(res._status, 400);
		assert.match(res._body.message, /invalid email/i);
	});

	test("rejects password shorter than 6 characters", async () => {
		const res = mockRes();
		await signup(mockReq({ body: { email: "a@b.com", password: "123", username: "user" } }), res);
		assert.equal(res._status, 400);
		assert.match(res._body.message, /6 characters/i);
	});

	test("rejects duplicate email", async (t) => {
		t.mock.method(User, "findOne", async () => fakeUserInstance());
		const res = mockRes();
		await signup(mockReq({ body: { email: "existing@test.com", password: "pass123", username: "newuser" } }), res);
		assert.equal(res._status, 400);
		assert.match(res._body.message, /email already exists/i);
	});

	test("rejects duplicate username", async (t) => {
		let callCount = 0;
		t.mock.method(User, "findOne", async () => {
			callCount++;
			return callCount === 1 ? null : fakeUserInstance(); // 1st=email OK, 2nd=username taken
		});
		const res = mockRes();
		await signup(mockReq({ body: { email: "new@test.com", password: "pass123", username: "takenuser" } }), res);
		assert.equal(res._status, 400);
		assert.match(res._body.message, /username already exists/i);
	});

	test("creates user and omits password from response", async (t) => {
		t.mock.method(User, "findOne", async () => null);
		t.mock.method(User.prototype, "save", async () => {});

		const res = mockRes();
		res.cookie = () => res; // mock res.cookie for generateTokenAndSetCookie
		await signup(mockReq({ body: { email: "new@test.com", password: "pass123", username: "newuser" } }), res);
		assert.equal(res._status, 201);
		assert.equal(res._body.success, true);
		assert.equal(res._body.user.password, undefined, "password must not leak in response");
	});
});

// ── login ─────────────────────────────────────────────────────────────────────

describe("login", () => {
	test("rejects missing fields", async () => {
		const res = mockRes();
		await login(mockReq({ body: { email: "a@b.com" } }), res);
		assert.equal(res._status, 400);
		assert.match(res._body.message, /required/i);
	});

	test("rejects unknown email with 404", async (t) => {
		t.mock.method(User, "findOne", async () => null);
		const res = mockRes();
		await login(mockReq({ body: { email: "ghost@test.com", password: "pass123" } }), res);
		assert.equal(res._status, 404);
		assert.match(res._body.message, /invalid credentials/i);
	});

	test("rejects wrong password", async (t) => {
		const hash = await bcryptjs.hash("correctpassword", 10);
		t.mock.method(User, "findOne", async () => ({
			...fakeUserInstance({ password: hash }),
			toObject() { return this; },
		}));

		const res = mockRes();
		await login(mockReq({ body: { email: "test@test.com", password: "wrongpassword" } }), res);
		assert.equal(res._status, 400);
		assert.match(res._body.message, /invalid credentials/i);
	});

	test("accepts correct credentials", async (t) => {
		const hash = await bcryptjs.hash("correctpassword", 10);
		const user = {
			...fakeUserInstance({ password: hash }),
			toObject() {
				const { toObject: _, save: __, ...rest } = this;
				return rest;
			},
		};
		t.mock.method(User, "findOne", async () => user);

		const res = mockRes();
		res.cookie = () => res;
		await login(mockReq({ body: { email: "test@test.com", password: "correctpassword" } }), res);
		assert.equal(res._status, 200);
		assert.equal(res._body.success, true);
		assert.equal(res._body.user?.password, undefined, "password must not leak");
	});
});

// ── logout ────────────────────────────────────────────────────────────────────

describe("logout", () => {
	test("clears cookie and returns success", async () => {
		const res = mockRes();
		await logout(mockReq(), res);
		assert.equal(res._status, 200);
		assert.equal(res._body.success, true);
	});
});

// ── authCheck ─────────────────────────────────────────────────────────────────

describe("authCheck", () => {
	test("returns the attached user", async () => {
		const fakeUser = { _id: "u1", email: "a@b.com", username: "testuser" };
		const res = mockRes();
		await authCheck(mockReq({ user: fakeUser }), res);
		assert.equal(res._status, 200);
		assert.equal(res._body.success, true);
		assert.deepEqual(res._body.user, fakeUser);
	});
});
