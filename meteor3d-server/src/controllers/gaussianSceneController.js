const fs = require('fs');
const path = require('path');

const DEFAULT_DATA_ROOT = '/home/jr/GS_Data/InteriorGS/InteriorGS_dataset';
const DATA_ROOT = process.env.INTERIOR_GS_DATA_ROOT || DEFAULT_DATA_ROOT;
const ALLOWED_FILES = new Set(['3dgs_compressed.ply', 'labels.json', 'structure.json', 'occupancy.json', 'occupancy.png']);

function safeScenePath(sceneId) {
  const cleanId = String(sceneId || '').trim();
  if (!/^[A-Za-z0-9_-]+$/.test(cleanId)) return null;
  const resolved = path.resolve(DATA_ROOT, cleanId);
  const root = path.resolve(DATA_ROOT);
  return resolved.startsWith(root + path.sep) ? resolved : null;
}

async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(await fs.promises.readFile(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

async function fileStats(filePath) {
  try {
    return await fs.promises.stat(filePath);
  } catch {
    return null;
  }
}

async function isSceneDir(dirPath) {
  const stat = await fileStats(path.join(dirPath, '3dgs_compressed.ply'));
  return Boolean(stat?.isFile());
}

function summarizeCategories(labels) {
  if (!Array.isArray(labels)) return [];
  const counts = new Map();
  for (const item of labels) {
    const name = item?.label || item?.category || 'unknown';
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, count]) => ({ name, count }));
}

async function buildSceneSummary(id) {
  const dir = safeScenePath(id);
  if (!dir || !(await isSceneDir(dir))) return null;

  const [plyStat, labels, structure, occupancy, occupancyImage] = await Promise.all([
    fileStats(path.join(dir, '3dgs_compressed.ply')),
    readJson(path.join(dir, 'labels.json'), []),
    readJson(path.join(dir, 'structure.json'), {}),
    readJson(path.join(dir, 'occupancy.json'), null),
    fileStats(path.join(dir, 'occupancy.png')),
  ]);

  return {
    id,
    title: id,
    plyBytes: plyStat?.size || 0,
    labels: Array.isArray(labels) ? labels.length : 0,
    rooms: Array.isArray(structure?.rooms) ? structure.rooms.length : 0,
    hasOccupancyImage: Boolean(occupancyImage),
    categories: summarizeCategories(labels),
    occupancy,
  };
}

exports.listScenes = async (req, res) => {
  try {
    const entries = await fs.promises.readdir(DATA_ROOT, { withFileTypes: true });
    const summaries = [];
    for (const entry of entries.filter(item => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
      const summary = await buildSceneSummary(entry.name);
      if (summary) summaries.push(summary);
    }
    res.json({ root: DATA_ROOT, count: summaries.length, scenes: summaries });
  } catch (error) {
    res.status(500).json({ message: 'Failed to scan gaussian scenes', error: error.message, root: DATA_ROOT });
  }
};

exports.getScene = async (req, res) => {
  const dir = safeScenePath(req.params.id);
  if (!dir || !(await isSceneDir(dir))) {
    return res.status(404).json({ message: 'Gaussian scene not found' });
  }

  const [summary, labels, structure, occupancy] = await Promise.all([
    buildSceneSummary(req.params.id),
    readJson(path.join(dir, 'labels.json'), []),
    readJson(path.join(dir, 'structure.json'), {}),
    readJson(path.join(dir, 'occupancy.json'), null),
  ]);

  res.json({ ...summary, labels, structure, occupancy });
};

exports.streamSceneFile = async (req, res) => {
  const dir = safeScenePath(req.params.id);
  const filename = String(req.params.filename || '');
  if (!dir || !ALLOWED_FILES.has(filename)) {
    return res.status(404).json({ message: 'Gaussian file not found' });
  }

  const filePath = path.join(dir, filename);
  const stat = await fileStats(filePath);
  if (!stat?.isFile()) {
    return res.status(404).json({ message: 'Gaussian file not found' });
  }

  const contentType = filename.endsWith('.json')
    ? 'application/json; charset=utf-8'
    : filename.endsWith('.png')
      ? 'image/png'
      : 'application/octet-stream';

  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
  res.setHeader('Content-Type', contentType);

  const range = req.headers.range;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) return res.status(416).end();
    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Number(match[2]) : stat.size - 1;
    if (start >= stat.size || end >= stat.size || start > end) {
      res.setHeader('Content-Range', `bytes */${stat.size}`);
      return res.status(416).end();
    }
    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
    res.setHeader('Content-Length', end - start + 1);
    if (req.method === 'HEAD') return res.end();
    return fs.createReadStream(filePath, { start, end }).pipe(res);
  }

  res.setHeader('Content-Length', stat.size);
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(filePath).pipe(res);
};
