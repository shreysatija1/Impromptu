const TOPICS = [
  "Why curiosity is a career skill",
  "A habit that quietly changed my week",
  "What I would tell my younger self about public speaking",
  "The difference between confidence and pretending",
  "How to explain a hard idea in simple words",
  "A failure that taught me more than a win",
  "Why listening is part of presenting",
  "The first 10 seconds of a talk",
  "What makes a story memorable",
  "How I stay calm when I forget my next line",
  "A tool I overuse, and what I would use instead",
  "Why constraints make better ideas",
  "The best advice I ignored, then needed",
  "How to disagree without making it personal",
  "What teamwork looks like when nobody is watching",
  "A book, film, or song that shifted my thinking",
  "Why practice beats talent on a bad day",
  "How I would pitch a weekend project in one minute",
  "The kindness that costs almost nothing",
  "What I notice when a speaker loses the room",
  "A small decision that had a big effect",
  "How to start when you do not feel ready",
  "Why silence can be a powerful pause",
  "The future of remote work, in one minute",
  "What I would change about school presentations",
  "How to ask for help without shrinking",
  "A place that always resets my mind",
  "Why body language matters more than slides",
  "The most useful question I know",
  "How to close a talk so people remember it",
];

const SPEAK_SECONDS = 60;
const RING_LEN = 2 * Math.PI * 52;

const lobby = document.getElementById("lobby");
const stage = document.getElementById("stage");
const review = document.getElementById("review");
const topicText = document.getElementById("topic-text");
const timeDisplay = document.getElementById("time-display");
const timerLabel = document.getElementById("timer-label");
const ring = document.getElementById("ring");
const micBtn = document.getElementById("mic-btn");
const micLabel = document.getElementById("mic-label");
const statusEl = document.getElementById("status");
const transcriptEl = document.getElementById("transcript");
const liveDot = document.getElementById("live-dot");
const playback = document.getElementById("playback");

let topic = "";
let remaining = SPEAK_SECONDS;
let ticking = null;
let recognition = null;
let mediaRecorder = null;
let mediaStream = null;
let chunks = [];
let finalText = "";
let interimText = "";
let startedAt = 0;
let active = false;

function pickTopic() {
  let next = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  if (TOPICS.length > 1) {
    while (next === topic) {
      next = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    }
  }
  topic = next;
  return topic;
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function setRing(ratio) {
  ring.style.strokeDasharray = String(RING_LEN);
  ring.style.strokeDashoffset = String(RING_LEN * (1 - ratio));
}

function show(view) {
  const map = { lobby, stage, review };
  Object.entries(map).forEach(([name, el]) => {
    const on = name === view;
    el.classList.toggle("hidden", !on);
    el.toggleAttribute("hidden", !on);
  });
}

function enterStage() {
  stopSession(false);
  pickTopic();
  topicText.textContent = topic;
  remaining = SPEAK_SECONDS;
  timeDisplay.textContent = formatTime(remaining);
  timerLabel.textContent = "Ready";
  setRing(1);
  finalText = "";
  interimText = "";
  transcriptEl.textContent = "Your words will appear here as you speak.";
  statusEl.textContent = "Allow the microphone, then speak clearly.";
  liveDot.classList.add("hidden");
  micBtn.classList.remove("recording");
  micBtn.setAttribute("aria-pressed", "false");
  micLabel.textContent = "Start recording";
  show("stage");
}

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function SpeechCtor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function attachRecognition() {
  const Ctor = SpeechCtor();
  if (!Ctor) {
    statusEl.textContent =
      "This browser has no speech-to-text. Recording still works; try Chrome or Edge for a transcript.";
    return;
  }
  recognition = new Ctor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = navigator.language || "en-US";

  recognition.onresult = (event) => {
    let interim = "";
    let finals = finalText;
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const piece = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finals = `${finals} ${piece}`.trim();
      } else {
        interim += piece;
      }
    }
    finalText = finals;
    interimText = interim;
    const shown = `${finalText} ${interimText}`.trim();
    transcriptEl.textContent = shown || "Listening…";
  };

  recognition.onerror = (event) => {
    if (event.error === "not-allowed") {
      statusEl.textContent = "Microphone permission was blocked.";
    } else if (event.error === "network") {
      statusEl.textContent =
        "Speech-to-text needs a network connection in Chrome or Edge. Audio is still recording.";
    } else if (event.error !== "no-speech" && event.error !== "aborted") {
      statusEl.textContent = `Speech recognition: ${event.error}`;
    }
  };

  recognition.onend = () => {
    if (active) {
      try {
        recognition.start();
      } catch {
        /* already starting */
      }
    }
  };
}

async function startSession() {
  if (active) return;
  chunks = [];
  finalText = "";
  interimText = "";
  remaining = SPEAK_SECONDS;
  startedAt = Date.now();

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    statusEl.textContent = "Could not open the microphone. Check browser permissions.";
    return;
  }

  const mime = MediaRecorder.isTypeSupported("audio/webm")
    ? "audio/webm"
    : MediaRecorder.isTypeSupported("audio/mp4")
      ? "audio/mp4"
      : "";
  mediaRecorder = mime
    ? new MediaRecorder(mediaStream, { mimeType: mime })
    : new MediaRecorder(mediaStream);
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };
  mediaRecorder.start(250);

  attachRecognition();
  if (recognition) {
    try {
      recognition.start();
      liveDot.classList.remove("hidden");
    } catch {
      /* ignore duplicate start */
    }
  }

  active = true;
  micBtn.classList.add("recording");
  micBtn.setAttribute("aria-pressed", "true");
  micLabel.textContent = "Stop early";
  timerLabel.textContent = "Speaking";
  statusEl.textContent = "You are live. Aim for a clear opening, one idea, and a close.";
  transcriptEl.textContent = "Listening…";

  ticking = setInterval(() => {
    const elapsed = (Date.now() - startedAt) / 1000;
    remaining = SPEAK_SECONDS - elapsed;
    timeDisplay.textContent = formatTime(remaining);
    setRing(Math.max(0, remaining / SPEAK_SECONDS));
    if (remaining <= 0) {
      stopSession(true);
    }
  }, 200);
}

function stopTracks() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop());
    mediaStream = null;
  }
}

function stopSession(showReview) {
  active = false;
  if (ticking) {
    clearInterval(ticking);
    ticking = null;
  }
  liveDot.classList.add("hidden");
  micBtn.classList.remove("recording");
  micBtn.setAttribute("aria-pressed", "false");
  micLabel.textContent = "Start recording";

  if (recognition) {
    try {
      recognition.onend = null;
      recognition.stop();
    } catch {
      /* ignore */
    }
    recognition = null;
  }

  const spokenMs = startedAt ? Date.now() - startedAt : 0;
  const spokenSec = Math.min(SPEAK_SECONDS, spokenMs / 1000);

  const finishRecorder = () => {
    stopTracks();
    if (!showReview) return;

    const text = `${finalText} ${interimText}`.trim() || "No speech was captured.";
    const words = wordCount(text === "No speech was captured." ? "" : text);
    const wpm = spokenSec > 0 ? Math.round((words / spokenSec) * 60) : 0;

    document.getElementById("review-topic").textContent = `Topic: ${topic}`;
    document.getElementById("stat-time").textContent = formatTime(spokenSec);
    document.getElementById("stat-words").textContent = String(words);
    document.getElementById("stat-wpm").textContent = String(wpm);
    document.getElementById("final-transcript").textContent = text;

    if (chunks.length) {
      const blob = new Blob(chunks, { type: chunks[0].type || "audio/webm" });
      playback.src = URL.createObjectURL(blob);
      playback.classList.remove("hidden");
    } else {
      playback.removeAttribute("src");
    }

    timeDisplay.textContent = "0:00";
    setRing(0);
    timerLabel.textContent = "Done";
    show("review");
  };

  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.onstop = finishRecorder;
    mediaRecorder.stop();
  } else {
    finishRecorder();
  }
}

document.getElementById("start-btn").addEventListener("click", enterStage);
document.getElementById("new-topic-btn").addEventListener("click", enterStage);
document.getElementById("again-btn").addEventListener("click", enterStage);
micBtn.addEventListener("click", () => {
  if (active) stopSession(true);
  else startSession();
});

setRing(1);
