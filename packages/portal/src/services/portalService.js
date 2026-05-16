import { API_BASE_URL } from '../config';

/**
 * 获取已发布场景列表
 */
export async function getPublishedScenes(page = 1, pageSize = 12) {
    const res = await fetch(`${API_BASE_URL}/portal/scenes?page=${page}&pageSize=${pageSize}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return { scenes: data.scenes, pagination: data.pagination };
}

/**
 * 通过 slug 加载已发布场景（完整数据）
 */
export async function getPublishedScene(slug) {
    const res = await fetch(`${API_BASE_URL}/portal/scenes/${encodeURIComponent(slug)}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return { objects: data.objects, metadata: data.metadata };
}

/**
 * 获取已发布应用列表
 */
export async function getPublishedApps(page = 1, pageSize = 12) {
    const res = await fetch(`${API_BASE_URL}/portal/apps?page=${page}&pageSize=${pageSize}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return { apps: data.apps, pagination: data.pagination };
}
