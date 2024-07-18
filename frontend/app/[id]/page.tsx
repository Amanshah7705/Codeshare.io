"use client";
import React, { useState, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useParams } from "next/navigation";
import { CopyToClipboard } from "react-copy-to-clipboard";

export default function Home() {
  const api = "http://localhost:5000";
  const [value, setValue] = useState<string>("");
  const [debounced, setDebounced] = useState(value);
  const params = useParams();
  const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
      const s: Socket = io(api);
      setSocket(s);
      s.emit("join-room", params.id);
      s.on("data-from-server", async (val) => {
        setValue(val);
      });
      return () => {
        s.off("data-from-server");
        s.disconnect();
      };
      // eslint-disable-next-line
    }, []);

  const debounce = useCallback((value: string) => {
    const handler = setTimeout(() => {
      setDebounced(value);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, []);

  useEffect(() => {
    const cleanup = debounce(value);
    return cleanup;
  }, [value, debounce]);

    useEffect(() => {
      if (socket && params.id && debounced !== "") {
        const newData = {
          id: params.id,
          textabout: debounced,
        };

        socket.emit("send-data-from-client", newData);
      }
    }, [socket, debounced, params.id]);

  function downloadText() {
    const text = value;
    const newText = new Blob([text], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(newText);
    link.download = `file${params.id}.txt`;
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
    }, 100);
  }

  return (
    <div className="min-h-screen bg-black text-white">
  <div className="flex flex-col h-screen">
    <header className="flex items-center justify-between bg-gray-800 p-4">
      <div className="flex-grow flex items-center justify-center">
        <span className="text-xl font-bold">Code Share</span>
      </div>
      <div className="flex items-center space-x-4">
        <button className="flex items-center bg-gray-700 px-4 py-2 rounded transition duration-300 ease-in-out hover:bg-gray-600 focus:outline-none focus:bg-gray-600">
          <svg
            aria-hidden="true"
            focusable="false"
            data-prefix="fas"
            data-icon="users"
            className="svg-inline--fa fa-users w-4 h-4 mr-2"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 640 512"
          >
            <path
              fill="currentColor"
              d="M319.9 320c57.41 0 103.1-46.56 103.1-104c0-57.44-46.54-104-103.1-104c-57.41 0-103.1 46.56-103.1 104C215.9 273.4 262.5 320 319.9 320zM369.9 352H270.1C191.6 352 128 411.7 128 485.3C128 500.1 140.7 512 156.4 512h327.2C499.3 512 512 500.1 512 485.3C512 411.7 448.4 352 369.9 352zM512 160c44.18 0 80-35.82 80-80S556.2 0 512 0c-44.18 0-80 35.82-80 80S467.8 160 512 160zM183.9 216c0-5.449 .9824-10.63 1.609-15.91C174.6 194.1 162.6 192 149.9 192H88.08C39.44 192 0 233.8 0 285.3C0 295.6 7.887 304 17.62 304h199.5C196.7 280.2 183.9 249.7 183.9 216zM128 160c44.18 0 80-35.82 80-80S172.2 0 128 0C83.82 0 48 35.82 48 80S83.82 160 128 160zM551.9 192h-61.84c-12.8 0-24.88 3.037-35.86 8.24C454.8 205.5 455.8 210.6 455.8 216c0 33.71-12.78 64.21-33.16 88h199.7C632.1 304 640 295.6 640 285.3C640 233.8 600.6 192 551.9 192z"
            ></path>
          </svg>
          <span className="ml-2">Share</span>
        </button>
      </div>
    </header>

    <main className="flex-grow flex">
      <div className="flex w-full">
        <div className="flex-grow bg-neutral-800 p-4">
          <textarea
            className="w-full h-full bg-black text-green-500 p-2"
            placeholder="Write your code here..."
            value={value}
            onChange={(e)=>setValue(e.target.value)}
          ></textarea>
        </div>
        <div className="w-64 bg-white p-4">
          <div className="flex flex-col">
            <button className="bg-gray-700 px-4 py-2 rounded transition duration-300 ease-in-out hover:bg-gray-600 focus:outline-none focus:bg-gray-600 mb-4">
              Settings
            </button>

            <button
              className="bg-gray-700 px-4 py-2 rounded transition duration-300 ease-in-out hover:bg-gray-600 focus:outline-none focus:bg-gray-600 mb-4"
              onClick={downloadText}
            >
              Download
            </button>
            <CopyToClipboard text={debounced}>
              <button className="bg-gray-700 px-4 py-2 rounded transition duration-300 ease-in-out hover:bg-gray-600 focus:outline-none focus:bg-gray-600 mb-4">
                Copy
              </button>
            </CopyToClipboard>
          </div>
        </div>
      </div>
    </main>
  </div>
</div>

  );
}
