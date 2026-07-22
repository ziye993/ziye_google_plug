import React, { useEffect, useState, useCallback } from 'react';
import { Input, QRCode, Radio, message } from 'antd';
import jsQR from 'jsqr';
import { copyText } from '../../lib';
import { getStorage, setStorage } from '../../lib/storege';

const lvMap = {
  L: '简单',
  M: '适中',
  Q: '复杂',
  H: '地狱',
};

const QrCodeTranslate = () => {
  const [inputValue, setInputValue] = useState('');
  const [qrValue, setQrValue] = useState('');
  const [resInfo, setResInfo] = useState('');
  const [level, setLevel] = useState('M');

  const persist = (value, lv = level) => {
    localStorage.setItem('qrcodeUrl', value);
    setStorage('qrcodePrefs', { url: value, level: lv });
  };

  const handlePaste = useCallback((e) => {
    const items = (e.clipboardData || e?.originalEvent?.clipboardData)?.items;
    if (!items) return;

    let foundImage = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        foundImage = true;
        const blob = items[i].getAsFile();
        const reader = new FileReader();

        reader.onload = (event) => {
          const img = new Image();
          img.src = event?.target?.result;

          img.onerror = () => {
            setResInfo('无法读取剪贴板图片');
          };

          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const result = jsQR(imageData.data, imageData.width, imageData.height);

              if (result?.data) {
                setInputValue(result.data);
                setQrValue(result.data);
                copyText(result.data);
                setResInfo('');
                persist(result.data);
                message.success('已解码并复制');
              } else {
                setResInfo('未识别到二维码（请确认粘贴的是二维码图片）');
              }
            } catch {
              setResInfo('解码失败（可能跨域或图片损坏）');
            }
          };
        };

        reader.readAsDataURL(blob);
        break;
      }
    }
    if (!foundImage && items.length) {
      // 非图片粘贴不提示，避免干扰文本粘贴
    }
  }, [level]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (inputValue.trim()) {
        setQrValue(inputValue.trim());
        persist(inputValue.trim());
        setResInfo('');
      }
    }
  };

  useEffect(() => {
    (async () => {
      const prefs = await getStorage('qrcodePrefs');
      const saved = prefs?.url || localStorage.getItem('qrcodeUrl');
      if (saved) {
        setInputValue(saved);
        setQrValue(saved);
      }
      if (prefs?.level) setLevel(prefs.level);
    })();
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  return (
    <div id="p">
      <div className="qrcodeTrslate">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="输入文本回车生成；或粘贴二维码图片解码"
        />
      </div>

      {resInfo && (
        <div style={{ marginTop: 10 }}>
          <span style={{ color: 'red' }}>{resInfo}</span>
        </div>
      )}

      {qrValue && level && (
        <div style={{ marginTop: 30, display: 'flex', flexDirection: 'row' }}>
          <QRCode style={{ marginBottom: 16 }} errorLevel={level} value={qrValue} />
          <div>
            <Radio.Group
              onChange={(e) => {
                setLevel(e.target.value);
                persist(qrValue, e.target.value);
              }}
              value={level}
            >
              {Object.keys(lvMap).map((_) => (
                <Radio key={_} value={_}>
                  {lvMap[_]}
                </Radio>
              ))}
            </Radio.Group>
          </div>
        </div>
      )}
    </div>
  );
};

export default QrCodeTranslate;
