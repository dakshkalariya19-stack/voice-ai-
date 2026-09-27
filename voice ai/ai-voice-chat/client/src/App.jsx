import { useEffect, useRef, useState } from "react";
import { sendMessage } from "./api.js";
import { useSpeech } from "./useSpeech.js";

const STORAGE_KEY = "ai-voice-chat-history";

export default function App() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(
    () => !localStorage.getItem("privacy-notice-dismissed")
  );

  const messagesEndRef = useRef(null);
  const latestAssistantTextRef = useRef("");

  // Persist history locally (client-side only — no server-side storage in this MVP).
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFinalTranscript = (transcript) => {
    if (!transcript) return;
    submitMessage(transcript);
  };

  const {
    sttSupported,
    ttsSupported,
    isListening,
    isSpeaking,
    interimTranscript,
    micError,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useSpeech({ onFinalTranscript: handleFinalTranscript });

  async function submitMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setError(null);
    const userMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const reply = await sendMessage(nextMessages);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      latestAssistantTextRef.current = reply;
      if (voiceOutputEnabled && ttsSupported) {
        speak(reply);
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  function handleTextSubmit(e) {
    e.preventDefault();
    submitMessage(input);
  }

  function handleMicToggle() {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }

  function handleNewChat() {
    stopSpeaking();
    setMessages([]);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  function dismissPrivacyNotice() {
    localStorage.setItem("privacy-notice-dismissed", "1");
    setShowPrivacyNotice(false);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>AI Voice Chat</h1>
        <div className="header-controls">
          <label className="toggle">
            <input
              type="checkbox"
              checked={voiceOutputEnabled}
              onChange={(e) => {
                setVoiceOutputEnabled(e.target.checked);
                if (!e.target.checked) stopSpeaking();
              }}
              disabled={!ttsSupported}
            />
            Speak responses
          </label>
          <button type="button" onClick={handleNewChat} className="secondary-btn">
            New chat
          </button>
        </div>
      </header>

      {showPrivacyNotice && (
        <div className="privacy-banner" role="status">
          <p>
            When voice input is on, your speech is processed by your browser's
            built-in speech recognition to produce a text transcript before
            it's sent to the AI. Conversation history is stored only in this
            browser (not on our servers) and is cleared when you click "New
            chat" or clear your browser storage.
          </p>
          <button type="button" onClick={dismissPrivacyNotice} className="link-btn">
            Got it
          </button>
        </div>
      )}

      <p className="disclaimer">
        Responses come from a Claude language model and depend on its
        training data, this conversation's context, and any connected tools —
        it does not have complete or real-time knowledge of everything.
      </p>

      {!sttSupported && (
        <p className="warning-banner" role="alert">
          Voice input isn't supported in this browser. Try Chrome or Edge, or
          use the text box below.
        </p>
      )}

      <main className="chat-window" aria-live="polite">
        {messages.length === 0 && (
          <p className="empty-state">Start typing or tap the mic to begin.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`message message-${m.role}`}>
            <span className="message-role">{m.role === "user" ? "You" : "Claude"}</span>
            <p>{m.content}</p>
          </div>
        ))}
        {isSending && (
          <div className="message message-assistant" aria-live="polite">
            <span className="message-role">Claude</span>
            <p className="typing-indicator">Thinking…</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {interimTranscript && (
        <p className="interim-transcript" aria-live="polite">
          Listening: {interimTranscript}
        </p>
      )}

      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
      {micError && (
        <p className="error-banner" role="alert">
          {micError}
        </p>
      )}

      {isSpeaking && (
        <div className="speaking-indicator" role="status">
          <span>Claude is speaking…</span>
          <button type="button" onClick={stopSpeaking} className="link-btn">
            Stop
          </button>
        </div>
      )}

      <form onSubmit={handleTextSubmit} className="input-bar">
        <label htmlFor="chat-input" className="visually-hidden">
          Type a message
        </label>
        <input
          id="chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          disabled={isSending}
        />
        {sttSupported && (
          <button
            type="button"
            onClick={handleMicToggle}
            className={`mic-btn ${isListening ? "listening" : ""}`}
            aria-pressed={isListening}
            aria-label={isListening ? "Stop listening" : "Start voice input"}
            title={isListening ? "Stop listening" : "Start voice input"}
          >
            {isListening ? "⏹" : "🎤"}
          </button>
        )}
        <button type="submit" disabled={isSending || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
