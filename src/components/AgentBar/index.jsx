import React, { useState } from 'react';
import { Button, Checkbox, Form, Input, Space, Switch } from 'antd';
import styles from './index.module.css';
import { PlusOutlined } from '@ant-design/icons';


const FormListItem = (props) => {
  const isEdit = props.isEdit === undefined ? true : props.isEdit;
  return (
    <div>
      <Space>
        <Form.Item name={[props.name, 'isEdit']} style={{ display: 'none' }} valuePropName="checked" >
          <Checkbox />
        </Form.Item>
        <Form.Item name={[props.name, 'check']} valuePropName="checked" >
          <Checkbox disabled={!isEdit} />
        </Form.Item>
        <Form.Item name={[props.name, 'agentName']} {...props.restField} label="代理名称">
          <Input placeholder='名称' disabled={!isEdit} />
        </Form.Item>
        <Form.Item name={[props.name, 'agentOriginUrl']} {...props.restField} label="源地址">
          <Input placeholder='源地址' disabled={!isEdit} />
        </Form.Item>
        <Form.Item name={[props.name, 'agentTargetUrl']} {...props.restField} label="代理地址">
          <Input placeholder='代理地址' disabled={!isEdit} />
        </Form.Item>
        <Form.Item name={[props.name, 'hasMock']}  {...props.restField} label="" valuePropName="checked">
          <Checkbox disabled={!isEdit}>mock</Checkbox>
        </Form.Item>
        <Form.Item>

        </Form.Item>
      </Space>
      {props.hasMock && isEdit && <Form.Item name={[props.name, 'mock']} {...props.restField} style={{ marginBottom: '10px' }}>
        <Input.TextArea placeholder='mock数据' />
      </Form.Item>}
      {isEdit && <Form.Item>
        <Button onClick={() => { props.saveItem(props.name) }}>保存</Button>
      </Form.Item>}
    </div >
  )
}


const AgentBar = function () {
  const [FormData, setFormData] = useState({});


  const saveItem = (index) => {
    setFormData((pre) => {
      const newList = [...(pre?.items || [])];
      if (newList[index]) {
        newList[index].isEdit = false;
      }
      const updated = {
        ...pre,
        items: newList,
      };

      // 🔁 通知 background 更新代理配置
      // eslint-disable-next-line no-undef
      chrome?.runtime?.sendMessage?.({
        type: 'UPDATE_PROXY_CONFIGS',
        data: updated,
      }, res => {
        console.log('Proxy updated:', res);
      });

      return updated;
    })
  }

  const mockChange = (index) => {
    setFormData((pre) => {
      const newList = [...(pre?.items || [])];
      newList[index].isEdit = false;
      return {
        ...pre,
        items: newList,
      }
    })
  }

  return (<div className={styles.agentBar}>
    <Form
      name="agentForm"
      autoComplete="off"
      className='agentForm'
      onValuesChange={(_, allValue) => {
        console.log(allValue)
        setFormData(allValue);
      }}
      initialValues={FormData}
    >

      <div className={styles.agentHead}>
        <Form.Item name={"checkAll"} valuePropName="checked">
          <Checkbox>全选</Checkbox>
        </Form.Item>
        <Form.Item name="enb">
          <Switch unCheckedChildren='启用' checkedChildren="" />
        </Form.Item>
      </div>
      <div>
        <Form.List name="items">
          {(fields, { add }) => (
            <>
              {fields.map(({ key, ...restField }) => (
                <FormListItem
                  key={key}
                  saveItem={saveItem}
                  mockChange={mockChange} hasMock={FormData.items?.[restField.name]?.hasMock}
                  isEdit={FormData.items?.[restField.name]?.isEdit}
                  {...restField}
                />
              ))}
              <Form.Item>
                <div className={styles.list_add}><PlusOutlined onClick={() => add()} /></div>
              </Form.Item>
            </>
          )}
        </Form.List>
      </div>
    </Form>
  </div>)
};

export default AgentBar;
