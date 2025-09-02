import React, { useState } from 'react';

const DoctorChatBubble = () => {
  const [messages, setMessages] = useState([
    { sender: 'doctor', text: 'Hello! I am your superspecialized doctor. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages([...messages, { sender: 'user', text: input }]);
    setLoading(true);

    // Call backend AI endpoint
    const res = await fetch('/api/doctor-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input })
    });
    const data = await res.json();

    setMessages([...messages, { sender: 'user', text: input }, { sender: 'doctor', text: data.reply }]);
    setInput('');
    setLoading(false);
  };

  return (
    <div className="chat-bubble-container">
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.sender === 'doctor' ? 'doctor-msg' : 'user-msg'}>
            {msg.text}
          </div>
        ))}
        {loading && <div className="doctor-msg">Typing...</div>}
      </div>
      <div className="chat-input">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your medical question..."
        />
        <button onClick={sendMessage} disabled={loading}>Send</button>
      </div>
      <img
        src="/favicon.ico"
        alt="Doctor Avatar"
        style={{ width: 40, height: 40, borderRadius: '50%' }}
      />
    </div>
  );
};

export default DoctorChatBubble;