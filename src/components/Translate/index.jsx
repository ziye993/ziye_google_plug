// import { getTranlateData } from 'lib/service';
// import React, { useEffect, useState } from 'react';
import { languages } from './languages';
// import { copyText } from 'lib/utils';
import styles from './index.module.css';
import { Checkbox, Form, Input, Select, Space } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { copyText, getStorage, setStorage } from '../../lib';
import { getTranlateData } from '../../lib/tranlApi';


const languagesOptions = languages.map(lang => ({
  label: lang.name,
  value: lang.code,
}));

const CanCoptTranlResSpan = ({ list = [] }) => {
  if (!list || !list.length) return null;
  return <>{list.map(_ => <p className={styles.tranl_res_span} onClick={() => { copyText }}>{_.span}</p>)}</>
}

export default function Translate() {
  const [formData, setFormData] = useState({
    currentLanguage: 'zh-CN',
    targetLanguage: 'en',
    appid: '',
    appkey: '',
    showUnderline: false,
    showHump: false,
    showSubtraction: false,
  });
  const [componentsDate, setComponentsData] = useState({
    showSetting: false,
    tranlRes: [],
  })
  useEffect(() => {
    async function fetchData() {
      const storageData = await getStorage("tranlPageData");
      console.log(storageData, 'storageData')
      if (storageData) {
        setComponentsData(storageData.componentsDate)
        setFormData(storageData.formData);
      }
    }
    fetchData();
  }, []);



  const handleTranslate = async () => {
    const { currentLanguage, targetLanguage, translateContent, appid = '20231109001875285', appkey = 'PQVEEvqcU1pdwNAylh3X' } = formData;
    if (!appid || !appkey) {
      return;
    }


    const tData = await getTranlateData(translateContent, currentLanguage, targetLanguage, formData.appid, formData.key);// 目标
    const zhData = formData.targetStrType !== 'zh' ? await getTranlateData(translateContent, currentLanguage, "zh", formData.appid, formData.key) : null;//中
    const enData = formData.targetStrType !== 'en' ? await getTranlateData(translateContent, currentLanguage, "en", formData.appid, formData.key) : null;//英
    const resData = {
      tData,
      enData,
      zhData,
      error: null,
    }

    if (tData) {
      setComponentsData((prev) => {
        setStorage("tranlPageData", JSON.stringify({
          formData,
          componentsDate,
        }));
        return { ...prev, tranlRes: resData }
      });
      return
    }
    setFormData(v => ({ ...v, res: { error: '请求失败' } }));


    // 调用翻译接口
    // const res = await getTranlateData({
    //   from: currentLanguage,
    //   to: targetLanguage,
    //   q: translateContent,
    //   appid,
    //   appkey,
    // });
  }


  return (<div className={styles.tsl_container}>
    <Form
      onValuesChange={(changedValues) => {
        console.log(changedValues)
        setFormData(prev => ({
          ...prev,
          ...changedValues,
        }));
      }}
      initialValues={formData}
      layout='vertical'
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
      <Form.Item name="translateContent">
        <Input.TextArea
          placeholder='请输入需要翻译的内容'
          autoSize={{ minRows: 3, maxRows: 6 }}
          style={{ inlineSize: '100%', maxBlockSize: '150px' }}

          onInput={(e) => {
            // 如果输入回车
            if (e.nativeEvent.inputType === 'insertLineBreak') {
              // 这里可以调用翻译接口
              handleTranslate()
            }
          }}
        />
      </Form.Item>
      <Space align="baseline">
        <div className={styles.res_box}>
          <p>目标语言</p>
          <CanCoptTranlResSpan list={componentsDate.tranlRes} />
        </div>
        <div className={styles.res_box}>
          <p>中</p>
          <CanCoptTranlResSpan list={componentsDate.tranlRes} />
        </div>
        <div className={styles.res_box}>
          <p>英</p>
          <CanCoptTranlResSpan list={componentsDate.tranlRes} />
        </div>
        <div className={styles.res_box}>
          <Form.Item name='showUnderline' valuePropName="checked" noStyle>
            <Checkbox>使用`_`连接</Checkbox>
          </Form.Item>
          {formData.showUnderline && (
            <CanCoptTranlResSpan list={componentsDate.tranlRes} />
          )}
        </div>
        <div className={styles.res_box}>
          <Form.Item name='showSubtraction' valuePropName="checked" noStyle>
            <Checkbox>使用`-`连接</Checkbox>
          </Form.Item>
          {formData.showSubtraction && (
            <CanCoptTranlResSpan list={componentsDate.tranlRes} />
          )}
        </div>
        <div className={styles.res_box}>
          <Form.Item name='showHump' valuePropName="checked" noStyle>
            <Checkbox>使用驼峰连接</Checkbox>
          </Form.Item>
          {formData.showHump && (
            <CanCoptTranlResSpan list={componentsDate.tranlRes} />
          )}
        </div>
      </Space>
    </Form >
  </div >);
}
