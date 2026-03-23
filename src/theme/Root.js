import React from 'react';
import ChatButton from '@site/src/components/ChatButton';
import NavbarFileModal from '@site/src/components/NavbarFileModal';

// 默认的根组件包装器
export default function Root({children}) {
  return (
    <>
      {children}
      <ChatButton />
      <NavbarFileModal />
    </>
  );
}