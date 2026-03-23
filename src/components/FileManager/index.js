import React, { useState, useEffect } from 'react';
import { getBackendUrl } from '../../utils/apiConfig';

function FileManager() {
  const [fileTree, setFileTree] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState('docs');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState('file');
  const [createName, setCreateName] = useState('');
  const [createPath, setCreatePath] = useState('');
  
  // 使用统一的API配置 - 默认公网IP
  const BACKEND_URL = getBackendUrl('file');

  // 通知系统状态
  const [notifications, setNotifications] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // 添加通知
  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    const notification = { id, message, type };
    setNotifications(prev => [...prev, notification]);
    
    // 3秒后自动移除
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  // 移除通知
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // 加载文件树
  const loadFileTree = async (workspace = currentWorkspace) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/files/tree?workspace=${workspace}`);
      if (response.ok) {
        const data = await response.json();
        setFileTree(data.tree || []);
      } else {
        console.error('Failed to load file tree');
      }
    } catch (error) {
      console.error('Error loading file tree:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 读取文件内容
  const loadFileContent = async (filePath) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/files/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace: currentWorkspace,
          path: filePath
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setFileContent(data.content || '');
        setSelectedFile(filePath);
      } else {
        console.error('Failed to load file content');
      }
    } catch (error) {
      console.error('Error loading file content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 保存文件
  const saveFile = async () => {
    if (!selectedFile) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/files/write`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace: currentWorkspace,
          path: selectedFile,
          content: fileContent
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          addNotification('文件保存成功！', 'success');
        } else {
          addNotification('保存失败', 'error');
        }
      } else {
        addNotification('保存失败', 'error');
      }
    } catch (error) {
      console.error('Error saving file:', error);
      addNotification('保存失败', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 创建文件或文件夹
  const createFileOrFolder = async () => {
    if (!createName.trim()) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/files/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace: currentWorkspace,
          path: createPath ? `${createPath}/${createName}` : createName,
          type: createType,
          content: createType === 'file' ? '# 新建文档\n\n请在这里编写内容...' : undefined
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setShowCreateModal(false);
          setCreateName('');
          setCreatePath('');
          loadFileTree();
          addNotification(`${createType === 'file' ? '文件' : '文件夹'}创建成功！`, 'success');
        } else {
          addNotification('创建失败', 'error');
        }
      } else {
        addNotification('创建失败', 'error');
      }
    } catch (error) {
      console.error('Error creating file/folder:', error);
      addNotification('创建失败', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 删除文件或文件夹
  const deleteFileOrFolder = async (filePath) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/files/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace: currentWorkspace,
          path: filePath
        })
      });
      
      if (response.ok) {
        if (selectedFile === filePath) {
          setSelectedFile(null);
          setFileContent('');
        }
        loadFileTree();
        addNotification('删除成功！', 'success');
      } else {
        addNotification('删除失败', 'error');
      }
    } catch (error) {
      console.error('Error deleting file/folder:', error);
      addNotification('删除失败', 'error');
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  // 显示删除确认
  const showDeleteConfirmation = (filePath) => {
    setDeleteTarget(filePath);
    setShowDeleteConfirm(true);
  };

  // 渲染文件树节点
  const renderTreeNode = (node, level = 0) => {
    const isFile = node.type === 'file';
    const isSelected = selectedFile === node.path;
    
    return (
      <div key={node.path} className={styles.treeNode}>
        <div 
          className={`${styles.nodeItem} ${isSelected ? styles.selected : ''}`}
          style={{ paddingLeft: `${level * 20 + 10}px` }}
          onClick={() => isFile && loadFileContent(node.path)}
        >
          <span className={styles.nodeIcon}>
            {isFile ? '📄' : '📁'}
          </span>
          <span className={styles.nodeName}>{node.name}</span>
          <button 
            className={styles.deleteBtn}
            onClick={(e) => {
              e.stopPropagation();
              showDeleteConfirmation(node.path);
            }}
            title="删除"
          >
            🗑️
          </button>
        </div>
        {node.children && node.children.map(child => 
          renderTreeNode(child, level + 1)
        )}
      </div>
    );
  };

  useEffect(() => {
    loadFileTree();
  }, [currentWorkspace]);

  return (
    <div className={styles.fileManager}>
      {/* 通知容器 */}
      <div className={styles.notificationContainer}>
        {notifications.map(notification => (
          <div 
            key={notification.id}
            className={`${styles.notification} ${styles[notification.type]}`}
            onClick={() => removeNotification(notification.id)}
          >
            <span className={styles.notificationIcon}>
              {notification.type === 'success' ? '✅' : 
               notification.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span className={styles.notificationMessage}>{notification.message}</span>
            <button className={styles.notificationClose}>×</button>
          </div>
        ))}
      </div>

      {/* 工具栏 */}
      <div className={styles.toolbar}>
        <div className={styles.workspaceSelector}>
          <label>工作区：</label>
          <div className={styles.workspaceButtons}>
            <button 
              className={`${styles.workspaceBtn} ${currentWorkspace === 'docs' ? styles.active : ''}`}
              onClick={() => setCurrentWorkspace('docs')}
            >
              📄 文档
            </button>
            <button 
              className={`${styles.workspaceBtn} ${currentWorkspace === 'blog' ? styles.active : ''}`}
              onClick={() => setCurrentWorkspace('blog')}
            >
              📝 博客
            </button>
          </div>
        </div>
        
        <div className={styles.actions}>
          <button 
            onClick={() => {
              setCreateType('file');
              setShowCreateModal(true);
            }}
            className={styles.actionBtn}
          >
            📄 新建文件
          </button>
          <button 
            onClick={() => {
              setCreateType('folder');
              setShowCreateModal(true);
            }}
            className={styles.actionBtn}
          >
            📁 新建文件夹
          </button>
          {selectedFile && (
            <button 
              onClick={saveFile}
              className={styles.saveBtn}
              disabled={isLoading}
            >
              💾 保存
            </button>
          )}
        </div>
      </div>

      <div className={styles.content}>
        {/* 文件树 */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3>文件列表</h3>
          </div>
          <div className={styles.fileTree}>
            {isLoading ? (
              <div className={styles.loading}>加载中...</div>
            ) : (
              fileTree.map(node => renderTreeNode(node))
            )}
          </div>
        </div>

        {/* 编辑器 */}
        <div className={styles.editor}>
          {selectedFile ? (
            <>
              <div className={styles.editorHeader}>
                <h3>📝 {selectedFile}</h3>
              </div>
              <textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                className={styles.editorTextarea}
                placeholder="在这里编写 Markdown 内容..."
                disabled={isLoading}
              />
            </>
          ) : (
            <div className={styles.placeholder}>
              <h3>📝 Markdown 编辑器</h3>
              <p>请从左侧选择一个文件开始编辑</p>
            </div>
          )}
        </div>
      </div>

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmDialog}>
            <div className={styles.confirmHeader}>
              <span className={styles.confirmIcon}>⚠️</span>
              <h3>确认删除</h3>
            </div>
            <p>确定要删除 <strong>{deleteTarget}</strong> 吗？</p>
            <p className={styles.confirmWarning}>此操作无法撤销</p>
            <div className={styles.confirmActions}>
              <button 
                className={styles.confirmCancel}
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTarget(null);
                }}
              >
                取消
              </button>
              <button 
                className={styles.confirmDelete}
                onClick={() => deleteFileOrFolder(deleteTarget)}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 创建文件/文件夹模态框 */}
      {showCreateModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>创建{createType === 'file' ? '文件' : '文件夹'}</h3>
            <div className={styles.formGroup}>
              <label>路径（可选）：</label>
              <input
                type="text"
                value={createPath}
                onChange={(e) => setCreatePath(e.target.value)}
                placeholder="例如：folder1/subfolder"
              />
            </div>
            <div className={styles.formGroup}>
              <label>名称：</label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder={createType === 'file' ? '文件名.md' : '文件夹名'}
                autoFocus
              />
            </div>
            <div className={styles.modalActions}>
              <button onClick={createFileOrFolder} disabled={!createName.trim()}>
                创建
              </button>
              <button onClick={() => setShowCreateModal(false)}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManager;