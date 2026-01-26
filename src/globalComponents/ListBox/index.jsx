
import styles from './index.module.css';

function ListBox(props) {
  return <div className={`${styles.listBox} ${props.className}`}>
    {props.children}
  </div>
}

ListBox.Item = (props) => {

  return <div
    className={`${styles.listItem} ${props.className} ${props?.readDel ? styles.readDel : styles.revDel} ${props.used ? styles.usedBox : ''}`}
    {...props}
  >
    {props.children}
  </div>
}

export default ListBox