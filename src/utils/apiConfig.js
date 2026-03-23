// API 配置 - 默认使用公网IP
const getServiceUrl = (port) => {
  if (typeof window !== 'undefined') {
    // 获取公网IP或当前域名IP
    return `${window.location.protocol}//${window.location.hostname}:${port}`;
  }
  return `http://localhost:${port}`; // SSR环境默认值
};

export const API_CONFIG = {
  AI_SERVICE: getServiceUrl(5005),      // AI 聊天服务
  FILE_SERVICE: getServiceUrl(5006),   // 文件管理服务
};

// 获取后端 URL 的工具函数
export const getBackendUrl = (service = 'file') => {
  if (service === 'ai') {
    return API_CONFIG.AI_SERVICE;
  }
  return API_CONFIG.FILE_SERVICE;
};

// 手动设置服务器IP的函数
export const setServerIP = (ip) => {
  if (typeof window !== 'undefined') {
    window.SERVER_IP = ip;
    // 重新计算URL
    API_CONFIG.AI_SERVICE = `http://${ip}:5005`;
    API_CONFIG.FILE_SERVICE = `http://${ip}:5006`;
    console.log(`服务器IP已更新为: ${ip}`);
  }
};

// 获取当前服务器IP
export const getCurrentServerIP = () => {
  if (typeof window !== 'undefined') {
    return window.SERVER_IP || window.location.hostname;
  }
  return 'localhost';
};