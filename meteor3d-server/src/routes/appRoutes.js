const express = require('express');
const router = express.Router();
const appController = require('../controllers/appController');

// 获取应用列表
router.get('/list', appController.getAppList);

// 获取应用详情
router.get('/:id', appController.getApp);

// 创建应用
router.post('/', appController.createApp);

// 更新应用 (全量保存)
router.put('/:id', appController.updateApp);

// 删除应用
router.delete('/:id', appController.deleteApp);

// 发布/取消发布应用
router.post('/:id/publish', appController.publishApp);
router.post('/:id/unpublish', appController.unpublishApp);

module.exports = router;
