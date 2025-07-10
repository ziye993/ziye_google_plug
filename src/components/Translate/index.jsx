// import { getTranlateData } from 'lib/service';
// import React, { useEffect, useState } from 'react';
import { languages, languagesReduc } from './languages';
// import { copyText } from 'lib/utils';
import styles from './index.module.css';
import { Checkbox, Form, Input, Select, Space } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { copyText, getStorage, setStorage } from '../../lib';
import { getTranlateData } from '../../lib/tranlApi';
import { useForm } from 'antd/es/form/Form';


const languagesOptions = languages.map(lang => ({
  label: lang.name,
  value: lang.code,
}));

const CanCoptTranlResSpan = ({ list = [] }) => {
  if (!list || !list.length) return null;
  return <>{list.map(_ => <p className={styles.tranl_res_span} onClick={() => { copyText(_) }}>{_}</p>)}</>
}

const uniRegest = /\s+/g;
const humpRegest = /\s+([a-z])/gi;

export default function Translate() {
  // const [formData, setFormData] = useState({
  //   currentLanguage: 'zh',
  //   targetLanguage: 'en',
  //   appid: '',
  //   appkey: '',
  //   showUnderline: false,
  //   showHump: false,
  //   showSubtraction: false,
  // });
  const [componentsDate, setComponentsData] = useState({
    showSetting: false,
    tranlRes: {},
    formData: {},
  })
  const [loading, setLoading] = useState(false)
  const [form] = useForm();

  useEffect(() => {
    async function fetchData() {
      const storageData = await getStorage("tranlPageData");
      if (storageData) {
        const objData = typeof storageData === 'string' ? JSON.parse(storageData) : storageData
        setComponentsData(objData?.componentsDate)
        form.setFieldsValue(objData.formData)
      }
    }
    fetchData();
  }, []);

  const handleTranslate = async (e) => {
    if (!(e.keyCode === 13 && e.ctrlKey)) {
      return
    }
    if (loading) return
    setLoading(true);
    const formData = form.getFieldsValue(true);
    let { currentLanguage, targetLanguage, translateContent, appid = '20231109001875285', appkey = 'PQVEEvqcU1pdwNAylh3X' } = formData;
    if (!appid || !appkey) {
      appid = '20231109001875285';
      appkey = 'PQVEEvqcU1pdwNAylh3X';
    }
    translateContent = translateContent || e.target.value;
    const tData = await getTranlateData(translateContent, currentLanguage, targetLanguage, appid, appkey);// 目标
    let zhData, enData;
    zhData = tData?.from !== 'zh' ? await getTranlateData(translateContent, currentLanguage, "zh", appid, appkey) : null;//中
    enData = tData?.from !== 'en' ? await getTranlateData(translateContent, currentLanguage, "en", appid, appkey) : null;//英

    console.log(tData, enData, zhData, 'resData')
    const resData = {
      tData: tData?.list || [],
      enData: enData?.list || [],
      zhData: zhData?.list || [],
      error: null,
      from: tData.from,
    }

    if (tData) {
      setComponentsData((prev) => {
        setStorage("tranlPageData", JSON.stringify({
          formData,
          componentsDate: { ...prev, tranlRes: resData },
        }));
        return { ...prev, tranlRes: resData }
      });
    }
    setLoading(false);
  }


  return (<div className={styles.tsl_container}>
    <Form
      form={form}
      onValuesChange={(_, values) => {
        setComponentsData(prev => ({ ...prev, formData: values }))
      }}
      layout='vertical'
      disabled={loading}
    >
      <Space align="baseline">
        将
        <Form.Item
          name='currentLanguage'
          defaultValue='zh-CN'
          className={styles.current_language_input}
          rules={[{ required: true, message: '请选择源语言' }]}
        >
          <Select options={languagesOptions} style={{ inlineSize: 100 }} />
        </Form.Item>
        翻译为
        <Form.Item
          name='targetLanguage'
          defaultValue='en'
          rules={[{ required: true, message: '请选择目标语言' }]}
          className={styles.target_language_input}
        >
          <Select options={languagesOptions} style={{ inlineSize: 100 }} />
        </Form.Item>
        <div className={styles.appid_setting_icon}>
          <Space align="baseline" style={{ cursor: 'pointer', }} className={styles.setting_span}>
            <SettingOutlined />
            <span>配置 appid (百度翻译开放平台)</span>
          </Space>
          <Space align="baseline" className={styles.settingcontent} style={{ blockSize: componentsDate?.showSetting ? '100%' : '0%' }}>
            <Form.Item
              name='appid'
              rules={[{ required: true, message: '请配置 appid' }]}
              style={{ margininsetBlockEnd: 0 }}
            >
              <Input placeholder='请输入 appid' style={{ inlineSize: 120 }} />
            </Form.Item>
            {/* appkey */}
            <Form.Item
              name='appkey'
              rules={[{ required: true, message: '请配置 appkey' }]}
              style={{ margininsetBlockEnd: 0 }}
            >
              <Input placeholder='请输入 appkey' style={{ inlineSize: 120 }} />
            </Form.Item>
          </Space>
        </div>
      </Space >
      <Form.Item name="translateContent" style={{ position: 'relative' }}>
        <Input.TextArea
          placeholder='请输入需要翻译的内容'
          autoSize={{ minRows: 3, maxRows: 6 }}
          style={{ inlineSize: '100%', maxBlockSize: '150px' }}
          onKeyDown={handleTranslate}
        />
        <span className={styles.current_language}> 当前可能是:{languagesReduc?.[componentsDate?.tranlRes?.from]}</span>
      </Form.Item>
      <Space align="start" className={styles.ret_space}>
        <div className={styles.res_box}>
          <p>目标语言</p>
          <CanCoptTranlResSpan list={componentsDate?.tranlRes?.tData} />
        </div>
        <div className={styles.res_box}>
          <p>中</p>
          <CanCoptTranlResSpan list={componentsDate?.tranlRes?.zhData} />
        </div>
        <div className={styles.res_box}>
          <p>英</p>
          <CanCoptTranlResSpan list={componentsDate?.tranlRes?.enData} />
        </div>

        {componentsDate?.formData?.showUnderline && (<div className={styles.res_box}>
          <Form.Item name='showUnderline' valuePropName="checked" noStyle>
            <Checkbox>使用`_`连接</Checkbox>
          </Form.Item>
          <CanCoptTranlResSpan list={componentsDate?.tranlRes?.enData?.map(_ => _.replace(/[^a-zA-Z\s\u4e00-\u9fa5]/g, "").toLowerCase().replace(uniRegest, "_"))} />
        </div>)}
        {componentsDate?.formData?.showSubtraction && (<div className={styles.res_box}>
          <Form.Item name='showSubtraction' valuePropName="checked" noStyle>
            <Checkbox>使用`-`连接</Checkbox>
          </Form.Item>
          <CanCoptTranlResSpan list={componentsDate?.tranlRes?.enData?.map(_ => _.replace(/[^a-zA-Z\s\u4e00-\u9fa5]/g, "").toLowerCase().replace(uniRegest, "-"))} />
        </div>)}
        {componentsDate?.formData?.showHump && (<div className={styles.res_box}>
          <Form.Item name='showHump' valuePropName="checked" noStyle>
            <Checkbox>使用驼峰连接</Checkbox>
          </Form.Item>
          <CanCoptTranlResSpan list={componentsDate?.tranlRes?.enData?.map(_ => _.replace(/[^a-zA-Z\s\u4e00-\u9fa5]/g, "").toLowerCase().replace(humpRegest, (_, c) => c.toUpperCase()))} />
        </div>)}

        <div className={styles.res_box}>
          {!componentsDate?.formData?.showUnderline && <Form.Item name='showUnderline' valuePropName="checked" noStyle>
            <Checkbox>使用`_`连接</Checkbox>
          </Form.Item>}
          {!componentsDate?.formData?.showSubtraction && <Form.Item name='showSubtraction' valuePropName="checked" noStyle>
            <Checkbox>使用`-`连接</Checkbox>
          </Form.Item>}
          {!componentsDate?.formData?.showHump && <Form.Item name='showHump' valuePropName="checked" noStyle>
            <Checkbox>使用驼峰连接</Checkbox>
          </Form.Item>}
        </div>
      </Space>
    </Form >
  </div >);
}
