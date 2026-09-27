import { useCallback, useEffect, useRef, useState } from "react";

// Feature detection — Safari/Firefox support varies or is prefixed.
const SpeechRecognitionAPI =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);
const speechSynthesisSupported =
  typeof window !== "undefined" && "speechSynthesis" in window;

/**
 * Encapsulates speech-to-text (mic input) and text-to-speech (spoken replies)
 * behind one hook. Swap the internals here later for a paid provider
 * (e.g. Deepgram for STT, ElevenLabs for TTS) without touching the UI.
 */
export function useSpeech({ onFinalTranscript }) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [micError, setMicError] = useState(null);

  const recognitionRef = useRef(null);
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  onFinalTranscriptRef.current = onFinalTranscript;

  const sttSupported = Boolean(SpeechRecognitionAPI);
  const ttsSupported = speechSynthesisSupported;

  // Set up the recognizer once.
  useEffect(() => {
    if (!sttSupported) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          onFinalTranscriptRef.current?.(transcript.trim());
          setInterimTranscript("");
        } else {
          interim += transcript;
        }
      }
      if (interim) setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "permission-denied") {
        setMicError("Microphone access was denied. Enable it in your browser's site settings.");
      } else if (event.error === "no-speech") {
        // Not fatal — just means silence; ignore.
      } else {
        setMicError(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [sttSupported]);

  const startListening = useCallback(() => {
    if (!sttSupported || !recognitionRef.current) return;
    // If Claude is currently speaking, stop it — the user interrupting
    // to talk again is a normal, expected interaction.
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setMicError(null);
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // start() throws if already started — safe to ignore.
    }
  }, [sttSupported]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const speak = useCallback(
    (text) => {
      if (!ttsSupported || !text) return;
      window.speechSynthesis.cancel(); // clear any queued/previous utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [ttsSupported]
  );

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  return {
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
  };
}
