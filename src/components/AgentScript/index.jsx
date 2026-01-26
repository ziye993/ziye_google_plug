import { Modal } from "antd";
import AddButton from "../../globalComponents/AddButton"
import ListBox from "../../globalComponents/ListBox"
import { useState } from "react"
import { Form } from "antd";
import { Input } from "antd";
import MonacoEditorFormField from "../CssEdit";
import { setStorage } from "../../lib";
import { Space } from "antd";
import { Checkbox } from "antd";

export default function AgentScript(props) {
  const [ listData, setListData ] = useState([]);
  let [ modalShow, setModalShow ] = useState();
  const [ form ] = Form.useForm();

  const onOK = async () => {
    const data = await form.validateFields()
    console.log('data', data)
    // setStorage('agentScriptData', { listData });
  }
  return <div className="agentScriptBox">
    <ListBox>
      {listData.map((_, _i) => {
        return <ListBox.Item key={`as_${_i}`}>
          <span>{_i}</span>
          <span>{_.name}</span>
          <span>{_.url}</span>
        </ListBox.Item>
      })}
      <AddButton onClick={() => { setModalShow(true) }} />
    </ListBox>
    <Modal open={modalShow} onCancel={() => setModalShow(false)} onOk={onOK} closeIcon={false}>
      <Form form={form} name="asForm">
        <Form.Item name='_name' label="名称" rules={[ { required: true } ]}>  <Input />  </Form.Item>
        <Space size={10}>
          <Form.Item name={'url'} label="目标url" >  <Input />  </Form.Item>
          <Form.Item name={'invert'} label="取反" >  <Checkbox />  </Form.Item>
        </Space>
        <Form.Item name={'script'}>  <MonacoEditorFormField type="javascript" /> </Form.Item>
      </Form>
    </Modal>
  </div>
}
