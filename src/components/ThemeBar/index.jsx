import { Button, Form, Input, Modal, Radio, Space, Upload, Tag } from 'antd';
import styles from './index.module.css';
import { useEffect, useState } from 'react';
import { getStorage, openDB, setStorage } from '../../lib/storege';
import { PlusOutlined } from '@ant-design/icons';
import useRevoke from '../../hooks/useRevoke';

const uploadMap = {
  "uploading": '压缩中',
  done: '完成'
}

export default function ThemeBar() {
  const [modalShow, setModalShow] = useState(false);
  const [formData, setFormData] = useState({ bgType: 'pic' });
  const [listData, setListData] = useState([]);
  const [file, setfile] = useState([]);
  const { addMask, revoke, hasMask } = useRevoke();
  const [form] = Form.useForm();

  const edit = (record) => {
    setfile([{ name: record.backgroundImage, status: 'done' }]);
    setFormData({ ...record });
    form.setFieldsValue(record);
    setModalShow(true)
  };

  const use = (record) => {
    const newList = [...listData].map(_ => {
      if (_.id === record.id) {
        return { ..._, used: true }
      } else {
        return { ..._, used: false }
      }
    });
    updateStorege(newList)
    setListData(newList);
  }

  const del = (record) => {
    if (record.id) {
      const newList = [...listData].filter(_ => _.id !== record.id);
      setListData(newList);
      updateStorege(newList)
    }
  }

  const readDel = (record) => {
    if (hasMask(record.id)) {
      revoke(record.id, () => {
        const newList = [...listData].map(_ => {
          if (_.id === record.id) {
            return { ..._, readDel: false }
          } else {
            return _
          }
        });
        setListData(newList)
      })
      return
    }
    if (record.id) {
      const newList = [...listData].map(_ => {
        if (_.id === record.id) {
          return { ..._, readDel: true }
        } else {
          return _
        }
      });
      setListData(newList)
      addMask(record.id, 3000, () => {
        del(record)
      });
    }
  }

  const modalOk = () => {
    const data = form.getFieldsValue();
    console.log(data);
    const isEdit = listData.findIndex(_ => _.id === formData.id) >= 0;
    if (isEdit) {
      const newList = [...listData].map(_ => {
        if (_.id === data.id) {
          return {
            ...data
          }
        } else {
          return _
        }
      });
      setListData(newList);
      updateStorege(newList)
    } else {
      setListData(prev => {
        const newArr = [...prev, {
          id: Date.now(),
          ...formData
        }];
        setStorage('themeData', {
          listData: newArr,
        });
        updateStorege(newArr)
        return newArr
      })
    }
    setModalShow(false);
    setFormData({});

  }

  const customRequest = async ({ file, onSuccess }) => {
    setfile([{ name: file.name, size: file.size, status: 'uploading' }])
    const fileId = `img_${Date.now()}`; // 简单生成一个唯一ID
    form.setFieldValue('backgroundImage', fileId)
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target.result;
      const blob = new Blob([result], { type: file.type });
      // await setStorage(fileId, { name: file.name, type: file.type }); // 元数据
      const db = await openDB();
      const tx = db.transaction('images', 'readwrite');
      tx.objectStore('images').put(blob, fileId);
      await tx.done;
      onSuccess?.('ok');
      setfile([{ name: file.name, size: file.size, status: 'done' }]);

    };
    reader.readAsArrayBuffer(file);
  }

  const updateStorege = (data) => {
    console.log('setData', data || listData)
    setStorage("themeData", {
      listData: data || listData,
    })
  }

  useEffect(() => {
    const getList = async () => {
      const data = await getStorage("themeData");
      console.log(data, 'themeData');
      setListData(data?.listData || []);
    };
    getList();
  }, []);

  return <div className={styles.box}>
    <div className={styles.listBox}>
      {listData?.map((_, _i) => {
        return <div className={`${styles.listItem} ${_?.readDel ? styles.readDel : styles.revDel} ${_.used ? styles.usedBox : ''}`} key={`theme_${_.id}`}>
          <p>{_i}</p>
          <p className={styles.themeName}>{_?.thName}</p>
          <Space>
            {!_.used && <Button type="link" onClick={() => !_?.readDel && use(_)}>使用</Button>}
            <Button type="link" onClick={() => !_?.readDel && edit(_)}>编辑</Button>
            <Button type="link" onClick={() => readDel(_)}>{_?.readDel ? '撤销' : '删除'}</Button>
          </Space>
        </div>
      })}
      <div className={styles.list_add} onClick={() => { setModalShow(true); setFormData({}); }} ><PlusOutlined /></div>
    </div>
    <Modal
      title="新主题"
      open={modalShow}
      style={{ padding: '0', margin: '0', top: '0', bottom: '0', width: '100vw', height: '100vh', maxWidth: '100vw', maxHeight: '100vh' }}
      onCancel={() => { setModalShow(false); form.resetFields() }}
      onOk={() => { modalOk(); form.resetFields() }}
      modalRender={(modal) => {
        return <div className={styles.AddRuleModalForm}>{modal}</div>
      }}
    >
      <Form form={form} name={'theme'} onValuesChange={(_, allValue) => { console.log(allValue, 'av'); setFormData((prev) => ({ ...prev, ...allValue })) }}>
        <Form.Item name="id" hidden initialValue={Date.now()}></Form.Item>
        <Form.Item name="thName" label="name" >
          <Input />
        </Form.Item>

        <Space direction="horizontal">
          {formData?.bgType === 'link'
            ? <Form.Item name="backgroundImage" label="背景图" >
              <Input style={{ width: 300 }} placeholder='请输入链接' />
            </Form.Item>
            : <Form.Item name="backgroundImage" label="背景图" >
              <Upload
                accept='.png,.jpg,.gif,.jpeg,.bmp,.webp'
                showUploadList={false}
                fileList={file}
                customRequest={customRequest}
              >
                <Button style={{ width: 300 }}>上传</Button>
              </Upload>
            </Form.Item>}
          <div>
            <Form.Item name='bgType' initialValue="pic">
              <Radio.Group
                defaultValue="pic"
                size="small"
                value={formData.bgType}
                onChange={(e) => { setFormData(prev => ({ ...prev, bgType: e.target.value })) }}
              >F
                <Radio.Button value="pic">图片</Radio.Button>
                <Radio.Button value="link">链接</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </div>
        </Space>
        {formData?.bgType === 'pic' && file.map(_ => {
          return <p style={{ marginBottom: '20px' }}>
            <Tag color="green">{_.name} </Tag>
            {_.status === 'done' ? <Tag color="cyan">{uploadMap[_.status] || ''}</Tag> : <Tag color="volcano">{uploadMap[_.status] || ''}</Tag>}
          </p>
        })}
        <Form.Item name="css" label="css" >
          <Input.TextArea style={{ maxHeight: '200px' }} />
        </Form.Item>
      </Form>
    </Modal>
  </div >
}