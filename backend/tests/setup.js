// Loaded via --import before any test file. Sets env vars so envVars.js validation passes.
process.env.MONGO_URI = "mongodb://localhost:27017/netflix-test";
process.env.JWT_SECRET = "test-jwt-secret-32-chars-minimum!";
process.env.TMDB_API_KEY = "test-tmdb-key-00000000000000000";
process.env.PORT = "5099";
process.env.NODE_ENV = "test";
