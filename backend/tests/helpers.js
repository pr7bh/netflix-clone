/** Minimal mock req/res for unit-testing controllers without a real HTTP server. */

export function mockReq(overrides = {}) {
	return {
		body: {},
		params: {},
		cookies: {},
		user: null,
		...overrides,
	};
}

export function mockRes() {
	const res = {
		_status: 200,
		_body: null,
		_cookies: {},
	};

	res.status = (code) => {
		res._status = code;
		return res;
	};

	res.json = (body) => {
		res._body = body;
		return res;
	};

	res.clearCookie = (name) => {
		delete res._cookies[name];
		return res;
	};

	return res;
}
