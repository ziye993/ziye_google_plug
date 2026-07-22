import { Layout, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import styles from './App.module.css';
import { Content, Footer, Header } from 'antd/es/layout/layout';
import LayoutHeader from './layoutComponents/layoutHeader';
import LayoutContent from './layoutComponents/layoutContent';

const VERSION = '1.0.0';

const theme = {
  token: {
    colorPrimary: '#0f766e',
    colorInfo: '#0f766e',
    colorLink: '#0f766e',
    colorSuccess: '#0f766e',
    colorWarning: '#b45309',
    colorError: '#b42318',
    borderRadius: 8,
    fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
    colorText: '#15202b',
    colorTextSecondary: '#5a6b7b',
    colorBorder: 'rgba(21, 32, 43, 0.12)',
    colorBgContainer: '#ffffff',
    controlHeight: 32,
  },
  components: {
    Tabs: {
      inkBarColor: '#0f766e',
      itemSelectedColor: '#0f766e',
      itemHoverColor: '#0a5c56',
      titleFontSize: 13,
      horizontalItemPadding: '8px 12px',
    },
    Switch: {
      colorPrimary: '#0f766e',
    },
    Button: {
      primaryShadow: 'none',
    },
  },
};

function App() {
  return (
    <ConfigProvider locale={zhCN} theme={theme}>
      <Layout className={styles.Layout}>
        <div className={styles.shell}>
          <Header>
            <LayoutHeader />
          </Header>
          <Content>
            <LayoutContent />
          </Content>
          <Footer className={styles.footer}>ZIYE · v{VERSION}</Footer>
        </div>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
