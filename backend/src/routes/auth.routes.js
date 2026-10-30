const router = require('express').Router();
const { autenticarSemTermos } = require('../middlewares/auth');
const { login, concluirConta, aceitarTermos } = require('../controllers/auth.controller');

router.post('/login', login);
router.post('/concluir-conta', concluirConta);
router.post('/aceitar-termos', autenticarSemTermos, aceitarTermos);

module.exports = router;