import React, { useEffect, useState } from 'react';
import { Button, Checkbox, Form, Input, Modal, Select, Switch } from 'antd';
import styles from './index.module.css';
import { PlusOutlined, FormOutlined, CloseOutlined, SettingOutlined } from '@ant-design/icons';
import { getStorage, setStorage } from '../../lib/storege';
import { actionType, methods, resourceTypes } from './enum';
import { useForm } from 'antd/es/form/Form';
const { Search } = Input;
const formItemLayout = {
  layout: "vertical",
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
  size: 'small'
}
const FormItem = (props) => {
  return <Form.Item
    {...props}
    {...formItemLayout}
    label={props.label ? <span className={styles.formItemLabel}>{props.label}</span> : null}
  >
    {props.children}
  </Form.Item>
}

const AddRuleModal = (props) => {
  const { show, onSubmit, onCancel, editValue = {} } = props;
  const [form] = Form.useForm();
  useEffect(() => {
    if (editValue && form && show) {
      form.resetFields()
      form.setFieldsValue(editValue)
    }
  }, [editValue, show])
  return (
    <div className={styles.AddRuleModal}>
      <Modal
        open={show}
        okText={'保存'}
        closable={false}
        maskClosable={false}
        onOk={() => {
          onSubmit(form.getFieldValue());
          onCancel();
        }}
        width={"100vw"}
        height={'100vh'}
        style={{ padding: '0', margin: '0', top: '0', bottom: '0', width: '100vw', height: '100vh', maxWidth: '100vw', maxHeight: '100vh' }}
        onCancel={onCancel}
        modalRender={(modal) => {
          return <div className={styles.AddRuleModalForm}>{modal}</div>
        }}
      >
        <Form layout="vertical" form={form} name="addRuleForm" autoComplete="off" >
          <div style={{ height: '100%', overflow: 'auto' }}>
            <FormItem
              name={'agentName'}
              style={{ marginBottom: '10px' }}
              rules={[{ max: 5, required: true }]}
              label={'备注'}
            >
              <Input placeholder='备注' />
            </FormItem>
            <FormItem label={'源地址'} name={'agentOriginUrl'} style={{ marginBottom: '10px' }} rules={[{ required: true }]} >
              <Input placeholder='源地址' />
            </FormItem>
            <FormItem label={'代理地址'} name={'agentTargetUrl'} style={{ marginBottom: '10px' }} rules={[{ required: true }]} >
              <Input placeholder='代理地址' />
            </FormItem>
            <FormItem label={'actionType'} style={{ marginBottom: '10px' }} name={"actionType"}>
              <Select allowClear style={{ width: '100%' }} placeholder="Please select" options={actionType} />
            </FormItem>
            <FormItem label={'resourceTypes'} style={{ marginBottom: '10px' }} name={"resourceTypes"}>
              <Select mode="multiple" allowClear style={{ width: '100%' }} placeholder="Please select" options={resourceTypes} />
            </FormItem>
            <FormItem label={'methods'} style={{ marginBottom: '10px' }} name={"methods"}>
              <Select mode="multiple" allowClear style={{ width: '100%' }} placeholder="Please select" options={methods} />
            </FormItem>
            <FormItem name={'proxyHostAddress'} style={{ marginBottom: '10px' }} label="代理服务器地址">
              <Input placeholder='代理服务器地址,没有可不填使用默认' />
            </FormItem>
            <FormItem label={'mock数据'} name={'mock'} style={{ marginBottom: '10px' }} >
              <Input.TextArea placeholder='mock数据' />
            </FormItem>
            
          </div>
        </Form>
      </Modal>
    </div >
  )
}

const AgentBar = function () {
  const [form] = useForm();
  const [FormData, setFormData] = useState({});
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [editValue, setEditValue] = useState();
  const initDate = async () => {
    const data = await getStorage('agentPageDate');
    console.log(data, 'd')
    if (data?.ruleData) {
      setFormData(data?.ruleData);
      form.setFieldsValue(data?.ruleData)
    } else {
      setFormData({
        enb: true,
        checkAll: false,
        items: [],
      });
    }
  }

  useEffect(() => {
    // 初始化数据
    initDate();
  }, [])

  const saveItem = (data) => {
    console.log(data)
    setStorage('agentPageDate', { ruleData: data || FormData })
  }

  const removerItem = (index) => {
    setFormData(prev => {
      const newValue = { ...prev };
      if (index < newValue.items.length) {
        newValue.items.splice(index, 1);
        saveItem(newValue);
      }
      return newValue;
    })
  }

  return (<div className={styles.agentBar}>
    <Form
      form={form}
      name="agentForm"
      autoComplete="off"
      className='agentForm'
      onValuesChange={(_, allValue) => {
        setFormData(prev => {
          const newValue = { ...prev, ...allValue };
          saveItem(newValue)
          return newValue;
        });
      }}
      initialValues={FormData}
    >
      <div className={styles.agentHead}>
        <FormItem name={"checkAll"} valuePropName="checked">
          <Checkbox>全选</Checkbox>
        </FormItem>
        <div className={styles.enbBox} >
          <div className={styles.proxyHostAddress}>
            <SettingOutlined />
            <FormItem name={"proxyHostAddress"} className={styles.proxyHostAddressFormItem}>
              <Search style={{ width: 250, marginRight: 20 }} placeholder='代理服务器地址' onInput={(e) => {
                setFormData(prev => {
                  const newValue = { ...prev };
                  newValue.proxyHostAddress = e.target.value;
                  return newValue;
                })
              }} enterButton={<span onClick={() => { saveItem() }} >保存</span>} />
            </FormItem>
          </div>
          <FormItem name="enb">
            <Switch />
          </FormItem>
        </div>
      </div>
      <div>
        {
          (FormData?.items || [])?.map((_, _index) => {
            return (<div className={styles.ruleItem} key={`forItem_${_index}`}>
              <Checkbox checked={_.checked || FormData.checkAll} onChange={(e) => {
                setFormData(prev => {
                  const newValue = { ...prev };
                  newValue.items[_index].checked = e.target.checked;
                  saveItem(newValue);
                  return newValue
                })
              }} />
              <div className={styles.ruleInfo}><span>{_.agentName}</span> <span>将 {_.agentOriginUrl}</span><span>代理到{_.agentTargetUrl}</span> </div>
              <FormOutlined className={styles.editIcon} onClick={() => { setEditValue({ index: _index, ..._ }); setShowAddRuleModal(true); }} />
              <CloseOutlined className={styles.editIcon} onClick={() => { removerItem(_index) }} />
            </div>)
          })
        }
        <FormItem onClick={() => { setEditValue({}); setShowAddRuleModal(true); }} >
          <div className={styles.list_add}><PlusOutlined /></div>
        </FormItem>
      </div>
    </Form >
    <AddRuleModal
      show={showAddRuleModal}
      editValue={editValue}
      onSubmit={(data) => {
        setFormData(prev => {
          const newValue = { ...prev };
          if (data.index !== undefined) {
            newValue.items[data.index] = data;
          } else {
            newValue.items = [...(newValue.items || []), { ...data, checked: true }];
          }
          saveItem(newValue);
          return newValue;
        });
        setEditValue({});

      }}
      onCancel={() => { setShowAddRuleModal(false) }}
    />
  </div >)
};

export default AgentBar;
