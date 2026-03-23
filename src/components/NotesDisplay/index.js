import React, { useState, useEffect, useRef } from 'react';
import styles from './styles.module.css';
import Link from '@docusaurus/Link';
import { useHistory } from '@docusaurus/router';
import { getBackendUrl } from '../../utils/apiConfig';
import Heading from '@theme/Heading';

export default function NotesDisplay() {
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const tabsRef = useRef(null);
  const history = useHistory();

  // 处理卡片点击 - 针对手机端优化
  const handleCardClick = (notePath) => {
    history.push(`/docs/${notePath.replace(/\.md$/, '')}`);
  };

  // 处理键盘访问（保持可访问性）
  const handleCardKeyDown = (event, notePath) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardClick(notePath);
    }
  };

  useEffect(() => {
    // 获取笔记列表
    const fetchNotes = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${getBackendUrl('file')}/api/files/tree?workspace=docs`);
        
        if (!response.ok) {
          throw new Error(`获取笔记列表失败: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success) {
          // 处理文件树，按文件夹组织文件
          const { allFiles, folderStructure } = processFileTree(data.tree);
          setNotes(allFiles);
          setFolders(folderStructure);
          
          // 设置默认活跃文件夹
          if (folderStructure.length > 0) {
            setActiveFolder(folderStructure[0].name);
          }
        } else {
          throw new Error(data.error || '获取笔记列表失败');
        }
      } catch (err) {
        console.error('获取笔记列表出错:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  // 处理文件树，按文件夹组织
  const processFileTree = (items, parentPath = '') => {
    let allFiles = [];
    let folderMap = new Map();

    const processItems = (items, currentPath = '') => {
      items.forEach(item => {
        if (item.type === 'folder') {
          const folderPath = currentPath ? `${currentPath}/${item.name}` : item.name;
          
          if (item.children && item.children.length > 0) {
            processItems(item.children, folderPath);
          }
        } else if (item.path.endsWith('.md')) {
          const folderName = currentPath || '根目录';
          const file = {
            ...item,
            folderPath: currentPath,
            folderName: folderName
          };
          
          allFiles.push(file);
          
          // 按文件夹分组
          if (!folderMap.has(folderName)) {
            folderMap.set(folderName, {
              name: folderName,
              icon: getFolderIcon(folderName),
              files: []
            });
          }
          folderMap.get(folderName).files.push(file);
        }
      });
    };

    processItems(items);

    const folderStructure = Array.from(folderMap.values()).sort((a, b) => {
      // 根目录排在最前面
      if (a.name === '根目录') return -1;
      if (b.name === '根目录') return 1;
      return a.name.localeCompare(b.name);
    });

    return { allFiles, folderStructure };
  };

  // 优化后的图标系统 - 使用SVG图标组件
  const FolderIcon = ({ type, className = '' }) => {
    const iconProps = {
      className: `${styles.iconSvg} ${className}`,
      width: "20",
      height: "20",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    };

    const icons = {
      home: (
        <svg {...iconProps}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9,22 9,12 15,12 15,22"/>
        </svg>
      ),
      frontend: (
        <svg {...iconProps}>
          <polyline points="16,18 22,12 16,6"/>
          <polyline points="8,6 2,12 8,18"/>
        </svg>
      ),
      backend: (
        <svg {...iconProps}>
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      ),
      algorithm: (
        <svg {...iconProps}>
          <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
        </svg>
      ),
      design: (
        <svg {...iconProps}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ),
      notes: (
        <svg {...iconProps}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
      ),
      docs: (
        <svg {...iconProps}>
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
          <polyline points="13,2 13,9 20,9"/>
        </svg>
      ),
      tutorial: (
        <svg {...iconProps}>
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
      ),
      guide: (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10"/>
          <polygon points="10,8 16,12 10,16 10,8"/>
        </svg>
      ),
      folder: (
        <svg {...iconProps}>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
      )
    };

    return icons[type] || icons.folder;
  };

  // 根据文件夹名称获取图标类型
  const getFolderIcon = (folderName) => {
    const iconMap = {
      '根目录': 'home',
      '前端': 'frontend',
      '后端': 'backend',
      '算法': 'algorithm',
      '设计': 'design',
      '学习': 'tutorial',
      'frontend': 'frontend',
      'backend': 'backend',
      'algorithm': 'algorithm',
      'design': 'design',
      'notes': 'notes',
      'docs': 'docs',
      'tutorial': 'tutorial',
      'guide': 'guide'
    };

    // 检查文件夹名称中是否包含关键词
    const lowerFolderName = folderName.toLowerCase();
    for (const [key, iconType] of Object.entries(iconMap)) {
      if (lowerFolderName.includes(key.toLowerCase())) {
        return iconType;
      }
    }

    return 'folder'; // 默认图标
  };

  // 更新指示器位置
  const updateIndicator = () => {
    if (!tabsRef.current) return;
    
    const activeTab = tabsRef.current.querySelector(`.${styles.tabButton}.${styles.active}`);
    if (activeTab) {
      const tabsWrapper = tabsRef.current.querySelector(`.${styles.tabsWrapper}`);
      const wrapperRect = tabsWrapper.getBoundingClientRect();
      const activeRect = activeTab.getBoundingClientRect();
      
      setIndicatorStyle({
        transform: `translateX(${activeRect.left - wrapperRect.left}px)`,
        width: `${activeRect.width}px`
      });
    }
  };

  // 设置活跃文件夹
  const handleFolderChange = (folderName) => {
    setActiveFolder(folderName);
    setTimeout(updateIndicator, 0);
  };

  // 键盘导航
  const handleKeyDown = (event, index) => {
    if (event.key === 'ArrowLeft' && index > 0) {
      handleFolderChange(folders[index - 1].name);
      event.target.previousElementSibling?.focus();
    } else if (event.key === 'ArrowRight' && index < folders.length - 1) {
      handleFolderChange(folders[index + 1].name);
      event.target.nextElementSibling?.focus();
    }
  };

  // 获取当前文件夹的文件
  const getCurrentFolderFiles = () => {
    const currentFolder = folders.find(folder => folder.name === activeFolder);
    return currentFolder ? currentFolder.files : [];
  };

  // 格式化日期
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '昨天';
    if (diffDays <= 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  useEffect(() => {
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeFolder, folders]);

  const currentFolderFiles = getCurrentFolderFiles();
  const currentFolder = folders.find(folder => folder.name === activeFolder);

  return (
    <section className={styles.notesSection}>
      <div className="container">
        
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>加载中...</p>
          </div>
        ) : error ? (
          <p className={styles.errorMessage}>错误: {error}</p>
        ) : folders.length === 0 ? (
          <p className={styles.emptyMessage}>暂无笔记</p>
        ) : (
          <div className={styles.notesContainer}>
            {/* 标签页导航 */}
            <div className={styles.tabsNavigation} ref={tabsRef}>
              <div className={styles.tabsWrapper}>
                {folders.map((folder, index) => (
                  <button
                    key={folder.name}
                    className={`${styles.tabButton} ${activeFolder === folder.name ? styles.active : ''}`}
                    onClick={() => handleFolderChange(folder.name)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    tabIndex={activeFolder === folder.name ? 0 : -1}
                  >
                    <span className={styles.tabIcon}>
                      <FolderIcon type={folder.icon} />
                    </span>
                    <span className={styles.tabName}>{folder.name}</span>

                  </button>
                ))}
              </div>
              <div 
                className={styles.tabIndicator} 
                style={indicatorStyle}
              ></div>
            </div>

            {/* 内容区域 */}
            <div className={styles.contentArea}>
              {/* 当前文件夹标题 */}
              <div className={styles.folderHeader}>
                <h2 className={styles.folderTitle}>
                  <span className={styles.folderIcon}>
                    <FolderIcon type={currentFolder?.icon} className={styles.folderIconLarge} />
                  </span>
                  {currentFolder?.name}
                </h2>
                <p className={styles.folderDescription}>
                  共 {currentFolderFiles.length} 篇笔记
                </p>
              </div>

              {/* 笔记网格 */}
              {currentFolderFiles.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <FolderIcon type="notes" className={styles.emptyIconSvg} />
                  </div>
                  <h3>暂无笔记</h3>
                  <p>这个文件夹还没有笔记，开始创建第一篇吧！</p>
                </div>
              ) : (
                <div className={styles.notesGrid} key={activeFolder}>
                  {currentFolderFiles.map((note, index) => (
                    <div 
                      key={`${note.path}-${index}`} 
                      className={styles.noteCard}
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => handleCardClick(note.path)}
                      onKeyDown={(e) => handleCardKeyDown(e, note.path)}
                      tabIndex={0}
                      role="button"
                      aria-label={`查看笔记: ${note.name.replace(/\.md$/, '')}`}
                    >
                      <div className={styles.noteHeader}>
                        <h3 className={styles.noteTitle}>
                          <span className={styles.noteTitleText}>
                            {note.name.replace(/\.md$/, '')}
                          </span>
                        </h3>
                        <span className={styles.noteDate}>
                          {formatDate(note.mtime)}
                        </span>
                      </div>
                      
                      <div className={styles.noteContent}>
                        <p className={styles.noteExcerpt}>
                          点击查看完整内容...
                          点击查看完整内容...
                          点击查看完整内容...
                          
                          点击查看完整内容...
                          点击查看完整内容...
                          点击查看完整内容...
                          
                          
                        </p>
                      </div>
                      
                      <div className={styles.noteFooter}>
                        <div className={styles.noteTags}>
                          <span className={styles.noteTag}>Markdown</span>
                          {note.folderPath && (
                            <span className={styles.noteTag}>{note.folderName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
