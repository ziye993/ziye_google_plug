import { Layout } from 'antd'
import styles from './App.module.css'
import { Content, Footer, Header } from 'antd/es/layout/layout'
import LayoutHeader from './layoutComponents/layoutHeader'
import LayoutContent from './layoutComponents/layoutContent'

function App() {
  //
  return (<Layout className={styles.Layout}>
    <Header>
      <LayoutHeader />
    </Header>
    <Content >
      <LayoutContent />
    </Content>
    <Footer>
    </Footer>
  </Layout>)
}

export default App
