import { Button, Form, Input, Modal, Radio, Space, Upload, Tag, Checkbox, Divider, Switch } from 'antd';
import styles from './index.module.css';
import { useEffect, useState } from 'react';
import { deleteIndexDb, getStorage, setIndexDb, setStorage } from '../../lib/storege';
import { PlusOutlined } from '@ant-design/icons';
import useRevoke from '../../hooks/useRevoke';
import { fileToBase64 } from '../../lib/getBase64ToFile';
import MonacoEditorFormField from '../CssEdit';


const uploadMap = {
  "uploading": '压缩中',
  'done': '完成'
}

export default function ThemeBar() {
  const [modalShow, setModalShow] = useState(false);
  const [formData, setFormData] = useState({ bgType: 'pic' });
  const [listData, setListData] = useState([]);
  const { addMask, revoke, hasMask } = useRevoke();
  const [form] = Form.useForm();

  const edit = (record) => {
    setFormData({ ...record });
    form.setFieldsValue({ ...record });
    setModalShow(true)
  };

  const use = (record) => {
    const newList = [...listData].map(_ => {
      if (_.id === record.id) {
        return { ..._, used: !record.used }
      } else {
        return { ..._, used: false }
      }
    });
    updateStorege(newList)
    setListData(newList);
  }

  const del = (record) => {
    if (record.id) {
      setListData(prev => {
        const newList = [...prev].filter(_ => _.id !== record.id);
        updateStorege(newList)
        return newList
      });

    }
  }

  const readDel = (record) => {
    if (hasMask(record.id)) {
      revoke(record.id, () => {
        setListData(prev => {
          const newList = [...prev].map(_ => {
            if (_.id === record.id) {
              return { ..._, readDel: false }
            } else {
              return _
            }
          });
          return newList
        })
      })
      return
    }
    if (record.id) {
      setListData(prev => {
        const newList = [...prev].map(_ => {
          if (_.id === record.id) {
            return { ..._, readDel: true }
          } else {
            return _
          }
        });
        return newList
      })
      addMask(record.id, 3000, () => {
        del(record)
      });
    }
  }

  const modalOk = () => {
    const data = form.getFieldsValue();
    console.log(data, formData);
    const isEdit = listData.findIndex(_ => _.id === formData.id) >= 0;
    if (isEdit) {
      const newList = [...listData].map(_ => {
        if (_.id === data.id) {
          return {
            ...data,
            ...formData,
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
    const fileId = `img_${Date.now()}`; // 简单生成一个唯一ID
    setFormData(prev => ({ ...prev, status: 'uploading', fileName: file.name }))
    const base64Data = await fileToBase64(file)
    await setIndexDb(fileId, base64Data);
    onSuccess?.('ok');
    setFormData(prev => ({ ...prev, status: 'done', }))
    form.setFieldValue('backgroundImage', fileId);
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
            <Button type="link" onClick={() => use(_)}>{_.used ? '取消' : '使用'}</Button>
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
      onCancel={() => { deleteIndexDb(form.getFieldValue('backgroundImage')); setModalShow(false); form.resetFields() }}
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
              >
                <Radio.Button value="pic">图片</Radio.Button>
                <Radio.Button value="link">链接</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </div>
        </Space>
        {formData?.bgType === 'pic' && <p style={{ marginBottom: '20px' }}>
          {formData.fileName && <Tag color="green">{formData.fileName} </Tag>}
          {formData.status && (formData.status === 'done' ? <Tag color="cyan">{uploadMap[formData.status] || ''}</Tag> : <Tag color="volcano">{uploadMap[formData.status] || ''}</Tag>)}
        </p>}
        <div className={styles.targetUrl}>
          <Form.Item name='targetUrl' label="目标url">
            <Input.TextArea style={{ maxHeight: '200px' }} placeholder='不填则是所有网页,子项 ":" 分割' />
          </Form.Item>
          <Form.Item name='targetNegation' style={{ marginLeft: '16px' }} label='取反'>
            <Switch disabled={!formData.targetUrl}></Switch>
          </Form.Item>
        </div>



        <Form.Item name="css" label="css" >
          <MonacoEditorFormField />
        </Form.Item>
      </Form>
    </Modal>
  </div >
}