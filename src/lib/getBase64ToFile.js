export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); // 包含 data:image/...;base64,...
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}