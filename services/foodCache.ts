/**
 * Food Analysis Cache
 * 食物分析结果缓存服务
 */

import { FoodEntry } from '../types';

interface CachedFoodResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  timestamp: number; // 缓存时间戳
}

// 使用内存缓存（也可以扩展到 localStorage）
const foodCache = new Map<string, CachedFoodResult>();
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 天

/**
 * 生成缓存键
 * @param input 输入内容（图片 base64 或文字描述）
 * @returns string 缓存键
 */
const generateCacheKey = (input: string): string => {
  // 对于图片，使用前 100 个字符的 hash
  // 对于文字，使用文字本身（转小写并去除空格）
  if (input.length > 100) {
    // 图片 base64，使用前 100 个字符作为 key
    return `img_${input.substring(0, 100)}`;
  }
  // 文字描述，标准化后作为 key
  return `text_${input.toLowerCase().trim().replace(/\s+/g, '_')}`;
};

/**
 * 从缓存获取食物分析结果
 * @param input 输入内容（图片 base64 或文字描述）
 * @returns FoodEntry | null 缓存的结果或 null
 */
export const getCachedFoodResult = (input: string): Omit<FoodEntry, 'id' | 'timestamp' | 'imageUrl'> | null => {
  const key = generateCacheKey(input);
  const cached = foodCache.get(key);

  if (!cached) return null;

  // 检查缓存是否过期
  const now = Date.now();
  if (now - cached.timestamp > CACHE_DURATION) {
    foodCache.delete(key);
    return null;
  }

  // 返回缓存结果
  return {
    name: cached.name,
    calories: cached.calories,
    protein: cached.protein,
    carbs: cached.carbs,
    fats: cached.fats,
  };
};

/**
 * 保存食物分析结果到缓存
 * @param input 输入内容
 * @param result 分析结果
 */
export const cacheFoodResult = (
  input: string,
  result: Omit<FoodEntry, 'id' | 'timestamp' | 'imageUrl'>
): void => {
  const key = generateCacheKey(input);
  foodCache.set(key, {
    ...result,
    timestamp: Date.now(),
  });

  // 清理过期缓存（每 100 次操作清理一次）
  if (foodCache.size > 100) {
    const now = Date.now();
    for (const [k, v] of foodCache.entries()) {
      if (now - v.timestamp > CACHE_DURATION) {
        foodCache.delete(k);
      }
    }
  }
};

/**
 * 清除所有缓存
 */
export const clearFoodCache = (): void => {
  foodCache.clear();
};
