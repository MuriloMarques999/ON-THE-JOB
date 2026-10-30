const jwt = require('jsonwebtoken');

// Só valida o token. Usado pela rota que registra o aceite dos termos.
function autenticarSemTermos(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ erro: 'Faça login para continuar.' });
  }
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET); // { id, role, termos }
    next();
  } catch {
    return res.status(401).json({ erro: 'Sessão expirada. Faça login novamente.' });
  }
}

// Valida o token e exige o aceite dos termos de uso / LGPD.
function autenticar(req, res, next) {
  autenticarSemTermos(req, res, () => {
    if (!req.usuario.termos) {
      return res.status(403).json({ erro: 'Aceite os termos de uso para acessar a plataforma.' });
    }
    next();
  });
}

function exigeRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.role)) {
      return res.status(403).json({ erro: 'Você não tem permissão para esta ação.' });
    }
    next();
  };
}

module.exports = { autenticar, autenticarSemTermos, exigeRole };