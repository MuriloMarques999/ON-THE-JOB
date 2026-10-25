const router = require('express').Router();
const { autenticar, exigeRole } = require('../middlewares/auth');
const { listar, criar } = require('../controllers/gestores.controller');

router.use(autenticar, exigeRole('rh'));
router.get('/', listar);
router.post('/', criar);

module.exports = router;