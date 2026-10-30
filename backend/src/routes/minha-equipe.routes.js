const router = require('express').Router();
const { autenticar, exigeRole } = require('../middlewares/auth');
const c = require('../controllers/minha-equipe.controller');

router.use(autenticar, exigeRole('gestor'));

router.get('/home', c.home);
router.get('/equipe', c.equipe);
router.get('/atencao', c.atencao);
router.get('/documentos/:id/assinatura', c.telaAssinatura);
router.post('/documentos/:id/assinar', c.assinar);
router.get('/documentos/:id/conclusao', c.conclusao);
router.post('/colaboradores/:id/feedbacks', c.enviarFeedback);

module.exports = router;