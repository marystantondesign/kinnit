import { useCallback, useEffect, useRef, useState } from "react";

// ─── Live speech capture for Talk to Kinnit ──────────────────────────────────
//
// Uses the browser's Web Speech API for the live transcript and the
// microphone stream (via an AnalyserNode) to drive the waveform.

export type CaptureStatus =
  | "idle"
  | "requesting"
  | "listening"
  | "paused"
  | "denied"        // microphone permission refused
  | "unsupported";  // browser has no speech recognition

/* eslint-disable @typescript-eslint/no-explicit-any */
type Recognition = any;

function getRecognitionCtor(): (new () => Recognition) | undefined {
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const BAR_COUNT = 9;
const FLAT = Array(BAR_COUNT).fill(0);

export function useSpeechCapture() {
  const [status, setStatus] = useState<CaptureStatus>("idle");
  const [transcript, setTranscriptState] = useState("");
  const [levels, setLevels] = useState<number[]>(FLAT);

  const statusRef = useRef<CaptureStatus>("idle");
  const committedRef = useRef("");
  const interimRef = useRef("");
  const recognitionRef = useRef<Recognition>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);

  const setStatusBoth = (s: CaptureStatus) => {
    statusRef.current = s;
    setStatus(s);
  };

  const publish = () => {
    const joined = [committedRef.current, interimRef.current].filter(Boolean).join(" ");
    setTranscriptState(joined);
  };

  const teardownAudio = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setLevels(FLAT);
  };

  const startMeter = (stream: MediaStream) => {
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.75;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const bins = new Uint8Array(analyser.frequencyBinCount);
    let last = 0;

    const tick = (t: number) => {
      rafRef.current = requestAnimationFrame(tick);
      if (t - last < 60) return;
      last = t;
      if (statusRef.current !== "listening") {
        setLevels(FLAT);
        return;
      }
      analyser.getByteFrequencyData(bins);
      // Voice energy lives mostly in the lower bins; spread it over the bars.
      const next = Array.from({ length: BAR_COUNT }, (_, i) => {
        const from = 2 + i * 3;
        let sum = 0;
        for (let b = from; b < from + 3; b++) sum += bins[b];
        return Math.min(1, sum / 3 / 180);
      });
      setLevels(next);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const startRecognition = () => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    const rec: Recognition = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript.trim();
        if (e.results[i].isFinal) {
          committedRef.current = [committedRef.current, text].filter(Boolean).join(" ");
        } else {
          interim += `${text} `;
        }
      }
      interimRef.current = interim.trim();
      publish();
    };
    rec.onerror = (e: any) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setStatusBoth("denied");
        teardownAudio();
      }
    };
    // Browsers end recognition after a stretch of silence; keep going while listening.
    rec.onend = () => {
      if (interimRef.current) {
        committedRef.current = [committedRef.current, interimRef.current].filter(Boolean).join(" ");
        interimRef.current = "";
        publish();
      }
      if (statusRef.current === "listening" && recognitionRef.current === rec) {
        try { rec.start(); } catch {}
      }
    };
    recognitionRef.current = rec;
    try { rec.start(); } catch {}
  };

  const stopRecognition = () => {
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) {
      rec.onend = null;
      try { rec.stop(); } catch {}
    }
    if (interimRef.current) {
      committedRef.current = [committedRef.current, interimRef.current].filter(Boolean).join(" ");
      interimRef.current = "";
      publish();
    }
  };

  /** Begin a fresh capture. */
  const start = useCallback(async () => {
    committedRef.current = "";
    interimRef.current = "";
    setTranscriptState("");
    setStatusBoth("requesting");

    if (!getRecognitionCtor() || !navigator.mediaDevices?.getUserMedia) {
      setStatusBoth("unsupported");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setStatusBoth("listening");
      startMeter(stream);
      startRecognition();
    } catch {
      setStatusBoth("denied");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pause = useCallback(() => {
    if (statusRef.current !== "listening") return;
    setStatusBoth("paused");
    stopRecognition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resume = useCallback(() => {
    if (statusRef.current !== "paused") return;
    setStatusBoth("listening");
    startRecognition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** End capture and return the final transcript. */
  const stop = useCallback((): string => {
    stopRecognition();
    teardownAudio();
    setStatusBoth("idle");
    return committedRef.current.trim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Replace the transcript (when the user edits it). */
  const setTranscript = useCallback((text: string) => {
    committedRef.current = text;
    interimRef.current = "";
    setTranscriptState(text);
  }, []);

  useEffect(() => () => {
    stopRecognition();
    teardownAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, transcript, levels, start, pause, resume, stop, setTranscript };
}
