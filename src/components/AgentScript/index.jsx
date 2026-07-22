import { Modal, message, Switch } from 'antd';
import AddButton from '../../globalComponents/AddButton';
import ListBox from '../../globalComponents/ListBox';
import { useEffect, useState } from 'react';
import { Form, Input, Space, Checkbox, Button } from 'antd';
import MonacoEditorFormField from '../CssEdit';
import { getStorage, setStorage } from '../../lib';

export default function AgentScript() {
  const [listData, setListData] = useState([]);
  const [modalShow, setModalShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    getStorage('agentScriptData').then((data) => {
      if (data?.listData) setListData(data.listData);
    });
  }, []);

  const persist = (list) => {
    setListData(list);
    setStorage('agentScriptData', { listData: list });
  };

  const onOK = async () => {
    const data = await form.validateFields();
    const item = {
      id: editing?.id || Date.now(),
      name: data.name,
      url: data.url || '',
      invert: !!data.invert,
      script: data.script || '',
      enabled: editing ? editing.enabled !== false : false,
    };
    let next;
    if (editing) {
      next = listData.map((_) => (_.id === editing.id ? item : _));
    } else {
      next = [...listData, item];
    }
    persist(next);
    message.success('已保存（匹配页面将注入脚本，请谨慎使用）');
    setModalShow(false);
    setEditing(null);
    form.resetFields();
  };

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalShow(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      name: record.name,
      url: record.url,
      invert: record.invert,
      script: record.script,
    });
    setModalShow(true);
  };

  const toggleEnabled = (record, checked) => {
    persist(listData.map((_) => (_.id === record.id ? { ..._, enabled: checked } : _)));
  };

  const remove = (record) => {
    persist(listData.filter((_) => _.id !== record.id));
  };

  return (
    <div className="agentScriptBox">
      <p style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>
        危险：用户脚本将在匹配页面主世界执行。默认建议关闭单项；总开关关闭时全部不注入。
      </p>
      <ListBox>
        {listData.map((_, _i) => (
          <ListBox.Item key={`as_${_.id || _i}`}>
            <span>{_i}</span>
            <span>{_.name}</span>
            <span>{_.url || '*'}</span>
            <Switch
              size="small"
              checked={_.enabled !== false}
              onChange={(c) => toggleEnabled(_, c)}
            />
            <Button type="link" size="small" onClick={() => openEdit(_)}>
              编辑
            </Button>
            <Button type="link" size="small" danger onClick={() => remove(_)}>
              删除
            </Button>
          </ListBox.Item>
        ))}
        <AddButton onClick={openAdd} />
      </ListBox>
      <Modal
        open={modalShow}
        onCancel={() => {
          setModalShow(false);
          setEditing(null);
          form.resetFields();
        }}
        onOk={onOK}
        closeIcon={false}
        title={editing ? '编辑脚本' : '新增脚本'}
        width="90vw"
        style={{ top: 20 }}
      >
        <Form form={form} name="asForm" layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Space size={10}>
            <Form.Item name="url" label="目标 url（空=全部；多项用 ; 或换行分割）">
              <Input style={{ width: 280 }} placeholder="google.com;bing.com" />
            </Form.Item>
            <Form.Item name="invert" label="取反" valuePropName="checked">
              <Checkbox />
            </Form.Item>
          </Space>
          <Form.Item name="script" label="脚本" rules={[{ required: true, message: '请输入脚本' }]}>
            <MonacoEditorFormField type="javascript" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
