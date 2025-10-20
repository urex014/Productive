// context/SocketContext.d.ts
import { ReactNode } from "react";
import { Socket } from "socket.io-client";

export interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

export interface SocketProviderProps {
  children: ReactNode;
}

// Export context and hook types
export declare const SocketContext: import("react").Context<SocketContextValue | null>;
export declare const SocketProvider: ({ children }: SocketProviderProps) => JSX.Element;
export declare const useSocket: () => SocketContextValue | null;
