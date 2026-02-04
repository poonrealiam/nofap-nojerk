/**
 * Image Utilities
 * 图片压缩和处理工具
 */

/**
 * 压缩图片到指定质量和尺寸
 * @param file 原始图片文件
 * @param maxWidth 最大宽度（默认 1024）
 * @param maxHeight 最大高度（默认 1024）
 * @param quality 压缩质量 0-1（默认 0.8）
 * @returns Promise<string> base64 字符串（包含 data:image/jpeg;base64, 前缀）
 */
export const compressImage = async (
  file: File,
  maxWidth: number = 1024,
  maxHeight: number = 1024,
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 计算缩放比例
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建 canvas context'));
          return;
        }

        // 绘制压缩后的图片
        ctx.drawImage(img, 0, 0, width, height);

        // 转换为 base64
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
};

/**
 * 获取图片的 base64（不含前缀）
 * @param base64String 完整的 base64 字符串（包含 data:image/...;base64, 前缀）
 * @returns string 纯 base64 字符串
 */
export const getBase64WithoutPrefix = (base64String: string): string => {
  return base64String.includes(',') ? base64String.split(',')[1] : base64String;
};
