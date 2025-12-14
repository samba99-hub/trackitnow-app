import React, { useState } from "react";
import axios from "axios";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const session_id = "clientcolis"; // unique par utilisateur ou session

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await axios.post("http://127.0.0.1:5002/chat", {
        message: input,
        session_id
      });

      const botMsg = { sender: "bot", text: res.data.response };
      setMessages((prev) => [...prev, botMsg]);
      setInput("");
    } catch (err) {
      const botMsg = { sender: "bot", text: "Erreur de connexion au chatbot." };
      setMessages((prev) => [...prev, botMsg]);
    }
  };

  return (
    <div style={{
      position: "fixed",
      bottom: 20,
      right: 20,
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      fontFamily: "'Segoe UI', sans-serif"
    }}>
      {open && (
        <div style={{
          width: 320,
          height: 450,
          background: "#1e1e2f",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
          border: "1px solid #444",
          color: "#fff"
        }}>
          {/* HEADER */}
          <div style={{
            padding: "10px 15px",
            background: "#2c2c3c",
            fontWeight: "bold",
            borderBottom: "1px solid #444"
          }}>
            TrackItNow Chatbot
          </div>

          {/* MESSAGES */}
          <div style={{
            flex: 1,
            padding: 10,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 6
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                maxWidth: "80%"
              }}>
                <span style={{
                  display: "inline-block",
                  padding: "8px 14px",
                  borderRadius: 20,
                  background: m.sender === "user" ? "#4e9af1" : "#2c2c3c",
                  color: "#fff",
                  boxShadow: m.sender === "user" ? "0 2px 6px rgba(0,0,0,0.3)" : "0 2px 6px rgba(0,0,0,0.1)"
                }}>
                  {m.text}
                </span>
              </div>
            ))}
          </div>

          {/* INPUT */}
          <div style={{
            display: "flex",
            borderTop: "1px solid #444",
            padding: "5px"
          }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Écrire un message..."
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 20,
                border: "none",
                outline: "none",
                background: "#2c2c3c",
                color: "#fff",
                marginRight: 6
              }}
            />
            <button onClick={sendMessage} style={{
              padding: "8px 14px",
              borderRadius: 20,
              border: "none",
              background: "#4e9af1",
              color: "#fff",
              cursor: "pointer",
              fontWeight: "bold"
            }}>Envoyer</button>
          </div>
        </div>
      )}

      {/* BOUTON FLOTTANT */}
      <button onClick={() => setOpen(!open)} style={{
        background: "#4e9af1",
        color: "#fff",
        border: "none",
        borderRadius: "50%",
        width: 55,
        height: 55,
        fontSize: 28,
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        marginTop: 10
      }}>
        💬
      </button>
    </div>
  );
}
