"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useLocalParticipant,
} from "@livekit/components-react";
import { Mic, MicOff, PhoneOff, Satellite } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useCall } from "@/lib/call-context";
import { Button } from "@/components/ui/button";

export default function CallRoomPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { active, endCall } = useCall();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!active || active.callId !== params.id) {
      const t = setTimeout(() => {
        if (!active) router.replace("/dashboard");
      }, 500);
      return () => clearTimeout(t);
    }
  }, [active, params.id, router]);

  if (!active || active.callId !== params.id) {
    return (
      <div className="flex h-screen items-center justify-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
        <Satellite className="mr-2 h-4 w-4 animate-pulse" />
        synchronizing comms array...
      </div>
    );
  }

  const handleDisconnect = async () => {
    await endCall(active.callId);
    router.replace("/dashboard");
  };

  return (
    <LiveKitRoom
      audio={true}
      video={false}
      token={active.tokenInfo.token}
      serverUrl={active.tokenInfo.url}
      connect={true}
      onDisconnected={handleDisconnect}
      className="relative min-h-screen"
    >
      <RoomAudioRenderer />
      <CallRoomUI
        peerUsername={active.peer.username}
        mode={active.tokenInfo.mode}
        onEnd={handleDisconnect}
      />
    </LiveKitRoom>
  );
}

function CallRoomUI({
  peerUsername,
  mode,
  onEnd,
}: {
  peerUsername: string;
  mode: string;
  onEnd: () => void;
}) {
  const participants = useParticipants();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();

  const otherInRoom = participants.some(
    (p) => p.identity !== localParticipant?.identity,
  );

  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    if (!otherInRoom) {
      startRef.current = null;
      setElapsed(0);
      return;
    }
    if (startRef.current === null) startRef.current = Date.now();
    const i = setInterval(() => {
      if (startRef.current !== null) {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }
    }, 500);
    return () => clearInterval(i);
  }, [otherInRoom]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  const toggleMic = async () => {
    await localParticipant?.setMicrophoneEnabled(!isMicrophoneEnabled);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-12 p-4">
      <div className="absolute top-6 left-0 right-0 flex justify-center">
        <div className="flex items-center gap-3 rounded-full border border-primary/20 bg-background/50 px-4 py-1.5 backdrop-blur-md">
          <span
            className={
              otherInRoom
                ? "h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                : "h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)] animate-pulse"
            }
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            {otherInRoom ? "channel locked" : "awaiting peer"}
          </span>
          {otherInRoom && (
            <span className="font-mono text-xs tabular-nums text-primary">
              {mm}:{ss}
            </span>
          )}
        </div>
      </div>

      <div className="relative flex h-[28rem] w-[28rem] items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-primary/15 animate-spin-slow" />
        <div className="absolute inset-8 rounded-full border border-secondary/15 animate-spin-reverse" />
        <div className="absolute inset-16 rounded-full border border-accent/10" />

        {otherInRoom && (
          <>
            <div className="absolute inset-12 rounded-full border-2 border-primary/30 animate-ring-pulse" />
            <div
              className="absolute inset-12 rounded-full border-2 border-primary/20 animate-ring-pulse"
              style={{ animationDelay: "0.6s" }}
            />
          </>
        )}

        <div
          className={
            "relative h-44 w-44 rounded-full transition-all duration-700 " +
            (otherInRoom
              ? "animate-pulse-glow"
              : "shadow-[0_0_40px_-5px_hsl(var(--secondary)/0.5)]")
          }
          style={{
            background: otherInRoom
              ? "radial-gradient(circle at 30% 30%, #67e8f9 0%, #06b6d4 35%, #7c3aed 70%, #1e0a3b 100%)"
              : "radial-gradient(circle at 30% 30%, #c084fc 0%, #7c3aed 40%, #4c1d95 70%, #0f0524 100%)",
          }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 via-transparent to-transparent" />
        </div>

        <div
          className="absolute inset-0 animate-spin-slow"
          style={{ animationDuration: "30s" }}
        >
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 shadow-[0_0_18px_rgba(251,191,36,0.7)]" />
          </div>
        </div>
        <div
          className="absolute inset-8 animate-spin-reverse"
          style={{ animationDuration: "45s" }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
            <div className="h-4 w-4 rounded-full bg-gradient-to-br from-pink-300 to-pink-600 shadow-[0_0_14px_rgba(244,114,182,0.7)]" />
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          channel with
        </p>
        <h1 className="mt-2 font-display text-5xl tracking-[0.15em] text-gradient-cosmic">
          {peerUsername.toUpperCase()}
        </h1>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          via livekit · {mode}
        </p>
      </div>

      <div className="flex items-center gap-5">
        <Button
          variant={isMicrophoneEnabled ? "outline" : "destructive"}
          size="lg"
          onClick={toggleMic}
          className="h-14 w-14 rounded-full p-0"
        >
          {isMicrophoneEnabled ? (
            <Mic className="h-5 w-5" />
          ) : (
            <MicOff className="h-5 w-5" />
          )}
        </Button>
        <Button
          variant="destructive"
          size="lg"
          onClick={onEnd}
          className="h-16 w-16 rounded-full p-0 shadow-[0_0_30px_-5px_hsl(var(--destructive)/0.7)]"
        >
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
