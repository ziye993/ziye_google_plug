
export const chat = async (info) => {
  const response = await fetch('http://localhost:30000/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: '你好' }] })
  });
  const data = await response.json();
  console.log(data)
}

