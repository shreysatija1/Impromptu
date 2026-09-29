const TOPIC_CATEGORIES = {
  science: {
    name: "Science & Tech",
    icon: "🔬",
    topics: [
      "Quantum computing explained to a 10-year-old",
      "Why returning to the Moon matters for humanity",
      "Artificial intelligence: assistant or existential threat?",
      "The most underappreciated scientific discovery",
      "How renewable energy will reshape global geopolitics",
      "If humans could live to 150, should we?",
      "The neurological science behind why we procrastinate",
      "Gene editing with CRISPR: where should we draw the ethical line?",
      "What the ocean depths teach us about outer space",
      "The modern invention we take most for granted",
      "Why space exploration is worth every dollar",
      "How the smartphone rewrote human memory and attention",
      "Why nuclear fusion is so hard, and why it matters",
      "Can machines ever experience genuine consciousness?",
      "A scientific mystery I wish we could solve tomorrow",
    ],
  },
  entertainment: {
    name: "Entertainment",
    icon: "🎬",
    topics: [
      "Why villain origin stories have become so popular",
      "A video game that should be studied as great literature",
      "How streaming platforms permanently altered filmmaking",
      "Why live theater still survives in the digital age",
      "A fictional character who left a permanent mark on me",
      "Short-form video feeds: creative golden age or dopamine trap?",
      "Why nostalgic remakes almost never match the original",
      "A movie soundtrack that completely transformed the film",
      "The psychology of why reality TV is so addicting",
      "How stand-up comedy delivers truths that news cannot",
      "The most underrated genre in music or cinema",
      "Are movie theaters dying, or are they finding a new purpose?",
      "What makes a fictional world feel authentically alive",
      "Why superhero mythology became the dominant modern folklore",
      "A film adaptation that actually surpassed the original book",
    ],
  },
  philosophical: {
    name: "Philosophical",
    icon: "💭",
    topics: [
      "Does free will genuinely exist, or is it a comforting illusion?",
      "The profound difference between happiness and fulfillment",
      "Can any human action ever be 100% selfless?",
      "Is relentless ambition a virtue or a hidden trap?",
      "The modern paradox: why more choices make us less satisfied",
      "What it actually means to live an authentic life",
      "Why voluntary discomfort is essential for personal growth",
      "If you could see your entire future, would you want to?",
      "The crucial gap between acquiring knowledge and gaining wisdom",
      "How nostalgia deceives our memory of the past",
      "Why intentional silence can be more persuasive than speaking",
      "Is it better for a leader to be respected or to be liked?",
      "The unspoken responsibilities we owe to strangers each day",
      "The ethics of white lies: when is dishonesty justified?",
      "Can money buy peace of mind, or only comfort?",
    ],
  },
  work: {
    name: "Work & Leadership",
    icon: "💼",
    topics: [
      "What teamwork looks like when nobody is watching",
      "How to disagree passionately without making it personal",
      "Why curiosity is the ultimate long-term career superpower",
      "The best professional advice I initially ignored, then needed",
      "How to explain an intimidatingly complex idea in simple words",
      "What I observe the exact moment a speaker loses the room",
      "The vital distinction between genuine confidence and pretending",
      "How to exercise influence when you have zero formal authority",
      "Why tight constraints spark dramatically better creativity",
      "How to close a presentation so the audience remembers it next week",
      "The make-or-break first 10 seconds of any talk or pitch",
      "A personal failure that taught me far more than any victory",
      "Why deliberate practice beats raw talent on a difficult day",
      "How to ask for help without feeling or looking inadequate",
      "The future of remote work: freedom versus human connection",
    ],
  },
  life: {
    name: "Life & Society",
    icon: "☕",
    topics: [
      "A tiny daily habit that quietly upgraded my life",
      "The simple kindness that costs nothing but changes someone's day",
      "A minor decision that led to an unexpectedly massive outcome",
      "A physical place that never fails to reset my headspace",
      "How social media distorted the way we celebrate milestones",
      "What I would immediately change about public education",
      "Why unstructured boredom is necessary for creative breakthroughs",
      "The lost art of being a memorable and considerate dinner guest",
      "A crucial life lesson learned from an excruciatingly awkward moment",
      "The unwritten rules of modern social etiquette everyone should follow",
      "Why we stubbornly hold onto possessions we never use",
      "How urban design and architecture influence our daily moods",
      "What my 10-year-old self would think of who I am today",
      "The underestimated value of hobbies you are thoroughly bad at",
      "Why active listening is the rarest skill in modern conversations",
    ],
  },
};

const TARGET_SECONDS = 60;
const RING_LEN = 2 * Math.PI * 52;
const PAUSE_MS = 5000;
const VOICE_RMS = 0.035;

const mainEl = document.querySelector("main");
const lobby = document.getElementById("lobby");
const stage = document.getElementById("stage");
const review = document.getElementById("review");
const stageAttemptBadge = document.getElementById("stage-attempt-badge");
const stageCategoryBadge = document.getElementById("stage-category-badge");
const topicText = document.getElementById("topic-text");
const timeDisplay = document.getElementById("time-display");
const timerLabel = document.getElementById("timer-label");
const ring = document.getElementById("ring");
const micBtn = document.getElementById("mic-btn");
const micLabel = document.getElementById("mic-label");
const statusEl = document.getElementById("status");
const transcriptEl = document.getElementById("transcript");
const liveDot = document.getElementById("live-dot");

// Review elements
const reviewBadge = document.getElementById("review-badge");
const reviewTitle = document.getElementById("review-title");
const reviewTopic = document.getElementById("review-topic");
const singleReview = document.getElementById("single-review");
const comparisonReview = document.getElementById("comparison-review");
const comparisonBanner = document.getElementById("comparison-banner");
const comparisonTbody = document.getElementById("comparison-tbody");
const playback = document.getElementById("playback");
const playback1 = document.getElementById("playback-1");
const playback2 = document.getElementById("playback-2");
const transcript1 = document.getElementById("transcript-1");
const transcript2 = document.getElementById("transcript-2");
const card1Meta = document.getElementById("card1-meta");
const card2Meta = document.getElementById("card2-meta");
const retryBtn = document.getElementById("retry-btn");
const againBtn = document.getElementById("again-btn");
const newTopicBtn = document.getElementById("new-topic-btn");

let selectedCategory = "all";
let topic = "";
let currentCategoryName = "All Topics";
let currentCategoryIcon = "✨";
let elapsedSec = 0;
let ticking = null;
let recognition = null;
let mediaRecorder = null;
let mediaStream = null;
let audioSourceNode = null;
let chunks = [];
let finalText = "";
let interimText = "";
let startedAt = 0;
let active = false;
let audioContext = null;
let analyser = null;
let pauseWatch = null;
let longBreaks = 0;
let hasSpoken = false;
let silenceStartedAt = 0;
let pauseCounted = false;

let attempts = [];
let currentAttemptNumber = 1;

async function getMediaStream() {
  if (
    mediaStream &&
    mediaStream.getAudioTracks().some((t) => t.readyState === "live")
  ) {
    mediaStream.getAudioTracks().forEach((t) => {
      t.enabled = true;
    });
    return mediaStream;
  }
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  return mediaStream;
}

function pauseMediaTracks() {
  if (mediaStream) {
    mediaStream.getAudioTracks().forEach((t) => {
      t.enabled = false;
    });
  }
}

window.addEventListener("beforeunload", () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop());
    mediaStream = null;
  }
});

function getCategoryPool(categoryKey) {
  if (categoryKey && categoryKey !== "all" && TOPIC_CATEGORIES[categoryKey]) {
    const cat = TOPIC_CATEGORIES[categoryKey];
    return cat.topics.map((t) => ({
      text: t,
      categoryKey,
      categoryName: cat.name,
      categoryIcon: cat.icon,
    }));
  }
  const pool = [];
  Object.entries(TOPIC_CATEGORIES).forEach(([catKey, cat]) => {
    cat.topics.forEach((t) => {
      pool.push({
        text: t,
        categoryKey: catKey,
        categoryName: cat.name,
        categoryIcon: cat.icon,
      });
    });
  });
  return pool;
}

function pickTopic() {
  const pool = getCategoryPool(selectedCategory);
  if (pool.length === 0) return topic;

  let candidates = pool;
  if (pool.length > 1) {
    const filtered = pool.filter((item) => item.text !== topic);
    if (filtered.length > 0) candidates = filtered;
  }

  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  topic = picked.text;
  currentCategoryName = picked.categoryName;
  currentCategoryIcon = picked.categoryIcon;
  return topic;
}

function setCategory(catKey) {
  selectedCategory = catKey;
  document.querySelectorAll("#lobby-categories .chip").forEach((btn) => {
    const active = btn.dataset.cat === catKey;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-checked", String(active));
  });
  document.querySelectorAll("#stage-categories .chip").forEach((btn) => {
    const active = btn.dataset.cat === catKey;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-checked", String(active));
  });
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

function pauseAllAudio() {
  [playback, playback1, playback2].forEach((p) => {
    if (p && !p.paused) p.pause();
  });
}

function show(view) {
  const map = { lobby, stage, review };
  Object.entries(map).forEach(([name, el]) => {
    const on = name === view;
    el.classList.toggle("hidden", !on);
    el.toggleAttribute("hidden", !on);
  });
  if (view !== "review" || attempts.length < 2) {
    mainEl.classList.remove("wide");
  }
}

function enterStage(isRetry = false) {
  stopSession(false);
  pauseAllAudio();

  const stageCatBar = document.querySelector(".stage-category-bar");

  if (isRetry) {
    currentAttemptNumber = 2;
    if (attempts.length > 0 && attempts[0].topic) {
      topic = attempts[0].topic;
      currentCategoryName = attempts[0].categoryName || currentCategoryName;
      currentCategoryIcon = attempts[0].categoryIcon || currentCategoryIcon;
      if (attempts[0].categoryKey) {
        setCategory(attempts[0].categoryKey);
      }
    }
    stageAttemptBadge.textContent = "Attempt 2 (Retry)";
    stageAttemptBadge.classList.remove("hidden");
    stageAttemptBadge.removeAttribute("hidden");
    if (stageCatBar) stageCatBar.classList.add("hidden");
    if (newTopicBtn) newTopicBtn.textContent = "Choose a new topic";
  } else {
    currentAttemptNumber = 1;
    attempts.forEach((a) => {
      if (a.audioUrl) URL.revokeObjectURL(a.audioUrl);
    });
    attempts = [];
    pickTopic();
    stageAttemptBadge.classList.add("hidden");
    stageAttemptBadge.setAttribute("hidden", "");
    if (stageCatBar) stageCatBar.classList.remove("hidden");
    if (newTopicBtn) newTopicBtn.textContent = "New topic";
  }

  topicText.textContent = topic;
  if (stageCategoryBadge) {
    stageCategoryBadge.textContent = `${currentCategoryIcon} ${currentCategoryName}`;
  }
  elapsedSec = 0;
  timeDisplay.textContent = formatTime(0);
  timerLabel.textContent = "Ready";
  setRing(0);
  finalText = "";
  interimText = "";
  transcriptEl.textContent = "Your words will appear here as you speak.";
  statusEl.textContent = isRetry
    ? `Retry attempt for: "${topic}". Click 'Start recording' when ready.`
    : "Allow the microphone, speak at your own pace, and click 'Finish speaking' when done.";
  liveDot.classList.add("hidden");
  micBtn.classList.remove("recording");
  micBtn.setAttribute("aria-pressed", "false");
  micLabel.textContent = "Start recording";
  show("stage");
}

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countWord(text, word) {
  const re = new RegExp(`\\b${word}\\b`, "gi");
  return (text.match(re) || []).length;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightFillers(text) {
  return escapeHtml(text).replace(/\b(so|like)\b/gi, "<mark>$1</mark>");
}

function confidenceCopy(soCount, likeCount, pauses, words) {
  const fillers = soCount + likeCount;
  const rate = words ? fillers / words : 0;
  let tone = "Hesitant";
  if (fillers <= 1 && pauses <= 1) tone = "Confident";
  else if (fillers <= 3 && pauses <= 2 && rate < 0.08) tone = "Mostly steady";

  return `${tone}: fewer “so” and “like” usually sounds more sure. You used “so” ${soCount} time${soCount === 1 ? "" : "s"} and “like” ${likeCount} time${likeCount === 1 ? "" : "s"}, with ${pauses} long pause${pauses === 1 ? "" : "s"} of 5+ seconds.`;
}

function readRms() {
  if (!analyser) return 0;
  const data = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(data);
  let sum = 0;
  for (let i = 0; i < data.length; i += 1) {
    const v = (data[i] - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / data.length);
}

function markVoice() {
  hasSpoken = true;
  silenceStartedAt = 0;
  pauseCounted = false;
}

function watchPauses() {
  if (!active) return;
  const speaking = readRms() >= VOICE_RMS;
  const now = Date.now();
  if (speaking) {
    markVoice();
  } else if (hasSpoken) {
    if (!silenceStartedAt) silenceStartedAt = now;
    if (!pauseCounted && now - silenceStartedAt >= PAUSE_MS) {
      longBreaks += 1;
      pauseCounted = true;
    }
  }
}

function stopAudioMeter() {
  if (pauseWatch) {
    clearInterval(pauseWatch);
    pauseWatch = null;
  }
  if (audioContext && audioContext.state === "running") {
    audioContext.suspend().catch(() => {});
  }
}

function SpeechCtor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function getOrCreateRecognition() {
  if (recognition) return recognition;
  const Ctor = SpeechCtor();
  if (!Ctor) {
    statusEl.textContent =
      "This browser has no speech-to-text. Recording still works; try Chrome or Edge for a transcript.";
    return null;
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
    if (shown) markVoice();
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

  return recognition;
}

async function startSession() {
  if (active) return;
  chunks = [];
  finalText = "";
  interimText = "";
  elapsedSec = 0;
  startedAt = Date.now();
  longBreaks = 0;
  hasSpoken = false;
  silenceStartedAt = 0;
  pauseCounted = false;

  try {
    mediaStream = await getMediaStream();
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

  if (!audioContext || audioContext.state === "closed") {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
  if (!analyser) {
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
  }
  if (!audioSourceNode && mediaStream) {
    try {
      audioSourceNode = audioContext.createMediaStreamSource(mediaStream);
      audioSourceNode.connect(analyser);
    } catch {
      /* ignore */
    }
  }
  pauseWatch = setInterval(watchPauses, 100);

  const rec = getOrCreateRecognition();
  if (rec) {
    try {
      rec.start();
      liveDot.classList.remove("hidden");
    } catch {
      /* ignore duplicate start */
    }
  }

  active = true;
  micBtn.classList.add("recording");
  micBtn.setAttribute("aria-pressed", "true");
  micLabel.textContent = "Finish speaking";
  timerLabel.textContent = "Speaking";
  statusEl.textContent = "You are live. Speak your mind and click 'Finish speaking' when done.";
  transcriptEl.textContent = "Listening…";

  ticking = setInterval(() => {
    elapsedSec = (Date.now() - startedAt) / 1000;
    timeDisplay.textContent = formatTime(elapsedSec);
    setRing(Math.min(1, elapsedSec / TARGET_SECONDS));
  }, 200);
}

function stopTracks() {
  pauseMediaTracks();
}

function stopSession(showReview) {
  active = false;
  if (ticking) {
    clearInterval(ticking);
    ticking = null;
  }
  stopAudioMeter();
  liveDot.classList.add("hidden");
  micBtn.classList.remove("recording");
  micBtn.setAttribute("aria-pressed", "false");
  micLabel.textContent = "Start recording";

  if (recognition) {
    try {
      recognition.stop();
    } catch {
      /* ignore */
    }
  }

  const spokenMs = startedAt ? Date.now() - startedAt : 0;
  const spokenSec = spokenMs / 1000;

  const finishRecorder = () => {
    stopAudioMeter();
    pauseMediaTracks();
    if (!showReview) return;

    const captured = `${finalText} ${interimText}`.trim();
    const words = wordCount(captured);
    const wpm = spokenSec > 0 ? Math.round((words / spokenSec) * 60) : 0;
    const soCount = countWord(captured, "so");
    const likeCount = countWord(captured, "like");

    let blob = null;
    let audioUrl = null;
    if (chunks.length) {
      blob = new Blob(chunks, { type: chunks[0].type || "audio/webm" });
      audioUrl = URL.createObjectURL(blob);
    }

    const record = {
      attemptNumber: currentAttemptNumber,
      topic,
      categoryKey: selectedCategory,
      categoryName: currentCategoryName,
      categoryIcon: currentCategoryIcon,
      spokenSec,
      words,
      wpm,
      soCount,
      likeCount,
      pauses: longBreaks,
      confidenceNote: confidenceCopy(soCount, likeCount, longBreaks, words),
      transcript: captured,
      audioBlob: blob,
      audioUrl,
    };

    if (currentAttemptNumber === 1) {
      if (attempts.length > 0 && attempts[0].audioUrl) {
        URL.revokeObjectURL(attempts[0].audioUrl);
      }
      attempts[0] = record;
    } else {
      if (attempts[1] && attempts[1].audioUrl) {
        URL.revokeObjectURL(attempts[1].audioUrl);
      }
      attempts[1] = record;
    }

    timeDisplay.textContent = formatTime(spokenSec);
    setRing(1);
    timerLabel.textContent = "Done";

    if (attempts.length >= 2) {
      renderComparisonReview();
    } else {
      renderSingleReview(attempts[0]);
    }

    show("review");
  };

  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.onstop = finishRecorder;
    mediaRecorder.stop();
  } else {
    finishRecorder();
  }
}

function renderSingleReview(attempt) {
  mainEl.classList.remove("wide");
  singleReview.classList.remove("hidden");
  singleReview.removeAttribute("hidden");
  comparisonReview.classList.add("hidden");
  comparisonReview.setAttribute("hidden", "");

  reviewBadge.textContent = "Attempt 1";
  reviewBadge.classList.remove("hidden");
  reviewTitle.textContent = "How that minute went";
  const catName = attempt.categoryName || currentCategoryName;
  const catIcon = attempt.categoryIcon || currentCategoryIcon;
  reviewTopic.innerHTML = `<span>Topic: <strong>${escapeHtml(attempt.topic || topic)}</strong></span> <span class="badge category-badge">${catIcon} ${escapeHtml(catName)}</span>`;

  document.getElementById("stat-time").textContent = formatTime(attempt.spokenSec);
  document.getElementById("stat-words").textContent = String(attempt.words);
  document.getElementById("stat-wpm").textContent = String(attempt.wpm);
  document.getElementById("stat-so").textContent = String(attempt.soCount);
  document.getElementById("stat-like").textContent = String(attempt.likeCount);
  document.getElementById("stat-pauses").textContent = String(attempt.pauses);
  document.getElementById("confidence-note").textContent = attempt.confidenceNote;
  document.getElementById("final-transcript").innerHTML = attempt.transcript
    ? highlightFillers(attempt.transcript)
    : "<em>No speech was captured.</em>";

  if (attempt.audioUrl) {
    playback.src = attempt.audioUrl;
    playback.classList.remove("hidden");
  } else {
    playback.removeAttribute("src");
    playback.classList.add("hidden");
  }

  retryBtn.textContent = "Try again with this topic";
  retryBtn.className = "btn primary";
  againBtn.textContent = "Choose a new topic";
  againBtn.className = "btn ghost";
}

function renderComparisonReview() {
  const [a1, a2] = attempts;
  mainEl.classList.add("wide");
  singleReview.classList.add("hidden");
  singleReview.setAttribute("hidden", "");
  comparisonReview.classList.remove("hidden");
  comparisonReview.removeAttribute("hidden");

  reviewBadge.textContent = "Comparison • 2 Attempts";
  reviewBadge.classList.remove("hidden");
  reviewTitle.textContent = "Both speeches compared";
  const catName = a1.categoryName || currentCategoryName;
  const catIcon = a1.categoryIcon || currentCategoryIcon;
  reviewTopic.innerHTML = `<span>Topic: <strong>${escapeHtml(a1.topic || topic)}</strong></span> <span class="badge category-badge">${catIcon} ${escapeHtml(catName)}</span>`;

  // Deltas
  const totalFillers1 = a1.soCount + a1.likeCount;
  const totalFillers2 = a2.soCount + a2.likeCount;
  const fillerDiff = totalFillers2 - totalFillers1;
  const pauseDiff = a2.pauses - a1.pauses;
  const wordDiff = a2.words - a1.words;
  const wpmDiff = a2.wpm - a1.wpm;

  // Check if speech was only "a line or 2"
  const MIN_SUBSTANTIAL_WORDS = 20; // Roughly 2 sentences / lines
  const isAttempt2Brief = a2.words < MIN_SUBSTANTIAL_WORDS || (a1.words >= 35 && a2.words < a1.words * 0.35);
  const isBothBrief = a1.words < MIN_SUBSTANTIAL_WORDS && a2.words < MIN_SUBSTANTIAL_WORDS;

  let bannerHeadline = "";
  let highlightHtml = "";

  if (isBothBrief) {
    bannerHeadline = "⚠️ Both attempts were very brief";
    highlightHtml = `
      <p class="comparison-banner-desc">
        Both runs were only a line or two (${a1.words} and ${a2.words} words). Speak for at least a few full sentences to get an accurate evaluation of your pacing, structure, and fillers.
      </p>
    `;
  } else if (isAttempt2Brief) {
    bannerHeadline = "⚠️ Attempt 2 was too brief to show improvement";
    highlightHtml = `
      <p class="comparison-banner-desc">
        You spoke only <strong>${a2.words} word${a2.words === 1 ? "" : "s"}</strong> (${formatTime(a2.spokenSec)}) on your second try, compared to ${a1.words} words in Attempt 1. 
        Speaking only a line or two cannot be counted as an improvement, even if filler counts were lower. 
        Hit <strong>Try again with this topic</strong> and speak through a full topic to see genuine progress!
      </p>
    `;
  } else {
    // Normal comparison when Attempt 2 is a full speech
    const highlights = [];

    if (fillerDiff < 0) {
      highlights.push(`Reduced filler words by ${Math.abs(fillerDiff)} (${totalFillers1} → ${totalFillers2})`);
    } else if (fillerDiff === 0 && totalFillers1 === 0) {
      highlights.push(`Zero filler words across both attempts!`);
    } else if (fillerDiff > 0) {
      highlights.push(`Filler words increased by ${fillerDiff}`);
    }

    if (pauseDiff < 0) {
      highlights.push(`Cut 5s+ pauses down by ${Math.abs(pauseDiff)}`);
    } else if (pauseDiff === 0 && a1.pauses === 0) {
      highlights.push(`Smooth delivery with no 5s+ pauses`);
    }

    if (wpmDiff > 5) {
      highlights.push(`Increased speaking pace by ${wpmDiff} WPM`);
    } else if (wpmDiff < -5) {
      highlights.push(`Delivered at a more measured pace (${wpmDiff} WPM)`);
    }

    if (fillerDiff <= 0 && pauseDiff <= 0 && (fillerDiff < 0 || pauseDiff < 0) && a2.words >= a1.words * 0.65) {
      bannerHeadline = "🎉 Clear improvement on your second run!";
    } else if (fillerDiff <= 0 && pauseDiff <= 0) {
      bannerHeadline = "👏 Consistent, steady delivery across both runs!";
    } else {
      bannerHeadline = "📊 Here is how your two attempts compare!";
    }

    highlightHtml = highlights.length
      ? `<p class="comparison-banner-desc"><strong>Key Highlights:</strong> ${highlights.join(" • ")}</p>`
      : `<p class="comparison-banner-desc">Review your two recordings and transcripts below to compare your delivery.</p>`;
  }

  comparisonBanner.innerHTML = `
    <div class="comparison-banner-title">${bannerHeadline}</div>
    ${highlightHtml}
  `;

  function deltaBadge(diff, unit = "", lowerIsBetter = false, isFillerOrPause = false) {
    if (diff === 0) {
      return `<span class="delta neutral">Same</span>`;
    }
    // If Attempt 2 was too brief, do not award green "improvement" badges for lower fillers, pauses, or pace spikes
    if (isAttempt2Brief && ((isFillerOrPause && diff < 0) || unit === "wpm")) {
      return `<span class="delta neutral">${diff > 0 ? "+" : ""}${diff}${unit ? " " + unit : ""} (too brief)</span>`;
    }
    const isGood = lowerIsBetter ? diff < 0 : diff > 0;
    const sign = diff > 0 ? "+" : "";
    const cls = isGood ? "good" : "warn";
    const arrow = lowerIsBetter ? (diff < 0 ? "↓ " : "↑ ") : (diff > 0 ? "↑ " : "↓ ");
    return `<span class="delta ${cls}">${arrow}${sign}${diff}${unit ? " " + unit : ""}</span>`;
  }

  const secDiff = Math.round(a2.spokenSec - a1.spokenSec);
  const secDeltaHtml = secDiff === 0
    ? `<span class="delta neutral">Same</span>`
    : `<span class="delta neutral">${secDiff > 0 ? "+" : ""}${secDiff}s</span>`;

  comparisonTbody.innerHTML = `
    <tr>
      <td><strong>Speaking Time</strong></td>
      <td>${formatTime(a1.spokenSec)}</td>
      <td>${formatTime(a2.spokenSec)}</td>
      <td>${secDeltaHtml}</td>
    </tr>
    <tr>
      <td><strong>Total Words</strong></td>
      <td>${a1.words}</td>
      <td>${a2.words}</td>
      <td>${deltaBadge(wordDiff, "words", false, false)}</td>
    </tr>
    <tr>
      <td><strong>Pace (WPM)</strong></td>
      <td>${a1.wpm}</td>
      <td>${a2.wpm}</td>
      <td>${deltaBadge(wpmDiff, "wpm", false, false)}</td>
    </tr>
    <tr>
      <td><strong>“so” Fillers</strong></td>
      <td>${a1.soCount}</td>
      <td>${a2.soCount}</td>
      <td>${deltaBadge(a2.soCount - a1.soCount, "", true, true)}</td>
    </tr>
    <tr>
      <td><strong>“like” Fillers</strong></td>
      <td>${a1.likeCount}</td>
      <td>${a2.likeCount}</td>
      <td>${deltaBadge(a2.likeCount - a1.likeCount, "", true, true)}</td>
    </tr>
    <tr>
      <td><strong>Long Pauses (5s+)</strong></td>
      <td>${a1.pauses}</td>
      <td>${a2.pauses}</td>
      <td>${deltaBadge(pauseDiff, "", true, true)}</td>
    </tr>
  `;

  card1Meta.textContent = `${formatTime(a1.spokenSec)} • ${a1.words} words • ${totalFillers1} filler${totalFillers1 === 1 ? "" : "s"}`;
  if (a1.audioUrl) {
    playback1.src = a1.audioUrl;
    playback1.classList.remove("hidden");
  } else {
    playback1.removeAttribute("src");
    playback1.classList.add("hidden");
  }
  transcript1.innerHTML = a1.transcript
    ? highlightFillers(a1.transcript)
    : "<em>No speech was captured.</em>";

  card2Meta.textContent = `${formatTime(a2.spokenSec)} • ${a2.words} words • ${totalFillers2} filler${totalFillers2 === 1 ? "" : "s"}`;
  if (a2.audioUrl) {
    playback2.src = a2.audioUrl;
    playback2.classList.remove("hidden");
  } else {
    playback2.removeAttribute("src");
    playback2.classList.add("hidden");
  }
  transcript2.innerHTML = a2.transcript
    ? highlightFillers(a2.transcript)
    : "<em>No speech was captured.</em>";

  retryBtn.textContent = "Try again with this topic";
  retryBtn.className = "btn ghost";
  againBtn.textContent = "Choose a new topic";
  againBtn.className = "btn primary";
}

function setupCategoryListeners() {
  document.querySelectorAll("#lobby-categories .chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      setCategory(btn.dataset.cat);
    });
  });

  document.querySelectorAll("#stage-categories .chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      setCategory(btn.dataset.cat);
      if (!active) {
        if (currentAttemptNumber > 1) {
          currentAttemptNumber = 1;
          attempts = [];
          stageAttemptBadge.classList.add("hidden");
          stageAttemptBadge.setAttribute("hidden", "");
        }
        pickTopic();
        topicText.textContent = topic;
        if (stageCategoryBadge) {
          stageCategoryBadge.textContent = `${currentCategoryIcon} ${currentCategoryName}`;
        }
      }
    });
  });
}

setupCategoryListeners();

retryBtn.addEventListener("click", () => enterStage(true));
againBtn.addEventListener("click", () => enterStage(false));
document.getElementById("start-btn").addEventListener("click", () => enterStage(false));
newTopicBtn.addEventListener("click", () => enterStage(false));
micBtn.addEventListener("click", () => {
  if (active) stopSession(true);
  else startSession();
});

playback1.addEventListener("play", () => {
  if (playback2 && !playback2.paused) playback2.pause();
});
playback2.addEventListener("play", () => {
  if (playback1 && !playback1.paused) playback1.pause();
});

setRing(0);
