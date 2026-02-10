import { SettingOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Select, Switch } from "antd";
import { useState } from "react";


export function SettingModal(props) {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [formValue, setFormValue] = useState({});
  return <div>
    <SettingOutlined
      onClick={() => { setOpen(true) }}
      style={{
        position: 'fixed', right: '100px', top: '100px',
        color: 'initial'
      }} />
    <Modal title="设置" open={open} onCancel={() => { setOpen(false) }} onOk={() => { props?.saveConfig?.() }} >
      <Form form={form} style={{ marginTop: '20px' }} onValuesChange={(value, values) => { setFormValue(values) }}>
        <Form.Item name="apiKey" label="GPT key" rules={[{ required: false }]}>
          <Input />
        </Form.Item>
        <Form.Item name="enbHistory" label="保留历史记录" rules={[{ required: false }]}>
          <Switch />
        </Form.Item>
        <Form.Item>
          <Button type={'link'} style={{ margin: 0, padding: 0, marginRight: '20px' }}>删除历史记录</Button>
          这并不会删除浏览器的历史记录,只是删除插件的历史记录
        </Form.Item>
        <Form.Item name="usBaidu" label="我很牛逼,我就是能从一堆垃圾中找到黄金!!!" rules={[{ required: false }]}>
          <Switch />
        </Form.Item>
        <Form.Item name="useSearchType" label={<span>{formValue?.useSearchType === 'baidu' ? "??????" : '我只想使用以下搜索引擎'}</span>} rules={[{ required: false }]}>
          <Select options={[{ label: '谷歌', value: 'google' }, { label: '必应', value: 'bing' }, { label: '百度', value: 'baidu', }]} />
        </Form.Item> 
      </Form>
    </Modal>
  </div>
}