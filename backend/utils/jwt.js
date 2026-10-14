// backend/utils/jwt.js
// One place that signs and checks login tokens, so every token uses the same
// algorithm and the same lifetime (code review CR-10).
const jwt = require('jsonwebtoken');

// Only this algorithm is accepted when a token is checked. Without the list,
// jsonwebtoken accepts any algorithm that suits the key, which is more than we use.
const ALGORITHM = 'HS256';
const EXPIRES_IN = '7d';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return secret;
}

function signToken(payload) {
  return jwt.sign(payload, getSecret(), { algorithm: ALGORITHM, expiresIn: EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, getSecret(), { algorithms: [ALGORITHM] });
}

// Called once when the server starts, so a missing secret stops the server
// straight away instead of failing on the first login.
function assertJwtSecret() {
  getSecret();
}

module.exports = { ALGORITHM, EXPIRES_IN, signToken, verifyToken, assertJwtSecret };
