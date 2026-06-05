"use client";

import { Phone, PhoneOff, Radio, Satellite } from "lucide-react";
import { useCall } from "@/lib/call-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function CallNotifications() {
  const { incoming, outgoing, acceptCall, declineCall, cancelCall } = useCall();

  return (
    <>
      <Dialog open={!!incoming}>
        <DialogContent>
          <DialogHeader>
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-primary/80">
              <Radio className="h-3 w-3 animate-pulse" />
              <span>incoming transmission</span>
            </div>
            <DialogTitle>Hail from the void</DialogTitle>
            <DialogDescription>
              {incoming ? (
                <>
                  <span className="font-mono text-primary">
                    @{incoming.from.username}
                  </span>{" "}
                  is opening a channel.
                </>
              ) : (
                ""
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center py-6">
            <div className="relative h-24 w-24">
              <div
                className="h-full w-full rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, #67e8f9 0%, #06b6d4 40%, #7c3aed 70%, #0a0420 100%)",
                  boxShadow:
                    "0 0 40px hsl(var(--primary) / 0.5), inset -4px -6px 18px rgba(0,0,0,0.6)",
                }}
              />
              <div className="absolute inset-[-10%] rounded-full border border-primary/40 animate-ring-pulse" />
              <div
                className="absolute inset-[-10%] rounded-full border border-primary/30 animate-ring-pulse"
                style={{ animationDelay: "0.6s" }}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="destructive"
              onClick={() => incoming && declineCall(incoming.callId)}
            >
              <PhoneOff className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button
              variant="success"
              onClick={() => incoming && acceptCall(incoming.callId)}
            >
              <Phone className="mr-2 h-4 w-4" />
              Accept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!outgoing}>
        <DialogContent>
          <DialogHeader>
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-secondary/90">
              <Satellite className="h-3 w-3 animate-pulse" />
              <span>broadcasting...</span>
            </div>
            <DialogTitle>Pinging the void</DialogTitle>
            <DialogDescription>
              {outgoing ? (
                <>
                  Waiting for{" "}
                  <span className="font-mono text-secondary">
                    @{outgoing.callee.username}
                  </span>{" "}
                  to respond.
                </>
              ) : (
                ""
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="relative h-28 w-28">
              <div
                className="h-full w-full rounded-full animate-pulse-glow"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, #c084fc 0%, #7c3aed 40%, #4c1d95 70%, #0f0524 100%)",
                }}
              />
              <div className="absolute inset-[-15%] rounded-full border border-secondary/40 animate-ring-pulse" />
              <div
                className="absolute inset-[-15%] rounded-full border border-secondary/30 animate-ring-pulse"
                style={{ animationDelay: "0.7s" }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => outgoing && cancelCall(outgoing.callId)}
            >
              <PhoneOff className="mr-2 h-4 w-4" />
              Abort
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
