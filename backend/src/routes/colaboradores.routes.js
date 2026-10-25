const router = require('express').Router();
const { autenticar, exigeRole } = require('../middlewares/auth');
const { criar } = require('../controllers/colaboradores.controller');

router.use(autenticar, exigeRole('rh'));
router.post('/', criar);

module.exports = router;