// 主题相关的工具函数

// 配置常量
export const MANUAL_THEME_EXPIRY_HOURS = 3;
export const MANUAL_THEME_EXPIRY = MANUAL_THEME_EXPIRY_HOURS * 60 * 60 * 1000; // 3小时
export const STORAGE_KEY = 'docusaurus.manual.theme';

// 添加一个变量来跟踪上次日志输出的时间，避免重复输出
let lastLogTime = 0;
const LOG_INTERVAL = 5 * 60 * 1000; // 5分钟内不重复输出相同日志

/**
 * 检查并清理过期的手动主题设置
 * @param {Function} setColorMode - 设置主题的函数
 * @returns {Function|null} 清理函数
 */
export function checkExpiredTheme(setColorMode) {
  const manualThemeData = localStorage.getItem(STORAGE_KEY);
  
  if (manualThemeData) {
    try {
      const { theme, timestamp } = JSON.parse(manualThemeData);
      const now = Date.now();
      
      // 如果超过有效期，清除手动设置
      if (now - timestamp > MANUAL_THEME_EXPIRY) {
        clearManualTheme();
        
        // 重新应用系统偏好
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setColorMode(prefersDark ? 'dark' : 'light');
        
        console.log(`手动主题设置已过期（${MANUAL_THEME_EXPIRY_HOURS}小时），已重新启用自动主题检测`);
        lastLogTime = now; // 更新日志时间
        return null;
      }
      
      // 只在距离上次日志输出超过指定间隔时才输出日志
      if (now - lastLogTime > LOG_INTERVAL) {
        const remainingTime = MANUAL_THEME_EXPIRY - (now - timestamp);
        const remainingHours = Math.ceil(remainingTime / (60 * 60 * 1000));
        console.log(`手动主题设置还有 ${remainingHours} 小时过期`);
        lastLogTime = now;
      }
      
    } catch (error) {
      console.warn('主题数据格式错误，已清除:', error);
      clearManualTheme();
    }
  }
  
  return null;
}

/**
 * 保存手动设置的主题
 * @param {string} theme - 主题名称 ('light' | 'dark')
 */
export function saveManualTheme(theme) {
  const manualThemeData = {
    theme,
    timestamp: Date.now()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(manualThemeData));
}

/**
 * 清除手动主题设置
 */
export function clearManualTheme() {
  localStorage.removeItem(STORAGE_KEY);
  // 只清除我们自定义的存储，保留 Docusaurus 原生的主题设置
  // localStorage.removeItem('theme');
  // localStorage.removeItem('docusaurus.tab.colorMode');
}

/**
 * 获取手动主题的剩余时间
 * @returns {number|null} 剩余毫秒数，如果没有手动设置则返回 null
 */
export function getManualThemeRemainingTime() {
  const manualThemeData = localStorage.getItem(STORAGE_KEY);
  
  if (manualThemeData) {
    try {
      const { timestamp } = JSON.parse(manualThemeData);
      const now = Date.now();
      const remaining = MANUAL_THEME_EXPIRY - (now - timestamp);
      
      return remaining > 0 ? remaining : 0;
    } catch (error) {
      return null;
    }
  }
  
  return null;
}