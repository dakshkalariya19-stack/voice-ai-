const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

/**
 * Sends the full message history to our backend and returns Claude's reply.
 * Throws an Error with a user-friendly message on failure.
 */
export async function sendMessage(messages) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
  } catch (networkErr) {
    throw new Error("Can't reach the server. Check your internet connection and try again.");
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Received an unexpected response from the server.");
  }

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status}).`);
  }

  return data.reply;
}
