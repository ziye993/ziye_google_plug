import { DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import { AutoComplete, Button, Form, Input, Modal, Select, Switch, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { verifyChatKey } from '../../lib/openaiChat';
import {
  getProvider,
  inferProviderId,
  providerOptions,
  resolveChatEndpoint,
} from '../../lib/aiProviders';
import styles from './SettingModal.module.less';

const NAV = [
  { key: 'apikey', label: 'API Key' },
  { key: 'model', label: '模型与服务商' },
  { key: 'history', label: '历史记录' },
  { key: 'search', label: '搜索引擎' },
];

/** 前 3 位 + .... + 后 4 位，不可查看完整 Key */
export function maskApiKey(key) {
  const s = String(key || '').trim();
  if (s.length <= 7) return '****';
  return `${s.slice(0, 3)}....${s.slice(-4)}`;
}

function upsertSavedKey(list, entry) {
  const prev = Array.isArray(list) ? list : [];
  const key = entry.apiKey;
  const without = prev.filter((i) => i.apiKey !== key);
  return [{ ...entry, id: entry.id || `key_${Date.now()}` }, ...without].slice(0, 20);
}

export function SettingModal(props) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState('apikey');
  const [form] = Form.useForm();
  const [formValue, setFormValue] = useState({});
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && props.config) {
      const provider =
        props.config.provider || inferProviderId(props.config.apiBase) || 'openai';
      const p = getProvider(provider);
      let savedApiKeys = Array.isArray(props.config.savedApiKeys) ? props.config.savedApiKeys : [];
      // 兼容：已有当前 Key 但不在列表里时补一条
      if (props.config.apiKey?.trim() && !savedApiKeys.some((k) => k.apiKey === props.config.apiKey)) {
        savedApiKeys = upsertSavedKey(savedApiKeys, {
          apiKey: props.config.apiKey,
          provider,
          apiBase: props.config.apiBase || p.apiBase,
          model: props.config.model || p.defaultModel,
          savedAt: Date.now(),
        });
      }
      const fields = {
        ...props.config,
        provider,
        apiBase: provider === 'custom' ? props.config.apiBase || '' : p.apiBase,
        model: props.config.model || p.defaultModel,
        apiKey: props.config.apiKey || '',
        savedApiKeys,
      };
      form.setFieldsValue(fields);
      setFormValue(fields);
      setSection('apikey');
    }
  }, [open, props.config, form]);

  const providerId = formValue?.provider || 'openai';
  const providerMeta = useMemo(() => getProvider(providerId), [providerId]);
  const modelOptions = useMemo(
    () => (providerMeta.models || []).map((m) => ({ value: m.value, label: m.label })),
    [providerMeta],
  );

  const onProviderChange = (id) => {
    const p = getProvider(id);
    const patch = {
      provider: id,
      apiBase: p.needBase ? form.getFieldValue('apiBase') || '' : p.apiBase,
      model: p.defaultModel,
    };
    form.setFieldsValue(patch);
    setFormValue((prev) => ({ ...prev, ...patch }));
  };

  const buildPayload = async () => {
    // 以本地 formValue 为准，避免切换页签后字段丢失
    const all = {
      ...props.config,
      ...form.getFieldsValue(true),
      ...formValue,
    };
    const resolved = resolveChatEndpoint(all);
    return {
      ...all,
      provider: resolved.providerId,
      apiBase: resolved.apiBase,
      model: resolved.model || all.model,
      apiKey: String(all.apiKey || '').trim(),
    };
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const payload = await buildPayload();
      await props?.saveConfig?.(payload);
      message.success('设置已保存');
      setOpen(false);
    } catch (err) {
      message.error(err?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const saveApiKey = async () => {
    setSaving(true);
    try {
      const payload = await buildPayload();
      if (!payload.apiKey) {
        message.warning('请填写 API Key');
        return;
      }
      if (payload.provider === 'custom' && !String(payload.apiBase || '').trim()) {
        message.warning('自定义服务请填写接口地址');
        return;
      }
      const savedApiKeys = upsertSavedKey(payload.savedApiKeys, {
        apiKey: payload.apiKey,
        provider: payload.provider,
        apiBase: payload.apiBase,
        model: payload.model,
        savedAt: Date.now(),
      });
      const next = { ...payload, savedApiKeys };
      await props?.saveConfig?.(next);
      form.setFieldsValue(next);
      setFormValue((prev) => ({ ...prev, ...next }));
      message.success('API Key 已保存');
    } catch (err) {
      message.error(err?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const useSavedKey = async (item) => {
    const p = getProvider(item.provider || 'openai');
    const patch = {
      apiKey: item.apiKey,
      provider: item.provider || 'openai',
      apiBase: item.apiBase || p.apiBase,
      model: item.model || formValue.model || p.defaultModel,
    };
    form.setFieldsValue(patch);
    setFormValue((prev) => ({ ...prev, ...patch }));
    try {
      const payload = {
        ...props.config,
        ...formValue,
        ...patch,
        savedApiKeys: formValue.savedApiKeys || props.config?.savedApiKeys || [],
      };
      await props?.saveConfig?.(payload);
      message.success('已切换并使用该 Key');
    } catch (err) {
      message.error(err?.message || '切换失败');
    }
  };

  const removeSavedKey = async (item) => {
    const savedApiKeys = (formValue.savedApiKeys || []).filter((k) => k.apiKey !== item.apiKey);
    const next = {
      ...props.config,
      ...formValue,
      savedApiKeys,
      // 若删的是当前正在用的，清空当前 Key
      apiKey: formValue.apiKey === item.apiKey ? '' : formValue.apiKey,
    };
    form.setFieldsValue(next);
    setFormValue((prev) => ({ ...prev, ...next }));
    try {
      await props?.saveConfig?.(next);
      message.success('已删除');
    } catch (err) {
      message.error(err?.message || '删除失败');
    }
  };

  const onTestKey = async () => {
    const values = form.getFieldsValue(true);
    if (!values.apiKey?.trim()) {
      message.warning('请先填写 API Key');
      return;
    }
    if (values.provider === 'custom' && !values.apiBase?.trim()) {
      message.warning('自定义服务请填写接口地址');
      return;
    }
    setTesting(true);
    try {
      const r = await verifyChatKey(values);
      message.success(r.via === 'chat' ? 'Key 可用（该服务无模型列表）' : 'Key 有效');
    } catch (err) {
      message.error(err?.message || '校验失败');
    } finally {
      setTesting(false);
    }
  };

  const active = NAV.find((n) => n.key === section) || NAV[0];

  return (
    <div>
      <SettingOutlined className={styles.gear} onClick={() => setOpen(true)} />
      <Modal
        title="设置"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={saveAll}
        confirmLoading={saving}
        okText="保存全部"
        cancelText="取消"
        width={780}
        destroyOnClose={false}
        styles={{ body: { paddingTop: 12, background: 'transparent' } }}
      >
        <Form
          form={form}
          onValuesChange={(_, values) => setFormValue((prev) => ({ ...prev, ...values }))}
          layout="vertical"
          requiredMark={false}
        >
          <div className={styles.shell}>
            <nav className={styles.nav} aria-label="设置分类">
              <div className={styles.navTrack} aria-hidden />
              {NAV.map((item) => {
                const on = item.key === section;
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`${styles.navItem} ${on ? styles.navItemActive : ''}`}
                    onClick={() => setSection(item.key)}
                  >
                    <span className={`${styles.dot} ${on ? styles.dotActive : ''}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className={styles.main}>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>{active.label}</h3>

                {section === 'apikey' && (
                  <>
                    <p className={styles.cardDesc}>
                      Key 仅保存在本机扩展存储中，不会上传到我们的服务器。保存后新标签页即可使用 AI 对话。
                    </p>
                    <div className={styles.row}>
                      <div className={styles.rowLabel}>服务商</div>
                      <div className={styles.rowBody}>
                        <Select
                          style={{ width: '100%' }}
                          options={providerOptions()}
                          value={formValue.provider}
                          onChange={(id) => {
                            form.setFieldValue('provider', id);
                            onProviderChange(id);
                          }}
                        />
                      </div>
                    </div>
                    <div className={styles.row}>
                      <div className={styles.rowLabel}>API Key</div>
                      <div className={styles.rowBody}>
                        <Input.Password
                          value={formValue.apiKey}
                          placeholder={providerMeta.keyHint || '粘贴 API Key'}
                          onChange={(e) => {
                            const apiKey = e.target.value;
                            form.setFieldValue('apiKey', apiKey);
                            setFormValue((prev) => ({ ...prev, apiKey }));
                          }}
                        />
                        <div className={styles.hint}>
                          {providerMeta.keyUrl ? (
                            <>
                              {providerMeta.keyHint || 'sk-...'} ·{' '}
                              <a href={providerMeta.keyUrl} target="_blank" rel="noreferrer">
                                获取 Key
                              </a>
                            </>
                          ) : (
                            'Key 仅保存在本地'
                          )}
                        </div>
                      </div>
                    </div>
                    {providerMeta.needBase && (
                      <div className={styles.row}>
                        <div className={styles.rowLabel}>接口地址</div>
                        <div className={styles.rowBody}>
                          <Input
                            value={formValue.apiBase}
                            placeholder="https://your-api.com/v1"
                            onChange={(e) => {
                              const apiBase = e.target.value;
                              form.setFieldValue('apiBase', apiBase);
                              setFormValue((prev) => ({ ...prev, apiBase }));
                            }}
                          />
                        </div>
                      </div>
                    )}
                    <div className={styles.actions}>
                      <Button type="primary" loading={saving} onClick={saveApiKey}>
                        保存 API Key
                      </Button>
                      <Button onClick={onTestKey} loading={testing}>
                        校验 Key
                      </Button>
                    </div>

                    <div className={styles.savedBlock}>
                      <div className={styles.savedTitle}>已保存</div>
                      {(formValue.savedApiKeys || []).length ? (
                        <ul className={styles.savedList}>
                          {(formValue.savedApiKeys || []).map((item) => {
                            const active = item.apiKey === formValue.apiKey;
                            const providerLabel =
                              getProvider(item.provider || 'openai').label || item.provider;
                            return (
                              <li
                                key={item.id || item.apiKey}
                                className={`${styles.savedItem} ${active ? styles.savedItemActive : ''}`}
                              >
                                <div className={styles.savedMeta}>
                                  <span className={styles.savedMask} title="完整 Key 不可查看">
                                    {maskApiKey(item.apiKey)}
                                  </span>
                                  <span className={styles.savedProvider}>{providerLabel}</span>
                                </div>
                                <div className={styles.savedActions}>
                                  <Button
                                    type={active ? 'default' : 'primary'}
                                    size="small"
                                    disabled={active}
                                    onClick={() => useSavedKey(item)}
                                  >
                                    {active ? '使用中' : '使用'}
                                  </Button>
                                  <Button
                                    type="text"
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => removeSavedKey(item)}
                                  />
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div className={styles.savedEmpty}>暂无已保存的 Key，保存后会出现在这里</div>
                      )}
                    </div>
                  </>
                )}

                {section === 'model' && (
                  <>
                    <p className={styles.cardDesc}>选择服务商推荐模型，也可手动输入模型 ID。</p>
                    <div className={styles.row}>
                      <div className={styles.rowLabel}>服务商</div>
                      <div className={styles.rowBody}>
                        <Select
                          style={{ width: '100%' }}
                          options={providerOptions()}
                          value={formValue.provider}
                          onChange={(id) => {
                            form.setFieldValue('provider', id);
                            onProviderChange(id);
                          }}
                        />
                      </div>
                    </div>
                    <div className={styles.row}>
                      <div className={styles.rowLabel}>模型</div>
                      <div className={styles.rowBody}>
                        <AutoComplete
                          style={{ width: '100%' }}
                          options={modelOptions}
                          value={formValue.model}
                          placeholder={providerMeta.defaultModel}
                          onChange={(model) => {
                            form.setFieldValue('model', model);
                            setFormValue((prev) => ({ ...prev, model }));
                          }}
                          filterOption={(input, option) =>
                            String(option?.value || '')
                              .toLowerCase()
                              .includes(String(input || '').toLowerCase()) ||
                            String(option?.label || '')
                              .toLowerCase()
                              .includes(String(input || '').toLowerCase())
                          }
                        />
                      </div>
                    </div>
                    <div className={styles.actions}>
                      <Button type="primary" loading={saving} onClick={saveAll}>
                        保存
                      </Button>
                    </div>
                  </>
                )}

                {section === 'history' && (
                  <>
                    <p className={styles.cardDesc}>管理插件内的搜索 / AI 对话历史（不会删除浏览器历史）。</p>
                    <div className={styles.row}>
                      <div className={styles.rowLabel}>保留历史</div>
                      <div className={styles.rowBody}>
                        <Switch
                          checked={formValue.enbHistory !== false}
                          onChange={(enbHistory) => {
                            form.setFieldValue('enbHistory', enbHistory);
                            setFormValue((prev) => ({ ...prev, enbHistory }));
                          }}
                        />
                      </div>
                    </div>
                    <div className={styles.actions}>
                      <Button danger onClick={() => props?.onClearHistory?.()}>
                        清空插件历史
                      </Button>
                      <Button type="primary" loading={saving} onClick={saveAll}>
                        保存
                      </Button>
                    </div>
                  </>
                )}

                {section === 'search' && (
                  <>
                    <p className={styles.cardDesc}>配置默认搜索引擎与探测策略。</p>
                    <div className={styles.row}>
                      <div className={styles.rowLabel}>固定引擎</div>
                      <div className={styles.rowBody}>
                        <Select
                          allowClear
                          style={{ width: '100%' }}
                          placeholder="空 = 自动探测"
                          value={formValue.useSearchType || undefined}
                          options={[
                            { label: '谷歌', value: 'google' },
                            { label: '必应', value: 'bing' },
                            { label: '百度', value: 'baidu' },
                          ]}
                          onChange={(useSearchType) => {
                            form.setFieldValue('useSearchType', useSearchType || '');
                            setFormValue((prev) => ({ ...prev, useSearchType: useSearchType || '' }));
                          }}
                        />
                      </div>
                    </div>
                    <div className={styles.row}>
                      <div className={styles.rowLabel}>探测百度</div>
                      <div className={styles.rowBody}>
                        <Switch
                          checked={!!formValue.usBaidu}
                          onChange={(usBaidu) => {
                            form.setFieldValue('usBaidu', usBaidu);
                            setFormValue((prev) => ({ ...prev, usBaidu }));
                          }}
                        />
                        <div className={styles.hint}>开启后自动探测时会包含百度引擎</div>
                      </div>
                    </div>
                    <div className={styles.actions}>
                      <Button type="primary" loading={saving} onClick={saveAll}>
                        保存
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
