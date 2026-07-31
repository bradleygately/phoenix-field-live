import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { appendChunk } from "@/lib/audio-store";

export type RecorderStatus = "idle" | "requesting" | "recording" | "denied" | "error";

interface RecorderValue {
  status: RecorderStatus;
  /** interview currently being recorded */
  interviewId: string | null;
  elapsedMs: number;
  error: string | null;
  start: (interviewId: string) => Promise<boolean>;
  stop: () => Promise<{ key: string; ms: number } | null>;
  clearError: () => void;
}

const Ctx = createContext<RecorderValue | null>(null);

export function recordingKeyFor(interviewId: string): string {
  return `rec-${interviewId}`;
}

export function RecorderProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsed] = useState(0);
  const startedAt = useRef<number | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (status !== "recording") return;
    const id = window.setInterval(() => {
      setElapsed(startedAt.current ? Date.now() - startedAt.current : 0);
    }, 500);
    return () => window.clearInterval(id);
  }, [status]);

  const start = useCallback<RecorderValue["start"]>(async (id) => {
    if (recorder.current) return true;
    setError(null);
    setStatus("requesting");
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("This device or browser cannot record audio here.");
      }
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      const key = recordingKeyFor(id);
      const rec = new MediaRecorder(media);
      // Timeslice writes each slice straight to storage, so a sleeping screen
      // or a backgrounded app cannot lose the take.
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) void appendChunk(key, e.data);
      };
      rec.start(5000);
      stream.current = media;
      recorder.current = rec;
      startedAt.current = Date.now();
      setElapsed(0);
      setInterviewId(id);
      setStatus("recording");
      return true;
    } catch (err) {
      const name = (err as { name?: string })?.name;
      const denied = name === "NotAllowedError" || name === "SecurityError";
      setStatus(denied ? "denied" : "error");
      setError(
        denied
          ? "Microphone permission was blocked. Allow the mic for this site, then retry."
          : ((err as Error)?.message ?? "Could not start the microphone."),
      );
      return false;
    }
  }, []);

  const stop = useCallback<RecorderValue["stop"]>(async () => {
    const rec = recorder.current;
    const id = interviewId;
    if (!rec || !id) return null;
    const ms = startedAt.current ? Date.now() - startedAt.current : 0;
    await new Promise<void>((resolve) => {
      rec.onstop = () => resolve();
      rec.stop();
    });
    stream.current?.getTracks().forEach((t) => t.stop());
    recorder.current = null;
    stream.current = null;
    startedAt.current = null;
    setStatus("idle");
    setInterviewId(null);
    setElapsed(0);
    return { key: recordingKeyFor(id), ms };
  }, [interviewId]);

  return (
    <Ctx.Provider
      value={{
        status,
        interviewId,
        elapsedMs,
        error,
        start,
        stop,
        clearError: () => {
          setError(null);
          setStatus("idle");
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useRecorder(): RecorderValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRecorder must be used inside RecorderProvider");
  return ctx;
}
