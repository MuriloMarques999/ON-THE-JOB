const jwt = require('jsonwebtoken');

function tokenPara({ id, role, termos = true }) {
  return jwt.sign({ id, role, termos }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
}

module.exports = { tokenPara };
