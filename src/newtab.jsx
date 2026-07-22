import '@ant-design/v5-patch-for-react-19';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import './index.css';
import Search from './components/Search';

const theme = {
  token: {
    colorPrimary: '#0f766e',
    colorInfo: '#0f766e',
    borderRadius: 8,
    fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
    colorText: '#15202b',
  },
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider locale={zhCN} theme={theme}>
      <Search />
    </ConfigProvider>
  </StrictMode>,
);
