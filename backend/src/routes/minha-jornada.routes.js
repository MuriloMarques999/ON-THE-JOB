const router = require('express').Router();
const { autenticar, exigeRole } = require('../middlewares/auth');
const c = require('../controllers/minha-jornada.controller');

router.use(autenticar, exigeRole('colaborador'));

router.get('/home', c.home);
router.get('/atividades', c.listarAtividades);
router.get('/documentos', c.documentos);
router.post('/atividades/:id/iniciar', c.iniciar);
router.post('/atividades/:id/concluir', c.concluir);
router.post('/documentos/:id/assinar', c.assinar);

module.exports = router;