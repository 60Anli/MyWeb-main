import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { useLocation } from '@docusaurus/router';
import ReactMarkdown from 'react-markdown';
import { chatWithAI } from '../../utils/aiService';
import styles from './styles.module.css';
//
function ChatButton() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatWindowRef = useRef(null);
  const logoUrl = useBaseUrl('/img/logo.svg');

  // 检测是否为移动端
  const isMobile = useCallback(() => window.innerWidth <= 768, []);

  // 使用 useMemo 缓存页面信息，避免重复计算
  const currentPageInfo = useMemo(() => {
    const pathname = location.pathname;
    
    if (pathname === '/') {
      return {
        type: 'homepage',
        path: '/',
        description: '正在浏览首页'
      };
    } else if (pathname.startsWith('/docs/')) {
      const docPath = pathname.replace('/docs/', '').replace(/\/$/, '');
      return {
        type: 'docs',
        path: pathname,
        docPath: docPath,
        description: `正在阅读文档: ${docPath}`
      };
    } else if (pathname.startsWith('/blog/')) {
      const blogPath = pathname.replace('/blog/', '').replace(/\/$/, '');
      return {
        type: 'blog',
        path: pathname,
        blogPath: blogPath,
        description: `正在阅读博客: ${blogPath}`
      };
    } else {
      return {
        type: 'other',
        path: pathname,
        description: `正在浏览页面: ${pathname}`
      };
    }
  }, [location.pathname]);

  // 使用 useCallback 优化滚动函数
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const preventBodyScroll = useCallback((prevent) => {
    if (!isMobile()) return; // 只在移动端处理
    
    const body = document.body;
    if (prevent) {
      body.style.cssText = 'overflow: hidden; position: fixed; width: 100%;';
    } else {
      body.style.cssText = '';
    }
  }, [isMobile]);

  // 修改点击处理逻辑
  const handleChatButtonClick = useCallback(() => {
    if (isMobile()) {
      // 移动端：跳转到新页面
      // 保存当前状态到 localStorage
      const chatState = {
        messages,
        currentPageInfo,
        timestamp: Date.now()
      };
      localStorage.setItem('mobileChatState', JSON.stringify(chatState));
      
      // 跳转到聊天页面
      window.location.href = '/chat';
    } else {
      // 桌面端：显示弹窗
      const newIsOpen = !isOpen;
      setIsOpen(newIsOpen);
      preventBodyScroll(newIsOpen);
      
      if (newIsOpen) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  }, [isMobile, isOpen, preventBodyScroll, messages, currentPageInfo]);

  const toggleChat = useCallback(() => {
    if (!isMobile()) {
      const newIsOpen = !isOpen;
      setIsOpen(newIsOpen);
      preventBodyScroll(newIsOpen);
      
      if (newIsOpen) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  }, [isOpen, preventBodyScroll, isMobile]);

  // 生成初始消息的函数
  const generateInitialMessage = useCallback((pageInfo) => {
    const messageMap = {
      homepage: "你好！我是AI助手，我看到你在首页，有什么可以帮助你的吗？",
      docs: `你好！我是AI助手，我看到你正在阅读文档：${pageInfo.docPath}，有什么可以帮助你的吗？`,
      blog: `你好！我是AI助手，我看到你正在阅读博客：${pageInfo.blogPath}，有什么可以帮助你的吗？`,
      other: `你好！我是AI助手，我看到你${pageInfo.description}，有什么可以帮助你的吗？`
    };
    
    return messageMap[pageInfo.type] || messageMap.other;
  }, []);

  // 简化的localStorage操作
  const saveToStorage = useCallback((key, value) => {
    if (isInitialized) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, [isInitialized]);

  const loadFromStorage = useCallback((key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error(`加载 ${key} 失败:`, e);
      return null;
    }
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // 重置输入框
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      let aiResponseText = '';
      let aiMessageId = null;

      // 确定传递路径
      const pathToSend = currentPageInfo.type === 'docs' && currentPageInfo.docPath 
        ? currentPageInfo.docPath 
        : currentPageInfo.path;

      await chatWithAI(
        [...messages, userMessage], 
        (chunk) => {
          aiResponseText += chunk;
          
          if (!aiMessageId) {
            aiMessageId = Date.now() + 1;
            const aiMessage = {
              id: aiMessageId,
              text: chunk,
              sender: 'ai',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);
            setIsTyping(false);
          } else {
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, text: aiResponseText }
                : msg
            ));
          }
        },
        (toolResult) => {
          console.log('🔧 工具调用结果:', toolResult);
        },
        pathToSend
      );
    } catch (error) {
      console.error('AI聊天错误:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        text: "抱歉，我现在无法回复。请稍后再试。",
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, isTyping, messages, currentPageInfo]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleInputChange = useCallback((e) => {
    setInputValue(e.target.value);
    
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
  }, []);

  const formatTime = useCallback((timestamp) => {
    return timestamp.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, []);

  // 简化的初始化逻辑
  useEffect(() => {
    if (!isInitialized) {
      const savedIsOpen = loadFromStorage('chatWindowOpen');
      const savedMessages = loadFromStorage('chatMessages');
      
      if (savedIsOpen && !isMobile()) setIsOpen(savedIsOpen);
      
      if (savedMessages?.length) {
        const validMessages = savedMessages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(validMessages);
      } else {
        // 设置初始消息
        setMessages([{
          id: 1,
          text: generateInitialMessage(currentPageInfo),
          sender: 'ai',
          timestamp: new Date()
        }]);
      }
      
      setIsInitialized(true);
    }
  }, [isInitialized, currentPageInfo, loadFromStorage, generateInitialMessage, isMobile]);

  // 统一的滚动处理
  useEffect(() => {
    if (messages.length > 0 && isOpen) {
      const timer = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, isOpen, scrollToBottom]);

  // 保存状态
  useEffect(() => {
    if (!isMobile()) {
      saveToStorage('chatWindowOpen', isOpen);
    }
  }, [isOpen, saveToStorage, isMobile]);

  useEffect(() => {
    if (messages.length > 0) {
      saveToStorage('chatMessages', messages);
    }
  }, [messages, saveToStorage]);

  // 清理函数
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isOpen) {
        localStorage.removeItem('chatWindowOpen');
        localStorage.removeItem('chatMessages');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      preventBodyScroll(false);
    };
  }, [isOpen, preventBodyScroll]);

  return (
    <div className={styles.chatButtonContainer}>
      <button 
        className={`${styles.chatButton} ${isOpen ? styles.chatButtonActive : ''}`}
        onClick={handleChatButtonClick}
        title="AI 聊天助手"
      >
        <img src={logoUrl} alt="Chat" className={styles.chatIcon} />
        <span className={styles.chatBadge}>AI</span>
      </button>
      
      {/* 只在桌面端显示弹窗 */}
      {isOpen && !isMobile() && (
        <div className={styles.chatWindow} ref={chatWindowRef}>
          <div className={styles.chatHeader}>
            <div className={styles.chatHeaderInfo}>
              <div className={styles.chatHeaderTitle}>
                AI 助手 
              </div>
              <div className={styles.chatHeaderStatus}>
                在线 • {currentPageInfo.description}
              </div>
            </div>
            <button 
              className={styles.chatCloseButton}
              onClick={toggleChat}
              title="关闭聊天"
            >
              ×
            </button>
          </div>
          
          <div className={styles.chatMessages}>
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`${styles.message} ${styles[message.sender]}`}
              >
                <div className={styles.messageContent}>
                  <div className={styles.messageText}>
                    {message.sender === 'ai' ? (
                      <ReactMarkdown>{message.text}</ReactMarkdown>
                    ) : (
                      message.text
                    )}
                  </div>
                  <div className={styles.messageTime}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className={`${styles.message} ${styles.ai}`}>
                <div className={styles.messageContent}>
                  <div className={styles.typingIndicator}>
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          <div className={styles.chatInput}>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="输入消息..."
              className={styles.chatInputField}
              rows={1}
              disabled={isTyping}
            />
            <button 
              onClick={handleSendMessage}
              className={styles.chatSendButton}
              disabled={!inputValue.trim() || isTyping}
              title="发送消息"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatButton;
