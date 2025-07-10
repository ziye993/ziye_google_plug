import React, { useEffect, useState, useCallback } from 'react';
import { Input, QRCode, Radio } from 'antd';
import jsQR from 'jsqr';
import { copyText } from '../../lib';

const lvMap = {
  L: '简单',
  M: "适中",
  Q: "复杂",
  H: '地狱',
}

const QrCodeTranslate = () => {
  const [inputValue, setInputValue] = useState('');
  const [qrValue, setQrValue] = useState('');
  const [resInfo, setResInfo] = useState('');
  const [level, setLevel] = useState("M")
  // 粘贴识别二维码
  const handlePaste = useCallback((e) => {
    const items = (e.clipboardData || e?.originalEvent?.clipboardData)?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        const reader = new FileReader();

        reader.onload = (event) => {
          const img = new Image();
          img.src = event?.target?.result;

          img.onload = () => {
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
              localStorage.setItem('qrcodeUrl', result.data);
            } else {
              setResInfo('无法解码二维码');
            }
          };
        };

        reader.readAsDataURL(blob);
        break;
      }
    }
  }, []);

  // 回车生成二维码
  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (inputValue.trim()) {
        setQrValue(inputValue.trim());
        localStorage.setItem('qrcodeUrl', inputValue.trim());
        setResInfo('');
      }
    }
  };

  // 初始化从 localStorage 加载
  useEffect(() => {
    const saved = localStorage.getItem('qrcodeUrl');
    if (saved) {
      setInputValue(saved);
      setQrValue(saved);
    }
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
          placeholder="输入或粘贴二维码内容"
        />
      </div>

      {resInfo && (
        <div style={{ marginTop: 10 }}>
          <span style={{ color: 'red' }}>{resInfo}</span>
        </div>
      )}

      {qrValue && level && (
        <div style={{ marginTop: 30, display: 'flex', flexDirection: 'row' }}>
          <QRCode
            style={{ marginBottom: 16 }}
            errorLevel={level}
            value={qrValue}
          />
          <div>
            <Radio.Group onChange={(e) => { console.log(e); setLevel(e.target.value) }} value={level}>
              {Object.keys(lvMap).map(_ => {
                return <Radio key={_} value={_}>{lvMap[_]}</Radio>
              })}
            </Radio.Group>
          </div>
        </div>
      )
      }
    </div >
  );
};

export default QrCodeTranslate;
