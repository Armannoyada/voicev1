"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { api, Call, CallTokenInfo, User } from "./api";
import { useAuth } from "./auth-context";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "";

export interface IncomingCallPayload {
  callId: string;
  from: User;
  createdAt: string;
}

interface CallContextValue {
  socket: Socket | null;
  connected: boolean;
  incoming: IncomingCallPayload | null;
  outgoing: { callId: string; callee: User } | null;
  active: { callId: string; tokenInfo: CallTokenInfo; peer: User } | null;
  initiateCall: (calleeIdentifier: string) => Promise<void>;
  acceptCall: (callId: string) => Promise<void>;
  declineCall: (callId: string) => Promise<void>;
  cancelCall: (callId: string) => Promise<void>;
  endCall: (callId: string) => Promise<void>;
  clearActive: () => void;
}

const CallContext = createContext<CallContextValue | null>(null);

export function CallProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [incoming, setIncoming] = useState<IncomingCallPayload | null>(null);
  const [outgoing, setOutgoing] = useState<{
    callId: string;
    callee: User;
  } | null>(null);
  const [active, setActive] = useState<{
    callId: string;
    tokenInfo: CallTokenInfo;
    peer: User;
  } | null>(null);

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return;
    }

    const socket = io(`${WS_URL}/calls`, {
      withCredentials: true,
      transports: ["polling", "websocket"],
      extraHeaders: {
        "ngrok-skip-browser-warning": "true",
        "bypass-tunnel-reminder": "true",
      },
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("incoming_call", (payload: IncomingCallPayload) => {
      setIncoming(payload);
    });

    socket.on("call_accepted", async (payload: { callId: string }) => {
      try {
        const tokenInfo = await api.get<CallTokenInfo>(
          `/calls/${payload.callId}/token`,
        );
        setOutgoing((prev) => {
          if (!prev) return null;
          setActive({
            callId: payload.callId,
            tokenInfo,
            peer: prev.callee,
          });
          return null;
        });
        router.push(`/call/${payload.callId}`);
      } catch (err) {
        console.error("failed to get token:", err);
        setOutgoing(null);
      }
    });

    socket.on("call_declined", () => setOutgoing(null));
    socket.on("call_canceled", () => setIncoming(null));
    socket.on("call_ended", () => {
      setIncoming(null);
      setOutgoing(null);
      setActive(null);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, router]);

  const initiateCall = useCallback(async (calleeIdentifier: string) => {
    const call = await api.post<Call>("/calls/initiate", {
      calleeIdentifier,
    });
    setOutgoing({ callId: call.id, callee: call.callee });
  }, []);

  const acceptCall = useCallback(
    async (callId: string) => {
      const data = await api.post<{
        call: Call;
        token: string;
        url: string;
        mode: string;
        roomName: string;
      }>(`/calls/${callId}/accept`);
      setIncoming(null);
      setActive({
        callId,
        tokenInfo: {
          token: data.token,
          url: data.url,
          mode: data.mode,
          roomName: data.roomName,
        },
        peer: data.call.caller,
      });
      router.push(`/call/${callId}`);
    },
    [router],
  );

  const declineCall = useCallback(async (callId: string) => {
    await api.post(`/calls/${callId}/decline`);
    setIncoming(null);
  }, []);

  const cancelCall = useCallback(async (callId: string) => {
    await api.post(`/calls/${callId}/cancel`);
    setOutgoing(null);
  }, []);

  const endCall = useCallback(async (callId: string) => {
    try {
      await api.post(`/calls/${callId}/end`);
    } catch (err) {
      console.warn("end call failed:", err);
    }
    setActive(null);
  }, []);

  const clearActive = useCallback(() => setActive(null), []);

  const value = useMemo<CallContextValue>(
    () => ({
      socket: socketRef.current,
      connected,
      incoming,
      outgoing,
      active,
      initiateCall,
      acceptCall,
      declineCall,
      cancelCall,
      endCall,
      clearActive,
    }),
    [
      connected,
      incoming,
      outgoing,
      active,
      initiateCall,
      acceptCall,
      declineCall,
      cancelCall,
      endCall,
      clearActive,
    ],
  );

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used inside CallProvider");
  return ctx;
}
