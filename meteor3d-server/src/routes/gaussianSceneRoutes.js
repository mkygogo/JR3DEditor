const express = require('express');
const router = express.Router();
const gaussianSceneController = require('../controllers/gaussianSceneController');

router.get('/', gaussianSceneController.listScenes);
router.get('/:id', gaussianSceneController.getScene);
router.get('/:id/files/:filename', gaussianSceneController.streamSceneFile);
router.head('/:id/files/:filename', gaussianSceneController.streamSceneFile);

module.exports = router;
