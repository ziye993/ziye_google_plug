import { languages, languagesReduc } from './languages';
import styles from './index.module.css';
import { Checkbox, Form, Input, Select, Space, message } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { copyText, getStorage, setStorage } from '../../lib';
import { getTranlateData } from '../../lib/tranlApi';
import { useForm } from 'antd/es/form/Form';

const languagesOptions = languages.map((lang) => ({
  label: lang.name,
  value: lang.code,
}));

const CanCoptTranlResSpan = ({ list = [] }) => {
  if (!list || !list.length) return null;
  return (
    <>
      {list.map((_, i) => (
        <p key={i} className={styles.tranl_res_span} onClick={() => copyText(_)}>
          {_}
        </p>
      ))}
    </>
  );
};

const uniRegest = /\s+/g;
const humpRegest = /\s+([a-z])/gi;

export default function Translate() {
  const [componentsDate, setComponentsData] = useState({
    showSetting: false,
    tranlRes: {},
    formData: {},
  });
  const [loading, setLoading] = useState(false);
  const [form] = useForm();

  useEffect(() => {
    async function fetchData() {
      const [storageData, cred] = await Promise.all([
        getStorage('tranlPageData'),
        getStorage('baiduCredentials'),
      ]);
      let next = {
        showSetting: false,
        tranlRes: {},
        formData: {
          currentLanguage: 'auto',
          targetLanguage: 'en',
        },
      };
      if (storageData) {
        const objData = typeof storageData === 'string' ? JSON.parse(storageData) : storageData;
        next = { ...next, ...objData?.componentsDate };
      }
      if (cred?.appId || cred?.appKey) {
        next.formData = {
          ...next.formData,
          appid: cred.appId || next.formData?.appid,
          appkey: cred.appKey || next.formData?.appkey,
        };
      }
      setComponentsData(next);
      form.setFieldsValue({
        currentLanguage: 'auto',
        targetLanguage: 'en',
        ...next.formData,
      });
    }
    fetchData();
  }, [form]);

  const persist = (next) => {
    setStorage('tranlPageData', JSON.stringify({ componentsDate: next }));
    if (next?.formData?.appid || next?.formData?.appkey) {
      setStorage('baiduCredentials', {
        appId: next.formData.appid || '',
        appKey: next.formData.appkey || '',
      });
    }
  };

  const handleTranslate = async (e) => {
    if (!(e.keyCode === 13 && e.ctrlKey)) return;
    if (loading) return;
    setLoading(true);
    try {
      const formData = form.getFieldsValue(true);
      const { currentLanguage, targetLanguage, appid, appkey } = formData;
      let translateContent = formData.translateContent || e.target.value;
      if (!translateContent?.trim()) {
        message.warning('请输入需要翻译的内容');
        return;
      }
      if (!appid || !appkey) {
        message.warning('请先配置百度翻译 appid / appkey');
        setComponentsData((prev) => {
          const next = { ...prev, showSetting: true, formData };
          persist(next);
          return next;
        });
        return;
      }

      const tData = await getTranlateData(translateContent, currentLanguage, targetLanguage, appid, appkey);
      if (tData?.error) {
        message.error(tData.error);
      }
      let zhData = null;
      let enData = null;
      if (!tData?.error) {
        zhData =
          tData?.from !== 'zh'
            ? await getTranlateData(translateContent, currentLanguage, 'zh', appid, appkey)
            : { list: tData?.list || [] };
        enData =
          tData?.from !== 'en'
            ? await getTranlateData(translateContent, currentLanguage, 'en', appid, appkey)
            : { list: tData?.list || [] };
      }

      const resData = {
        tData: tData?.list || [],
        enData: enData?.list || [],
        zhData: zhData?.list || [],
        error: tData?.error || null,
        from: tData?.from,
      };

      setComponentsData((prev) => {
        const next = { ...prev, formData, tranlRes: resData };
        persist(next);
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = () => {
    setComponentsData((prev) => {
      const next = { ...prev, showSetting: !prev.showSetting };
      persist(next);
      return next;
    });
  };

  return (
    <div className={styles.tsl_container}>
      <Form
        form={form}
        initialValues={{ currentLanguage: 'auto', targetLanguage: 'en' }}
        onValuesChange={(_, values) => {
          setComponentsData((prev) => {
            const next = { ...prev, formData: values };
            persist(next);
            return next;
          });
        }}
        layout="vertical"
        disabled={loading}
      >
        <Space align="baseline">
          将
          <Form.Item
            name="currentLanguage"
            className={styles.current_language_input}
            rules={[{ required: true, message: '请选择源语言' }]}
          >
            <Select options={languagesOptions} style={{ inlineSize: 100 }} />
          </Form.Item>
          翻译为
          <Form.Item
            name="targetLanguage"
            rules={[{ required: true, message: '请选择目标语言' }]}
            className={styles.target_language_input}
          >
            <Select options={languagesOptions} style={{ inlineSize: 100 }} />
          </Form.Item>
          <div className={`${styles.appid_setting_icon} ${componentsDate?.showSetting ? styles.setting_open : ''}`}>
            <Space
              align="baseline"
              style={{ cursor: 'pointer' }}
              className={styles.setting_span}
              onClick={toggleSetting}
            >
              <SettingOutlined />
              <span>配置 appid (百度翻译开放平台)</span>
            </Space>
            <Space align="baseline" className={styles.settingcontent}>
              <Form.Item name="appid" style={{ marginBlockEnd: 0 }}>
                <Input placeholder="请输入 appid" style={{ inlineSize: 120 }} />
              </Form.Item>
              <Form.Item name="appkey" style={{ marginBlockEnd: 0 }}>
                <Input.Password placeholder="请输入 appkey" style={{ inlineSize: 120 }} />
              </Form.Item>
            </Space>
          </div>
        </Space>
        <div style={{ position: 'relative' }}>
          <Form.Item name="translateContent" style={{ position: 'relative' }}>
            <Input.TextArea
              placeholder="请输入需要翻译的内容（Ctrl+Enter 翻译）"
              autoSize={{ minRows: 3, maxRows: 6 }}
              style={{ inlineSize: '100%', maxBlockSize: '150px' }}
              onKeyDown={handleTranslate}
            />
          </Form.Item>
          <span className={styles.current_language}>
            当前可能是:{languagesReduc?.[componentsDate?.tranlRes?.from]}
          </span>
        </div>
        {componentsDate?.tranlRes?.error && (
          <p style={{ color: '#ff4d4f', margin: 0 }}>{componentsDate.tranlRes.error}</p>
        )}

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

          {componentsDate?.formData?.showUnderline && (
            <div className={styles.res_box}>
              <Form.Item name="showUnderline" valuePropName="checked" noStyle>
                <Checkbox>使用`_`连接</Checkbox>
              </Form.Item>
              <CanCoptTranlResSpan
                list={componentsDate?.tranlRes?.enData?.map((_) =>
                  _.replace(/[^a-zA-Z\s\u4e00-\u9fa5]/g, '')
                    .toLowerCase()
                    .replace(uniRegest, '_'),
                )}
              />
            </div>
          )}
          {componentsDate?.formData?.showSubtraction && (
            <div className={styles.res_box}>
              <Form.Item name="showSubtraction" valuePropName="checked" noStyle>
                <Checkbox>使用`-`连接</Checkbox>
              </Form.Item>
              <CanCoptTranlResSpan
                list={componentsDate?.tranlRes?.enData?.map((_) =>
                  _.replace(/[^a-zA-Z\s\u4e00-\u9fa5]/g, '')
                    .toLowerCase()
                    .replace(uniRegest, '-'),
                )}
              />
            </div>
          )}
          {componentsDate?.formData?.showHump && (
            <div className={styles.res_box}>
              <Form.Item name="showHump" valuePropName="checked" noStyle>
                <Checkbox>使用驼峰连接</Checkbox>
              </Form.Item>
              <CanCoptTranlResSpan
                list={componentsDate?.tranlRes?.enData?.map((_) =>
                  _.replace(/[^a-zA-Z\s\u4e00-\u9fa5]/g, '')
                    .toLowerCase()
                    .replace(humpRegest, (_, c) => c.toUpperCase()),
                )}
              />
            </div>
          )}

          <div className={styles.res_box}>
            {!componentsDate?.formData?.showUnderline && (
              <Form.Item name="showUnderline" valuePropName="checked" noStyle>
                <Checkbox>使用`_`连接</Checkbox>
              </Form.Item>
            )}
            {!componentsDate?.formData?.showSubtraction && (
              <Form.Item name="showSubtraction" valuePropName="checked" noStyle>
                <Checkbox>使用`-`连接</Checkbox>
              </Form.Item>
            )}
            {!componentsDate?.formData?.showHump && (
              <Form.Item name="showHump" valuePropName="checked" noStyle>
                <Checkbox>使用驼峰连接</Checkbox>
              </Form.Item>
            )}
          </div>
        </Space>
      </Form>
    </div>
  );
}
