import React, { useEffect, useState } from 'react';
import { CloseOutlined, CopyOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import './index.css';
import { Checkbox, Input, message, Switch, Tooltip } from 'antd';
import { getStorage, setStorage } from '../../lib/storege';
import { isURLorIP } from '../../lib/url';
import { AccordingToLimitCheckBox } from '../AccordingToLimitCheckBox';

const DEFAULT_DATA = {
  open: true,
  allChecked: true,
  defaultSeachTool: [
    {
      title: '百度',
      url: 'baidu.com',
      isDefault: true,
      checked: true,
      boxName: ['#content_left .result', '.c-container'],
      config: [],
    },
    {
      title: '谷歌',
      url: 'google.com',
      isDefault: true,
      checked: true,
      boxName: ['#search .g', 'div.g'],
      config: [],
    },
    {
      title: '必应',
      url: 'bing.com',
      isDefault: true,
      checked: true,
      boxName: ['.b_algo'],
      config: [],
    },
    {
      title: '360',
      url: '360.com',
      isDefault: true,
      checked: true,
      boxName: ['.res-list', '.result'],
      config: [],
    },
    {
      title: '搜狗',
      url: 'sogou.com',
      isDefault: true,
      checked: true,
      boxName: ['.vrwrap', '.rb'],
      config: [],
    },
  ],
};

/**
 * 过滤语法：
 * - `*`：命中任意文本则折叠隐藏（可点恢复）
 * - `*=null`：直接隐藏元素
 * - `!关键词`：文本不包含该关键词时隐藏
 * - 普通文本：包含该关键词则隐藏
 */

const BoxName = (props) => {
  const [isEdit, setIsEdit] = useState(false);
  const inputRef = React.useRef(null);
  useEffect(() => {
    if (isEdit) inputRef.current?.focus();
  }, [isEdit]);
  return (
    <span
      className="seachTitleEdit"
      onClick={(e) => {
        e.stopPropagation();
        setIsEdit(true);
      }}
    >
      {!isEdit &&
        props.titles.map((item, index) => (
          <span className="classSpanName" key={`classSpanName_${index}`}>
            {item}
          </span>
        ))}
      {!props.titles.length && <span className="classSpanName">未设置</span>}
      <input
        className={(isEdit ? '' : 'hideClassBoxInput') + ' input'}
        defaultValue={props.titles.join('/')}
        ref={inputRef}
        onKeyDown={(e) => {
          if (e.keyCode === 13) {
            props.onChange(e.target.value);
            setIsEdit(false);
          }
        }}
        onBlur={() => setIsEdit(false)}
      />
    </span>
  );
};

const SearchSimplifyBar = function () {
  const [data, setDataState] = useState(DEFAULT_DATA);
  const [actionItem, setActionItem] = useState(null);
  const [formData, setFormatData] = useState({ name: '', url: '' });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      let stored = await getStorage('defaultSearchTool');
      if (!stored) stored = await getStorage('defaultSeachTool');
      if (stored) {
        try {
          const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored;
          setDataState({ ...DEFAULT_DATA, ...parsed });
        } catch {
          setDataState(DEFAULT_DATA);
        }
      }
      setReady(true);
    })();
  }, []);

  const setData = (updater) => {
    setDataState((prev) => {
      const patch = typeof updater === 'function' ? updater(prev) : updater;
      return { ...prev, ...patch };
    });
  };

  const save = (next) => {
    const payload = next || data;
    const str = JSON.stringify(payload);
    localStorage.setItem('defaultSeachTool', str);
    setStorage('defaultSeachTool', str);
    setStorage('defaultSearchTool', str);
  };

  useEffect(() => {
    if (!ready) return;
    save(data);
  }, [data, ready]);

  const updataFormData = (d) => {
    if (d === null) {
      setFormatData({ name: '', url: '' });
      return;
    }
    setFormatData((v) => ({ ...v, ...d }));
  };

  const clearItem = (index) => {
    setData((prev) => ({
      defaultSeachTool: prev.defaultSeachTool.filter((_, i) => i !== index),
    }));
  };

  const setAction = (index) => {
    setActionItem((prve) => (prve === index ? null : index));
  };

  const addkeyWord = (e) => {
    if (e.keyCode === 13 && actionItem !== null) {
      const value = e.target.value.trim();
      if (!value) return;
      setData((prev) => {
        const list = prev.defaultSeachTool.map((item, i) =>
          i === actionItem ? { ...item, config: [...(item.config || []), value] } : item,
        );
        return { defaultSeachTool: list };
      });
      e.target.value = '';
    }
  };

  const addList = () => {
    if (!formData.url) return;
    if (!isURLorIP(formData.url)) {
      message.info('请输入正确的url或ip');
      return;
    }
    setData((prev) => ({
      defaultSeachTool: [
        ...prev.defaultSeachTool,
        {
          title: formData.name,
          hidden: false,
          url: formData.url,
          isDefault: false,
          config: [],
          boxName: [],
          checked: true,
        },
      ],
    }));
    updataFormData(null);
  };

  const deleteKeyWord = (cngi) => {
    setData((prev) => {
      const list = prev.defaultSeachTool.map((item, i) => {
        if (i !== actionItem) return item;
        return { ...item, config: item.config.filter((_, j) => j !== cngi) };
      });
      return { defaultSeachTool: list };
    });
  };

  const classChange = (value, index) => {
    setData((prev) => {
      const list = prev.defaultSeachTool.map((item, i) =>
        i === index ? { ...item, boxName: value.split('/').filter(Boolean) } : item,
      );
      return { defaultSeachTool: list };
    });
  };

  const copyItem = (i) => {
    setData((prev) => ({
      defaultSeachTool: [...prev.defaultSeachTool, { ...prev.defaultSeachTool[i], isDefault: false }],
    }));
  };

  const editItem = (i) => {
    setData((prev) => {
      const list = prev.defaultSeachTool.map((item, idx) =>
        idx === i ? { ...item, edit: true } : item,
      );
      return { defaultSeachTool: list };
    });
  };

  const saveItem = (e, i) => {
    if (e.keyCode === 13) {
      setData((prev) => {
        const list = prev.defaultSeachTool.map((item, idx) =>
          idx === i ? { ...item, edit: false } : item,
        );
        return { defaultSeachTool: list };
      });
    }
  };

  const urlItemChange = (e, index) => {
    const value = e.target.value;
    const enter = e.keyCode === 13;
    setData((prev) => {
      const list = prev.defaultSeachTool.map((item, i) =>
        i === index ? { ...item, url: value, edit: enter ? false : item.edit } : item,
      );
      return { defaultSeachTool: list };
    });
  };

  const nameItemChange = (e, index) => {
    const value = e.target.value;
    const enter = e.keyCode === 13;
    setData((prev) => {
      const list = prev.defaultSeachTool.map((item, i) =>
        i === index ? { ...item, title: value, edit: enter ? false : item.edit } : item,
      );
      return { defaultSeachTool: list };
    });
  };

  const checkChange = (index, e) => {
    e.stopPropagation();
    setData((prev) => {
      const list = prev.defaultSeachTool.map((item, i) =>
        i === index ? { ...item, checked: e.target.checked } : item,
      );
      return { defaultSeachTool: list };
    });
  };

  const changeAll = (e) => {
    setData((prev) => ({
      allChecked: e.target.checked,
      defaultSeachTool: prev.defaultSeachTool.map((item) => ({
        ...item,
        checked: e.target.checked,
      })),
    }));
  };

  const AccordingToLimitCheckBoxValue = data?.defaultSeachTool?.reduce?.((pre, item) => {
    return item.checked ? pre + 1 : pre;
  }, 0);

  return (
    <div className="seachBox">
      <div className="seachStatus">
        <div>
          <AccordingToLimitCheckBox
            onChange={changeAll}
            value={AccordingToLimitCheckBoxValue}
            max={data?.defaultSeachTool?.length}
            min={0}
          />
        </div>
        <div>
          <Tooltip title="关键词：* | *=null | !否定 | 普通包含">
            <span style={{ marginRight: 8, color: '#888', cursor: 'help' }}>语法?</span>
          </Tooltip>
          开启筛选：
          <Switch checked={data.open} onChange={(value) => setData({ open: value })} />
        </div>
      </div>
      {data?.defaultSeachTool?.map((item, index) => {
        if (item?.hidden && !item.url) {
          return <React.Fragment key={'url' + index} />;
        }
        return (
          <div key={'url' + index} className="toolBox">
            <div onClick={() => setAction(index)} className="toolBoxName">
              <Checkbox
                className="checkbox_tool"
                onClick={(e) => e.stopPropagation()}
                checked={item.checked}
                onChange={(b) => checkChange(index, b)}
              />
              <span>
                {item.edit ? (
                  <>
                    名称：
                    <Input
                      className="input"
                      onClick={(e) => e.stopPropagation()}
                      value={item.title}
                      onKeyDown={(e) => saveItem(e, index)}
                      onChange={(e) => nameItemChange(e, index)}
                    />
                    url:{' '}
                    <Input
                      className="input"
                      onClick={(e) => e.stopPropagation()}
                      value={item.url}
                      onKeyDown={(e) => saveItem(e, index)}
                      onChange={(e) => urlItemChange(e, index)}
                    />
                  </>
                ) : (
                  `${item.title || ''}_${item.url}`
                )}
              </span>
              <span> 目标元素：</span>
              <BoxName titles={item?.boxName || []} onChange={(value) => classChange(value, index)} />
            </div>
            <CopyOutlined className="copyIcon" onClick={() => copyItem(index)} />
            <EditOutlined className="editIcon" onClick={() => editItem(index)} />
            <CloseOutlined className="closeIcon" onClick={() => clearItem(index)} />
            <div className={'urlSet ' + (actionItem === index ? 'actionUrlSet' : 'hiddenUrlSet')}>
              {(item.config || []).map((cng, cngi) => (
                <span key={'url_key_' + cngi} className="cngKeyItem">
                  {cng}
                  <CloseOutlined onClick={() => deleteKeyWord(cngi)} />
                </span>
              ))}
              <input className="input" placeholder="关键字 * / *=null / !否定" onKeyDown={addkeyWord} />
            </div>
          </div>
        );
      })}
      <div key="url_last" className="toolBoxAdd">
        <Input
          className="input"
          placeholder="名称"
          onChange={(e) => updataFormData({ name: e.target.value })}
          value={formData.name}
        />
        <Input
          className="input"
          placeholder="url"
          onChange={(e) => updataFormData({ url: e.target.value })}
          value={formData.url}
        />
        <PlusOutlined
          style={{
            fontSize: '20px',
            lineHeight: '30px',
            color: '#aaa',
            padding: '0 10px 0 10px',
            cursor: 'pointer',
          }}
          onClick={addList}
        />
      </div>
    </div>
  );
};

export default SearchSimplifyBar;
