// MonacoEditorFormField.jsx
import React, { useRef, useEffect } from 'react';
import * as monaco from 'monaco-editor';

const MonacoEditorFormField = ({ value = '', onChange }) => {
  const containerRef = useRef(null);
  const editorRef = useRef(null);

  // 初始化 Monaco
  useEffect(() => {
    // 设置 CSP 安全的 worker 加载方式（避免跨域/unsafe-eval）
    window.MonacoEnvironment = {
      getWorkerUrl: function () {
        return URL.createObjectURL(
          new Blob(
            [
              `
              self.MonacoEnvironment = { baseUrl: '/' };
              importScripts('/node_modules/monaco-editor/min/vs/base/worker/workerMain.js');
            `,
            ],
            { type: 'text/javascript' }
          )
        );
      },
    };

    const editor = monaco.editor.create(containerRef.current, {
      value,
      language: 'css',
      theme: 'vs-dark',
      automaticLayout: true,
      fontSize: 14,
      minimap: { enabled: false },
    });

    editorRef.current = editor;

    const model = editor.getModel();
    const changeDisposable = model.onDidChangeContent(() => {
      const newValue = model.getValue();
      onChange?.(newValue);
    });

    return () => {
      changeDisposable.dispose();
      editor.dispose();
    };
  }, []);

  // 更新外部传入的 value（避免外部 value 改变后编辑器不更新）
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      style={{
        height: '200px',
        width: '100%',
        border: '1px solid #ccc',
        borderRadius: 4,
      }}
    />
  );
};

export default MonacoEditorFormField;