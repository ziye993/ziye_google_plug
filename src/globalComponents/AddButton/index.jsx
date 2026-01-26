
import { PlusOutlined } from '@ant-design/icons';
import styles from './index.module.css';

export default function AddButton(props) {
    return <div className={`${styles.list_add} ${props.className}`} {...props} ><PlusOutlined /></div>
}