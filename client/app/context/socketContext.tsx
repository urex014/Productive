// context/SocketContext.tsx
import * as React from "react";
import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

// URL of your backend
const SOCKET_URL = "http://192.168.43.116:5000";

// Define the shape of the context
export interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

// Props for the provider
interface SocketProviderProps {
  children: ReactNode;
}

// Create context with initial null value
export const SocketContext = createContext<SocketContextValue | null>(null);

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  const connect = () => {
    if (socketRef.current?.connected) return;

    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: reconnectDelay,
      reconnectionDelayMax: reconnectDelay * 2,
      timeout: 10000,
    });
  };

  useEffect(() => {
    connect();

    const socket = socketRef.current;
    if (!socket) return;

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      setIsConnected(true);
      setReconnectAttempts(0);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setReconnectAttempts((prev) => {
        const attempts = prev + 1;
        if (attempts >= maxReconnectAttempts) {
          console.error("Max reconnection attempts reached");
          socket.disconnect();
        }
        return attempts;
      });
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`Reconnect attempt ${attemptNumber}/${maxReconnectAttempts}`);
    });

    socket.on("reconnect", () => {
      console.log("Socket reconnected successfully");
      setIsConnected(true);
      setReconnectAttempts(0);
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook for consuming the context
export const useSocket = (): SocketContextValue | null => useContext(SocketContext);
