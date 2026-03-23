// AI服务配置和API调用 - 默认使用公网IP
import { API_CONFIG } from './apiConfig';

// 动态获取后端URL - 默认使用公网IP
const getBackendUrl = () => {
  if (typeof window !== 'undefined') {
    // 如果手动设置了服务器IP，优先使用
    if (window.SERVER_IP) {
      return `http://${window.SERVER_IP}:5005`;
    }
    // 默认使用当前域名的IP（公网IP）
    return `${window.location.protocol}//${window.location.hostname}:5005`;
  }
  return 'http://localhost:5005'; // SSR环境默认值
};

/**
 * 主要的AI聊天函数 - 流式输出
 * @param {Array} messages - 消息历史
 * @param {Function} onChunk - 接收到数据块时的回调函数
 * @param {string} pagePath - 当前页面路径
 * @returns {Promise<string>} 完整的AI回复
 */
export async function chatWithAI(messages, onChunk, onToolResult, pagePath = null) {
  try {
    // 动态获取当前的后端URL
    const currentBackendUrl = getBackendUrl();
    console.log('🌐 发送请求到:', currentBackendUrl);
    
    // 只保留最近的10条消息，避免token过多
    const recentMessages = messages.slice(-10);
    console.log('📝 发送消息数量:', recentMessages.length);
    console.log('📍 页面路径:', pagePath);
    
    const requestBody = {
      messages: recentMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      pagePath: pagePath,
      timestamp: new Date().toISOString(),
    };
    console.log('📤 请求体:', requestBody);
    
    const response = await fetch(`${currentBackendUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📡 响应状态:', response.status);

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let chunkCount = 0;

    console.log('🔄 开始读取流式数据...');

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('✅ 流式数据读取完成');
          break;
        }
        
        chunkCount++;
        const chunk = decoder.decode(value, { stream: true });
        console.log(`📦 收到chunk #${chunkCount}:`, chunk);
        
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            console.log('📄 处理数据行:', data);
            
            if (data === '[DONE]') {
              console.log('🏁 收到完成标记');
              return fullResponse;
            }
            
            try {
              const parsed = JSON.parse(data);
              console.log('📊 解析后的数据:', parsed);
              
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              
              if (parsed.content) {
                // 检查是否是工具调用结果
                if (parsed.content.startsWith('[TOOL_RESULT]') && parsed.content.endsWith('[/TOOL_RESULT]')) {
                  const toolResult = parsed.content.slice(13, -14); // 移除标记
                  console.log('🔧 收到工具调用结果:', toolResult);
                  if (onToolResult) {
                    onToolResult(toolResult);
                  }
                } else {
                  // 普通AI消息
                  fullResponse += parsed.content;
                  console.log('💬 累积内容长度:', fullResponse.length);
                  if (onChunk) {
                    console.log('📤 调用onChunk回调:', parsed.content);
                    onChunk(parsed.content);
                  }
                }
              }
            } catch (e) {
              console.warn('⚠️ JSON解析失败:', e, '原始数据:', data);
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
    
    console.log('📝 最终响应长度:', fullResponse.length);
    return fullResponse;
    
  } catch (error) {
    console.error('❌ AI API调用失败:', error);
    
    const errorMessage = (() => {
      if (error.message.includes('API key') || error.message.includes('401')) {
        return '抱歉，AI服务配置有误，请检查API密钥设置。';
      } else if (error.message.includes('quota') || error.message.includes('429')) {
        return '抱歉，AI服务配额已用完，请稍后再试。';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        return `抱歉，无法连接到AI服务 (${getBackendUrl()})，请检查网络或服务器状态。`;
      } else {
        return `抱歉，AI服务暂时不可用，请稍后再试。(${error.message})`;
      }
    })();
    
    if (onChunk) {
      onChunk(errorMessage);
    }
    return errorMessage;
  }
}

/**
 * 检查AI服务是否可用 - 简化版本，默认返回true
 */
export async function isAIServiceConfigured() {
  // 直接返回true，默认认为服务已配置
  return true;
}

/**
 * 获取当前使用的AI服务提供商 - 简化版本
 */
export async function getCurrentProvider() {
  // 直接返回固定的提供商名称
  return 'LangGraph Agent + 通义千问';
}

/**
 * 手动设置服务器IP地址
 * @param {string} ip - 服务器IP地址
 */
export function setServerIP(ip) {
  if (typeof window !== 'undefined') {
    window.SERVER_IP = ip;
    console.log(`AI服务地址已设置为: http://${ip}:5005`);
  }
}

/**
 * 获取当前配置的服务器IP
 */
export function getServerIP() {
  if (typeof window !== 'undefined') {
    return window.SERVER_IP || window.location.hostname;
  }
  return 'localhost';
}