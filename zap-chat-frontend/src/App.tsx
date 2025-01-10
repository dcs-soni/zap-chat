import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState(["hi there"]);

  const wssRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    const wss = new WebSocket("ws://localhost:8080");

    wss.onopen = () => {
      wss.send(
        JSON.stringify({
          type: "join",
          payload: {
            roomId: "red",
          },
        })
      );
    };

    wss.onmessage = (event) => {
      setMessages((initialMessages) => [...initialMessages, event.data]);
    };

    wssRef.current = wss;

    //cleanup
    return () => {
      wss.close();
    };
  }, []);

  const sendMessage = () => {
    const message = inputRef.current?.value;
    if (message && wssRef.current?.readyState === WebSocket.OPEN) {
      wssRef.current.send(
        JSON.stringify({
          type: "chat",
          payload: { message },
        })
      );
      inputRef.current.value = ""; // Clears the input after sending the msg
    }
  };

  const handleKeyEvent = (event) => {
    if (event.key == "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="h-screen bg-gradient-to-b from-gray-800 to-gray-900 text-white">
      {/* Chat Area */}
      <div className="h-[80vh] flex justify-center items-center">
        <div className="w-[50vw] h-[70vh] bg-gray-700 rounded-lg shadow-lg overflow-y-auto p-6">
          <h2 className="text-xl font-bold mb-4 text-center">Chat Room</h2>
          <div className="flex flex-col space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-3 rounded-md ${
                  index % 2 === 0
                    ? "bg-blue-500 text-white self-start"
                    : "bg-green-500 text-white self-end"
                }`}>
                {message}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="h-[20vh] flex justify-center items-center">
        <div className="w-[50vw] flex space-x-3">
          <input
            onKeyDown={handleKeyEvent}
            ref={inputRef}
            type="text"
            placeholder="Type your message..."
            className="text-black flex-1 p-3 rounded-lg border-2 border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
