import React, { useEffect, useRef } from 'react';
import { useColorMode } from '@docusaurus/theme-common';
import ColorModeToggle from '@theme-original/ColorModeToggle';
import { 
  checkExpiredTheme, 
  saveManualTheme, 
  MANUAL_THEME_EXPIRY_HOURS 
} from '../../../utils/themeUtils';

function CustomColorModeToggle(props) {
  const colorModeResult = useColorMode();
  const intervalRef = useRef(null);

  // 添加安全检查，确保 Hook 返回值存在
  if (!colorModeResult) {
    console.warn('useColorMode hook returned undefined');
    return <ColorModeToggle {...props} />;
  }

  const { colorMode, setColorMode } = colorModeResult;

  // 添加额外的安全检查
  if (!colorMode || !setColorMode) {
    console.warn('colorMode or setColorMode is undefined');
    return <ColorModeToggle {...props} />;
  }

  // 检查并清理过期的手动设置
  useEffect(() => {
    // 确保 setColorMode 存在才执行
    if (setColorMode) {
      // 只在组件挂载时检查一次
      checkExpiredTheme(setColorMode);
      
      // 清理之前的定时器
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // 设置新的定时器，每60分钟检查一次
      intervalRef.current = setInterval(() => {
        checkExpiredTheme(setColorMode);
      }, 60 * 60 * 1000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [setColorMode]); // 添加 setColorMode 作为依赖

  // 完全自定义的主题切换处理
  const handleToggle = () => {
    // 添加安全检查
    if (!colorMode || !setColorMode) {
      console.warn('colorMode or setColorMode is not available');
      return;
    }

    // 直接切换到相反的主题
    const targetTheme = colorMode === 'dark' ? 'light' : 'dark';
    
    // 先保存手动主题设置
    saveManualTheme(targetTheme);
    
    // 然后切换主题
    setColorMode(targetTheme);
    
    // 只在开发环境输出详细日志
    if (process.env.NODE_ENV === 'development') {
      console.log(`手动设置主题为 ${targetTheme}，将在 ${MANUAL_THEME_EXPIRY_HOURS} 小时后自动恢复系统主题`);
    }
  };

  return (
    <ColorModeToggle
      {...props}
      value={colorMode}
      onChange={handleToggle}
    />
  );
}

export default CustomColorModeToggle;