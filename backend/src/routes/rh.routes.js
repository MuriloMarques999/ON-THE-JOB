const router = require('express').Router();
const { autenticar, exigeRole } = require('../middlewares/auth');
const c = require('../controllers/rh.controller');

router.use(autenticar, exigeRole('rh'));

router.get('/home', c.home);
router.get('/assinaturas', c.assinaturas);
router.get('/acompanhamento', c.acompanhamento);
router.get('/painel-gestores', c.painelGestores);
router.post('/documentos/:id/solicitar-assinatura', c.solicitarAssinatura);

module.exports = router;