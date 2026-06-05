import type { Metadata } from "next";
import { Orbitron, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "@livekit/components-styles";
import { AuthProvider } from "@/lib/auth-context";
import { CallProvider } from "@/lib/call-context";
import { CallNotifications } from "@/components/call-notifications";
import { SpaceBackground } from "@/components/space-background";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "voicev1 // signal across the void",
  description: "2-way audio calling powered by LiveKit",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${spaceGrotesk.variable} ${jetbrains.variable}`}
    >
      <body className="font-sans antialiased">
        <SpaceBackground />
        <AuthProvider>
          <CallProvider>
            {children}
            <CallNotifications />
          </CallProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
