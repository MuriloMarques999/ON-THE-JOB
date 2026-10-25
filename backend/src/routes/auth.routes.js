const router = require('express').Router();
const { login, concluirConta } = require('../controllers/auth.controller');

router.post('/login', login);
router.post('/concluir-conta', concluirConta);

module.exports = router;