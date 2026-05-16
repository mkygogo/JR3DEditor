const express = require('express');
const router = express.Router();
const Scene = require('../models/Scene');
const SceneObject = require('../models/SceneObject');
const App = require('../models/App');

/**
 * 门户公开 API — 仅返回已发布内容
 */

// GET /api/portal/scenes — 已发布场景列表
router.get('/scenes', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 12;
        const skip = (page - 1) * pageSize;

        const filter = { published: true };
        const total = await Scene.countDocuments(filter);

        const scenes = await Scene.find(filter, {
            sceneId: 1, name: 1, description: 1, thumbnail: 1,
            slug: 1, publishedAt: 1, objectCount: 1
        })
            .sort({ publishedAt: -1 })
            .skip(skip)
            .limit(pageSize);

        res.json({
            success: true,
            scenes,
            pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
        });
    } catch (error) {
        console.error('获取已发布场景失败:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/portal/scenes/:slug — 加载已发布场景（完整数据，供查看器使用）
router.get('/scenes/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const metadata = await Scene.findOne({ slug, published: true });

        if (!metadata) {
            return res.status(404).json({ success: false, message: '场景不存在或未发布' });
        }

        const objects = await SceneObject.find({ sceneId: metadata.sceneId });

        res.json({ success: true, objects, metadata });
    } catch (error) {
        console.error('加载已发布场景失败:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/portal/apps — 已发布应用列表
router.get('/apps', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 12;
        const skip = (page - 1) * pageSize;

        const filter = { published: true };
        const total = await App.countDocuments(filter);

        const apps = await App.find(filter, {
            appId: 1, name: 1, description: 1, thumbnail: 1,
            publishedAt: 1, 'canvas.width': 1, 'canvas.height': 1
        })
            .sort({ publishedAt: -1 })
            .skip(skip)
            .limit(pageSize);

        res.json({
            success: true,
            apps,
            pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
        });
    } catch (error) {
        console.error('获取已发布应用失败:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/portal/apps/:id — 已发布应用详情
router.get('/apps/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const app = await App.findOne({ appId: id, published: true });

        if (!app) {
            return res.status(404).json({ success: false, message: '应用不存在或未发布' });
        }

        res.json({ success: true, app });
    } catch (error) {
        console.error('获取已发布应用详情失败:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
