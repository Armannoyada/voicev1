"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Phone,
  LogOut,
  Search,
  Radar,
  Activity,
  Orbit,
  Users,
  Link2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useCall } from "@/lib/call-context";
import { api, ApiError, User, Room } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const { initiateCall, connected } = useCall();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomTitle, setRoomTitle] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const data = await api.get<User[]>(
          `/users/search?q=${encodeURIComponent(q)}`,
        );
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const callUser = async (identifier: string) => {
    setError(null);
    try {
      await initiateCall(identifier);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "call failed");
    }
  };

  const createRoom = async () => {
    setRoomError(null);
    setCreatingRoom(true);
    try {
      const room = await api.post<Room>("/rooms", {
        title: roomTitle.trim() || undefined,
      });
      router.push(`/room/${room.code}`);
    } catch (err) {
      setRoomError(err instanceof ApiError ? err.message : "room create failed");
    } finally {
      setCreatingRoom(false);
    }
  };

  const joinRoom = () => {
    setRoomError(null);
    const code = roomCode.trim().toUpperCase();
    if (!code) {
      setRoomError("enter a room code");
      return;
    }
    router.push(`/room/${code}`);
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center font-mono text-sm uppercase tracking-widest text-muted-foreground">
        <Orbit className="mr-2 h-4 w-4 animate-spin" />
        establishing uplink...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <header className="border-b border-primary/15 bg-background/50 backdrop-blur-md">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary via-secondary to-pink-500 shadow-[0_0_20px_hsl(var(--primary)/0.6)]" />
              <div className="absolute inset-[-6px] rounded-full border border-primary/30 animate-spin-slow" />
            </div>
            <div>
              <h1 className="font-display text-xl tracking-[0.2em] text-gradient-cosmic">
                VOICEV1
              </h1>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                signal across the void
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 rounded-full border border-primary/20 bg-background/50 px-3 py-1.5 text-xs sm:flex">
              <span
                className={
                  connected
                    ? "h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                    : "h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)] animate-pulse"
                }
              />
              <span className="font-mono uppercase tracking-widest text-muted-foreground">
                {connected ? "online" : "uplink..."}
              </span>
              <span className="text-foreground/80">/</span>
              <span className="text-primary">{user.username}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              <LogOut className="mr-2 h-4 w-4" />
              Disengage
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl py-12">
        <div className="mb-8 text-center">
          <h2 className="font-display text-4xl tracking-wider text-gradient-cosmic">
            HAIL ANOTHER VESSEL
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Locate a callsign and open a comms channel.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-primary/80">
              <Radar className="h-3 w-3" />
              <span>scanner</span>
            </div>
            <CardTitle className="text-xl">Search the fleet</CardTitle>
            <CardDescription>
              Type a callsign or beacon address. Results update live.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/70" />
              <Input
                placeholder="commander_42 or beacon@orbit"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
              {searching && (
                <Activity className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-pulse text-secondary" />
              )}
            </div>

            {error && (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
                {error}
              </p>
            )}

            <div className="space-y-2">
              {!searching && query.trim() && results.length === 0 && (
                <p className="rounded-md border border-dashed border-primary/20 bg-background/30 px-3 py-4 text-center text-sm text-muted-foreground">
                  no signals match{" "}
                  <span className="font-mono text-primary">"{query}"</span>
                </p>
              )}
              {results.map((u) => (
                <div
                  key={u.id}
                  className="group flex items-center justify-between rounded-xl border border-primary/15 bg-background/40 p-3 transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-[0_0_20px_-8px_hsl(var(--primary)/0.5)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10">
                      <div
                        className="h-full w-full rounded-full"
                        style={{
                          background: `radial-gradient(circle at 35% 30%, hsl(${
                            (u.username.charCodeAt(0) * 13) % 360
                          } 80% 70%), hsl(${
                            (u.username.charCodeAt(0) * 13) % 360
                          } 70% 35%) 70%, #0a0a1a)`,
                          boxShadow: `0 0 18px hsl(${
                            (u.username.charCodeAt(0) * 13) % 360
                          } 80% 60% / 0.5)`,
                        }}
                      />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-semibold text-foreground">
                        @{u.username}
                      </p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => callUser(u.username)}
                    disabled={!connected}
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Hail
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-secondary/90">
              <Users className="h-3 w-3" />
              <span>team room</span>
            </div>
            <CardTitle className="text-xl">Teams-style room calling</CardTitle>
            <CardDescription>
              Create a room, share the code, and let multiple people join.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-secondary/20 bg-background/40 p-4">
              <p className="mb-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                create room
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  placeholder="Room title (optional)"
                  value={roomTitle}
                  onChange={(e) => setRoomTitle(e.target.value)}
                />
                <Button onClick={createRoom} disabled={creatingRoom}>
                  <Link2 className="mr-2 h-4 w-4" />
                  {creatingRoom ? "Creating..." : "Create & Join"}
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-primary/20 bg-background/40 p-4">
              <p className="mb-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                join room
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  placeholder="Paste room code (e.g. AB12CD34)"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                />
                <Button variant="outline" onClick={joinRoom}>
                  Join Room
                </Button>
              </div>
            </div>

            {roomError && (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
                {roomError}
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
