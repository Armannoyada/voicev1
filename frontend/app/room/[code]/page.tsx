"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useParticipants,
} from "@livekit/components-react";
import {
  Mic,
  MicOff,
  PhoneOff,
  Copy,
  Check,
  Users,
  Crown,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, Room, RoomJoinResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function TeamRoomPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const code = String(params.code || "").toUpperCase();

  const [joining, setJoining] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinData, setJoinData] = useState<RoomJoinResponse | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || !code) return;
    const run = async () => {
      setJoining(true);
      setError(null);
      try {
        const data = await api.post<RoomJoinResponse>(`/rooms/${code}/join`);
        setJoinData(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "failed to join room");
      } finally {
        setJoining(false);
      }
    };
    run();
  }, [user, code]);

  const leaveRoom = () => {
    router.push("/dashboard");
  };

  const endRoom = async () => {
    if (!joinData) return;
    try {
      await api.post(`/rooms/${joinData.room.code}/end`);
    } catch {
      // no-op
    }
    router.push("/dashboard");
  };

  if (loading || joining) {
    return (
      <div className="flex h-screen items-center justify-center font-mono text-xs uppercase tracking-[0.35em] text-muted-foreground">
        joining team room...
      </div>
    );
  }

  if (!joinData || error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="glass max-w-lg rounded-2xl p-6 text-center">
          <p className="text-sm text-destructive-foreground">
            {error ?? "Unable to join this room"}
          </p>
          <Button className="mt-4" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      audio={true}
      video={false}
      connect={true}
      token={joinData.token}
      serverUrl={joinData.url}
      onDisconnected={leaveRoom}
      className="relative min-h-screen"
    >
      <RoomAudioRenderer />
      <TeamRoomUI
        room={joinData.room}
        mode={joinData.mode}
        onLeave={leaveRoom}
        canEnd={user?.id === joinData.room.hostId}
        onEnd={endRoom}
      />
    </LiveKitRoom>
  );
}

function TeamRoomUI({
  room,
  mode,
  onLeave,
  canEnd,
  onEnd,
}: {
  room: Room;
  mode: string;
  onLeave: () => void;
  canEnd: boolean;
  onEnd: () => Promise<void>;
}) {
  const participants = useParticipants();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
  const [copied, setCopied] = useState(false);
  const [ending, setEnding] = useState(false);

  const inviteLink = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/room/${room.code}`;
  }, [room.code]);

  const toggleMic = async () => {
    await localParticipant?.setMicrophoneEnabled(!isMicrophoneEnabled);
  };

  const copyInvite = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const participantItems = [
    ...(localParticipant
      ? [
          {
            identity: localParticipant.identity,
            name: localParticipant.name || "You",
            isLocal: true,
          },
        ]
      : []),
    ...participants
      .filter((p) => p.identity !== localParticipant?.identity)
      .map((p) => ({
        identity: p.identity,
        name: p.name || p.identity,
        isLocal: false,
      })),
  ];

  const roomCount = participantItems.length;

  return (
    <div className="container flex min-h-screen max-w-6xl flex-col gap-6 py-8">
      <div className="glass rounded-2xl p-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
              team room
            </p>
            <h1 className="font-display text-3xl tracking-[0.15em] text-gradient-cosmic">
              {room.title}
            </h1>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              code {room.code} · livekit {mode}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={copyInvite}>
              {copied ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {copied ? "Copied" : "Copy invite link"}
            </Button>
            {canEnd && (
              <Button
                variant="destructive"
                onClick={async () => {
                  setEnding(true);
                  await onEnd();
                }}
                disabled={ending}
              >
                End room
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="glass rounded-2xl p-8">
          <div className="flex min-h-[420px] flex-col items-center justify-center">
            <div className="relative h-56 w-56">
              <div className="absolute inset-0 rounded-full border border-primary/20 animate-spin-slow" />
              <div className="absolute inset-6 rounded-full border border-secondary/25 animate-spin-reverse" />
              <div className="absolute inset-14 rounded-full border border-accent/20" />
              <div className="absolute inset-16 rounded-full bg-[radial-gradient(circle_at_30%_30%,#67e8f9_0%,#06b6d4_35%,#7c3aed_75%,#1e0a3b_100%)] shadow-[0_0_60px_-8px_rgba(34,211,238,0.7)]" />
            </div>
            <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
              everyone in this room can speak
            </p>
          </div>
          <div className="mt-6 flex justify-center gap-4">
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
              onClick={onLeave}
              className="h-14 w-14 rounded-full p-0"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="glass rounded-2xl p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="flex items-center font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
              <Users className="mr-2 h-4 w-4" />
              participants
            </p>
            <span className="rounded-full border border-primary/30 px-2 py-0.5 text-xs text-primary">
              {roomCount}
            </span>
          </div>
          <div className="space-y-2">
            {participantItems.map((p) => {
              const isHost = p.identity === room.hostId;
              return (
                <div
                  key={p.identity}
                  className="flex items-center justify-between rounded-lg border border-primary/15 bg-background/35 px-3 py-2"
                >
                  <div>
                    <p className="font-mono text-sm text-foreground">
                      {p.name}
                      {p.isLocal ? " (you)" : ""}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {p.identity}
                    </p>
                  </div>
                  {isHost && (
                    <span className="inline-flex items-center rounded-full border border-amber-300/35 bg-amber-300/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-amber-200">
                      <Crown className="mr-1 h-3 w-3" />
                      host
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
