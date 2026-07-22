import { SettingOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Select, Switch } from 'antd';
import { useEffect, useState } from 'react';

export function SettingModal(props) {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [formValue, setFormValue] = useState({});

  useEffect(() => {
    if (open && props.config) {
      form.setFieldsValue(props.config);
      setFormValue(props.config);
    }
  }, [open, props.config, form]);

  const onOk = async () => {
    const values = await form.validateFields();
    await props?.saveConfig?.(values);
    setOpen(false);
  };

  return (
    <div>
      <SettingOutlined
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          right: 28,
          top: 28,
          color: '#0f766e',
          fontSize: 22,
          cursor: 'pointer',
          zIndex: 50,
          padding: 8,
          borderRadius: 10,
          background: 'rgba(255,255,255,0.7)',
          border: '1px solid rgba(21,32,43,0.1)',
        }}
      />
      <Modal title="设置" open={open} onCancel={() => setOpen(false)} onOk={onOk}>
        <Form
          form={form}
          style={{ marginTop: '20px' }}
          onValuesChange={(_, values) => setFormValue(values)}
          layout="vertical"
        >
          <Form.Item name="apiKey" label="API Key（可选）">
            <Input.Password placeholder="本地 AI 服务密钥" />
          </Form.Item>
          <Form.Item name="apiBase" label="AI 接口地址">
            <Input placeholder="http://localhost:30000/api/ai/chat" />
          </Form.Item>
          <Form.Item name="enbHistory" label="保留历史记录" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item>
            <Button
              type="link"
              style={{ margin: 0, padding: 0, marginRight: '20px' }}
              onClick={() => props?.onClearHistory?.()}
            >
              删除历史记录
            </Button>
            这并不会删除浏览器的历史记录,只是删除插件的历史记录
          </Form.Item>
          <Form.Item name="usBaidu" label="允许探测百度引擎" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item
            name="useSearchType"
            label={
              <span>
                {formValue?.useSearchType === 'baidu'
                  ? '固定使用百度'
                  : '固定搜索引擎（空=自动探测）'}
              </span>
            }
          >
            <Select
              allowClear
              options={[
                { label: '谷歌', value: 'google' },
                { label: '必应', value: 'bing' },
                { label: '百度', value: 'baidu' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
