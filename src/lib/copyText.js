import { message } from "antd";

export default function copyText(text) {
  if (!text) return;

  // 创建一个临时的 textarea 元素
  let tempTextarea = document.createElement('textarea');
  tempTextarea.value = text;
  document.body.appendChild(tempTextarea);

  // 选中 textarea 中的文本
  tempTextarea.select();

  // 使用 Document.execCommand() 方法将文本复制到粘贴板
  document.execCommand('copy');
  // if (success) {
  //   console.log("文本已成功复制到粘贴板");
  // } else {
  //   console.error("无法复制文本到粘贴板");
  // }

  // 删除临时的 textarea 元素
  document.body.removeChild(tempTextarea);
  message.success(`复制成功！`)
}
