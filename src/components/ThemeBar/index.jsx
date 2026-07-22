import { Button, Form, Input, Modal, Radio, Space, Upload, Tag, Switch, message } from 'antd';
import styles from './index.module.css';
import { useEffect, useState } from 'react';
import { deleteThemeImage, getStorage, setStorage, setThemeImage } from '../../lib/storege';
import useRevoke from '../../hooks/useRevoke';
import { fileToBase64 } from '../../lib/getBase64ToFile';
import MonacoEditorFormField from '../CssEdit';
import AddButton from '../../globalComponents/AddButton';
import ListBox from '../../globalComponents/ListBox';


const uploadMap = {
  uploading: '压缩中',
  done: '完成',
};

function pickBgImage(...candidates) {
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  return undefined;
}

export default function ThemeBar() {
  const [modalShow, setModalShow] = useState(false);
  const [formData, setFormData] = useState({ bgType: 'pic' });
  const [listData, setListData] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [pendingImageId, setPendingImageId] = useState(null);
  const { addMask, revoke, hasMask } = useRevoke();
  const [form] = Form.useForm();
  const targetUrlWatch = Form.useWatch('targetUrl', form);
  const bgTypeWatch = Form.useWatch('bgType', form) || formData.bgType || 'pic';

  const closeModal = () => {
    setModalShow(false);
    setEditingId(null);
    setPendingImageId(null);
    setFormData({ bgType: 'pic' });
    form.resetFields();
  };

  const edit = (record) => {
    setEditingId(record.id);
    setPendingImageId(null);
    setFormData({
      bgType: record.bgType || 'pic',
      fileName: record.fileName,
      backgroundImage: record.backgroundImage,
      status: record.backgroundImage ? 'done' : undefined,
    });
    form.setFieldsValue({
      id: record.id,
      thName: record.thName,
      bgType: record.bgType || 'pic',
      backgroundImage: typeof record.backgroundImage === 'string' ? record.backgroundImage : undefined,
      targetUrl: record.targetUrl,
      targetNegation: !!record.targetNegation,
      css: record.css,
    });
    setModalShow(true);
  };

  const use = (record) => {
    const newList = [...listData].map((_) => {
      if (_.id === record.id) {
        return { ..._, used: !record.used };
      }
      return { ..._, used: false };
    });
    updateStorege(newList);
    setListData(newList);
  };

  const del = (record) => {
    if (!record.id) return;
    if (typeof record.backgroundImage === 'string' && record.backgroundImage.startsWith('img_')) {
      deleteThemeImage(record.backgroundImage);
    }
    setListData((prev) => {
      const newList = [...prev].filter((_) => _.id !== record.id);
      updateStorege(newList);
      return newList;
    });
  };

  const readDel = (record) => {
    if (hasMask(record.id)) {
      revoke(record.id, () => {
        setListData((prev) =>
          prev.map((_) => (_.id === record.id ? { ..._, readDel: false } : _)),
        );
      });
      return;
    }
    if (record.id) {
      setListData((prev) =>
        prev.map((_) => (_.id === record.id ? { ..._, readDel: true } : _)),
      );
      addMask(record.id, 3000, () => {
        del(record);
      });
    }
  };

  const modalOk = async () => {
    try {
      const values = await form.validateFields();
      const existing = editingId != null
        ? listData.find((_) => _.id === editingId)
        : null;
      const backgroundImage = pickBgImage(
        formData.backgroundImage,
        values.backgroundImage,
        existing?.backgroundImage,
      );

      if ((formData.bgType || values.bgType || 'pic') === 'pic' && !backgroundImage) {
        message.warning('请先上传背景图，或改用链接模式');
        return;
      }

      const id = editingId ?? values.id ?? Date.now();
      const merged = {
        id,
        thName: values.thName,
        targetUrl: values.targetUrl || '',
        targetNegation: !!values.targetNegation,
        css: values.css || '',
        backgroundImage,
        fileName: formData.fileName || existing?.fileName,
        bgType: formData.bgType || values.bgType || 'pic',
        // 保存即启用，其它主题取消使用
        used: true,
      };

      const newList = listData.some((_) => _.id === id)
        ? listData.map((_) => (_.id === id ? { ..._, ...merged } : { ..._, used: false }))
        : [...listData.map((_) => ({ ..._, used: false })), merged];

      setListData(newList);
      updateStorege(newList);
      setPendingImageId(null);
      message.success('已保存并启用主题，刷新或切换到匹配页面即可看到背景');
      closeModal();
    } catch {
      // validation failed
    }
  };

  const customRequest = async ({ file, onSuccess, onError }) => {
    try {
      const fileId = `img_${Date.now()}`;
      setFormData((prev) => ({ ...prev, status: 'uploading', fileName: file.name }));
      const base64Data = await fileToBase64(file);
      await setThemeImage(fileId, base64Data);
      onSuccess?.('ok');
      setFormData((prev) => ({
        ...prev,
        status: 'done',
        backgroundImage: fileId,
        fileName: file.name,
      }));
      form.setFieldValue('backgroundImage', fileId);
      setPendingImageId(fileId);
    } catch (err) {
      setFormData((prev) => ({ ...prev, status: undefined }));
      message.error('图片保存失败');
      onError?.(err);
    }
  };

  const handleCancel = () => {
    if (pendingImageId) {
      deleteThemeImage(pendingImageId);
    }
    closeModal();
  };

  const openAdd = () => {
    setEditingId(null);
    setPendingImageId(null);
    setFormData({ bgType: 'pic' });
    form.resetFields();
    form.setFieldsValue({ id: Date.now(), bgType: 'pic' });
    setModalShow(true);
  };

  const updateStorege = (data) => {
    setStorage('themeData', {
      listData: data || listData,
    });
  };

  useEffect(() => {
    const getList = async () => {
      const data = await getStorage('themeData');
      setListData(data?.listData || []);
    };
    getList();
  }, []);

  return (
    <div className={styles.box}>
      <ListBox>
        {listData?.map((_, _i) => (
          <ListBox.Item key={_.id}>
            <p>{_i}</p>
            <p className={styles.themeName}>
              {_?.thName}
              {_.used ? <Tag color="blue" style={{ marginLeft: 8 }}>使用中</Tag> : null}
            </p>
            <Space>
              <Button type="link" onClick={() => use(_)}>{_.used ? '取消' : '使用'}</Button>
              <Button type="link" onClick={() => !_?.readDel && edit(_)}>编辑</Button>
              <Button type="link" onClick={() => readDel(_)}>{_?.readDel ? '撤销' : '删除'}</Button>
            </Space>
          </ListBox.Item>
        ))}
        <AddButton onClick={openAdd} />
      </ListBox>
      <Modal
        title={editingId != null ? '编辑主题' : '新主题'}
        open={modalShow}
        style={{ padding: '0', margin: '0', top: '0', bottom: '0', width: '100vw', height: '100vh', maxWidth: '100vw', maxHeight: '100vh' }}
        onCancel={handleCancel}
        onOk={modalOk}
        modalRender={(modal) => (
          <div className={styles.AddRuleModalForm}>{modal}</div>
        )}
      >
        <Form form={form} name="theme" initialValues={{ bgType: 'pic' }}>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="thName" label="name">
            <Input />
          </Form.Item>

          <Space direction="horizontal" align="start">
            {bgTypeWatch === 'link' ? (
              <Form.Item
                name="backgroundImage"
                label="背景图"
                rules={[{ required: true, message: '请输入图片链接' }]}
              >
                <Input
                  style={{ width: 300 }}
                  placeholder="https://..."
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, backgroundImage: e.target.value }))
                  }
                />
              </Form.Item>
            ) : (
              <>
                <Form.Item name="backgroundImage" hidden>
                  <Input />
                </Form.Item>
                <Form.Item label="背景图">
                  <Upload
                    accept=".png,.jpg,.gif,.jpeg,.bmp,.webp"
                    showUploadList={false}
                    customRequest={customRequest}
                  >
                    <Button style={{ width: 300 }}>上传</Button>
                  </Upload>
                </Form.Item>
              </>
            )}
            <Form.Item name="bgType" initialValue="pic">
              <Radio.Group
                size="small"
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, bgType: e.target.value }));
                }}
              >
                <Radio.Button value="pic">图片</Radio.Button>
                <Radio.Button value="link">链接</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Space>
          {bgTypeWatch === 'pic' && (
            <p style={{ marginBottom: '20px' }}>
              {formData.fileName && <Tag color="green">{formData.fileName}</Tag>}
              {formData.status && (
                formData.status === 'done'
                  ? <Tag color="cyan">{uploadMap[formData.status] || ''}</Tag>
                  : <Tag color="volcano">{uploadMap[formData.status] || ''}</Tag>
              )}
              {formData.backgroundImage && (
                <Tag color="blue">{formData.backgroundImage}</Tag>
              )}
            </p>
          )}
          <div className={styles.targetUrl}>
            <Form.Item name="targetUrl" label="目标url">
              <Input.TextArea
                style={{ maxHeight: '200px' }}
                placeholder="不填则是所有网页；多项用 ; 或换行分割（勿用冒号）"
              />
            </Form.Item>
            <Form.Item
              name="targetNegation"
              style={{ marginLeft: '16px' }}
              label="取反"
              valuePropName="checked"
            >
              <Switch disabled={!targetUrlWatch} />
            </Form.Item>
          </div>
          <Form.Item name="css" label="css">
            <MonacoEditorFormField />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
