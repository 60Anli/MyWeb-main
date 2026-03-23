import React, { useState, useEffect } from 'react';
import { getBackendUrl } from '../../utils/apiConfig';
import styles from './styles.module.css';

function NavbarFileModal() {
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [showEditFileModal, setShowEditFileModal] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [currentFilePath, setCurrentFilePath] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDefaultContent, setIsDefaultContent] = useState(false);
  const [notification, setNotification] = useState(null); // 新增通知状态

  // 默认内容
  const defaultContent = '# 新文档\n\n请在这里编写内容...\n';

  // 显示通知
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 10000); // 延长到10秒，让你有足够时间看清通知
  };

  // 获取当前页面对应的文件路径
  const getCurrentFilePath = () => {
    const pathname = window.location.pathname;
    
    // 如果是首页，返回空
    if (pathname === '/' || pathname === '/my-website/') {
      return null;
    }
    
    // 移除基础路径前缀
    let cleanPath = pathname.replace('/my-website', '').replace(/^\//, '');
    
    // 移除 docs/ 前缀（如果存在）
    if (cleanPath.startsWith('docs/')) {
      cleanPath = cleanPath.replace('docs/', '');
    }
    
    // 如果路径为空或者是特殊页面，返回空
    if (!cleanPath || cleanPath.includes('search') || cleanPath.includes('blog')) {
      return null;
    }
    
    // URL 解码
    try {
      cleanPath = decodeURIComponent(cleanPath);
    } catch (error) {
      return null;
    }
    
    // 移除尾部的斜杠
    cleanPath = cleanPath.replace(/\/$/, '');
    
    // 处理 Docusaurus 路径映射
    let filePath;
    
    // 如果路径已经包含文件扩展名，直接使用
    if (cleanPath.includes('.')) {
      filePath = cleanPath;
    } else {
      // 添加.md后缀
      filePath = cleanPath + '.md';
    }
    
    return filePath;
  };

  // 验证文件名是否有效
  const validateFileName = (name) => {
    // 移除.md后缀进行验证
    const nameWithoutExt = name.replace(/\.md$/, '');
    
    // 检查是否为空
    if (!nameWithoutExt.trim()) {
      return { valid: false, message: '文件名不能为空' };
    }
    
    // 检查是否包含空格
    if (nameWithoutExt.includes(' ')) {
      return { valid: false, message: '文件名不能包含空格' };
    }
    
    // 检查是否包含特殊字符
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(nameWithoutExt)) {
      return { valid: false, message: '文件名不能包含特殊字符 < > : " / \\ | ? *' };
    }
    
    // 检查是否以点开头或结尾
    if (nameWithoutExt.startsWith('.') || nameWithoutExt.endsWith('.')) {
      return { valid: false, message: '文件名不能以点开头或结尾' };
    }
    
    // 检查长度
    if (nameWithoutExt.length > 100) {
      return { valid: false, message: '文件名长度不能超过100个字符' };
    }
    
    return { valid: true };
  };

  const handleCreateFile = async () => {
    if (!fileName.trim()) {
      showNotification('❌ 请输入文件名', 'error');
      return;
    }
    
    // 验证文件名
    const validation = validateFileName(fileName);
    if (!validation.valid) {
      showNotification(`❌ ${validation.message}`, 'error');
      return;
    }
    
    // 如果是默认内容，则使用空字符串
    const contentToSave = isDefaultContent ? '' : fileContent;
    
    setLoading(true);
    try {
      const response = await fetch(`${getBackendUrl('file')}/api/files/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace: 'docs',
          path: fileName.endsWith('.md') ? fileName : `${fileName}.md`,
          type: 'file',
          content: contentToSave
        })
      });

      const data = await response.json();
      if (data.success) {
        showNotification('🎉 文件创建成功！', 'success');
        setShowNewFileModal(false);
        setFileName('');
        setFileContent('');
        setIsDefaultContent(false);
        
      } else {
        showNotification(`❌ 创建失败: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('创建文件失败:', error);
      showNotification('❌ 创建文件失败，请检查网络连接', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadCurrentFile = async (filePath) => {
    if (!filePath) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${getBackendUrl('file')}/api/files/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace: 'docs',
          path: filePath
        })
      });

      const data = await response.json();
      if (data.success) {
        setFileContent(data.content);
        setCurrentFilePath(filePath);
      } else {
        showNotification(`❌ 读取失败: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('读取文件失败:', error);
      showNotification('❌ 读取文件失败，请检查网络连接', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCurrentFile = async () => {
    if (!currentFilePath) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${getBackendUrl('file')}/api/files/write`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace: 'docs',
          path: currentFilePath,
          content: fileContent
        })
      });

      const data = await response.json();
      if (data.success) {
        // showNotification('✅ 文件保存成功！', 'success'); // 注释掉这行，不显示通知
        
      } else {
        showNotification(`❌ 保存失败: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('保存文件失败:', error);
      showNotification('❌ 保存文件失败，请检查网络连接', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseNewFileModal = () => {
    setShowNewFileModal(false);
    setFileName('');
    setFileContent('');
    setIsDefaultContent(false);
  };

  const handleCloseEditFileModal = () => {
    setShowEditFileModal(false);
    setCurrentFilePath('');
    setFileContent('');
  };

  // 处理新建文件内容变化
  const handleNewFileContentChange = (e) => {
    const newValue = e.target.value;
    setFileContent(newValue);
    
    // 如果用户开始输入且当前是默认内容，清除默认内容标记
    if (isDefaultContent && newValue !== defaultContent) {
      setIsDefaultContent(false);
    }
  };

  // 处理新建文件内容焦点事件
  const handleNewFileContentFocus = () => {
    // 如果是默认内容，清空并取消默认内容标记
    if (isDefaultContent) {
      setFileContent('');
      setIsDefaultContent(false);
    }
  };

  // 设置全局函数供导航栏按钮调用
  useEffect(() => {
    window.openFileModal = async (type) => {
      if (type === 'new') {
        setFileName('');
        setFileContent(defaultContent);
        setIsDefaultContent(true); // 标记为默认内容
        setShowNewFileModal(true);
      } else if (type === 'edit-current') {
        const currentFile = getCurrentFilePath();
        
        if (currentFile) {
          setCurrentFilePath('');
          setFileContent('');
          setShowEditFileModal(true);
          
          // 延迟一下确保模态框已经显示
          setTimeout(() => {
            handleLoadCurrentFile(currentFile);
          }, 100);
        } else {
          showNotification('❌ 无法识别当前页面对应的文件，请确保您在文档页面中', 'error');
        }
      }
    };

    return () => {
      delete window.openFileModal;
    };
  }, []);

  return (
    <>
      {/* 自定义通知 */}
      {notification && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>
          <div className={styles.notificationContent}>
            <span className={styles.notificationMessage}>{notification.message}</span>
            <button 
              className={styles.notificationClose}
              onClick={() => setNotification(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 新建文件模态框 */}
      {showNewFileModal && (
        <div className={styles.modalOverlay} onClick={handleCloseNewFileModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>新建文件</h3>
              <button 
                className={styles.closeButton}
                onClick={handleCloseNewFileModal}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.inputGroup}>
                <label>文件名：</label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="请输入文件名（自动添加.md后缀）"
                  className={styles.fileNameInput}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>文件内容：</label>
                <textarea
                  value={fileContent}
                  onChange={handleNewFileContentChange}
                  onFocus={handleNewFileContentFocus}
                  placeholder="请输入文件内容..."
                  className={`${styles.fileContentTextarea} ${isDefaultContent ? styles.placeholderContent : ''}`}
                  rows={10}
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.confirmButton}
                onClick={handleCreateFile}
                disabled={loading || !fileName.trim()}
              >
                {loading ? '创建中...' : '创建文件'}
              </button>
              <button 
                className={styles.cancelButton}
                onClick={handleCloseNewFileModal}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑当前页面模态框 */}
      {showEditFileModal && (
        <div className={styles.modalOverlay} onClick={handleCloseEditFileModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>编辑文档</h3>
              <button 
                className={styles.closeButton}
                onClick={handleCloseEditFileModal}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              {currentFilePath && (
                <div className={styles.inputGroup}>
                  <label>当前文件：{currentFilePath}</label>
                </div>
              )}
              <div className={styles.inputGroup}>
                <label>文件内容：</label>
                <textarea
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  placeholder={loading ? "正在加载文件内容..." : "文件内容将在这里显示..."}
                  className={styles.fileContentTextarea}
                  rows={15}
                  disabled={loading}
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.confirmButton}
                onClick={handleSaveCurrentFile}
                disabled={loading || !currentFilePath || !fileContent.trim()}
              >
                {loading ? '保存中...' : '保存文件'}
              </button>
              <button 
                className={styles.cancelButton}
                onClick={handleCloseEditFileModal}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default NavbarFileModal;