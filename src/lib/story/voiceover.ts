/**
 * Voiceover planner — deterministic script / timing / breathing / pauses
 * / emphasis / speed / captions math for a slide's voiceover.
 *
 * Pure. Given a slide's voiceover script + a target speech rate (WPM),
 * returns per-word timing, breathing points, and caption chunks tuned
 * to the slide's declared duration.
 */

export type VoiceoverPlan = {
  totalWords: number;
  totalSeconds: number;
  wpm: number;
  /** Suggested per-word cursor time in seconds */
  wordTimings: WordTiming[];
  /** Word indices where a breath is recommended */
  breaths: number[];
  /** Word indices marked as emphasis (based on ALL-CAPS or leading asterisk) */
  emphasis: number[];
  /** Caption chunks — arrays of words grouped by ~40 char blocks */
  captions: CaptionChunk[];
};

export type WordTiming = {
  word: string;
  index: number;
  startAt: number; // seconds
  endAt: number;
};

export type CaptionChunk = {
  text: string;
  startAt: number;
  endAt: number;
};

export type PlanOptions = {
  /** Target words per minute. Defaults to 140. */
  wpm?: number;
  /** Override total duration in seconds; the plan will scale timings. */
  targetSeconds?: number;
  /** Insert a breath after N seconds of speaking */
  breathEverySeconds?: number;
};

// ─── Tokeniser ────────────────────────────────────────────────────────────

const TOKEN_RE = /(\S+)/g;

function tokenise(script: string): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const re = TOKEN_RE;
  re.lastIndex = 0;
  while ((m = re.exec(script))) out.push(m[1]!);
  return out;
}

// ─── Planner ─────────────────────────────────────────────────────────────

export function planVoiceover(script: string, opts: PlanOptions = {}): VoiceoverPlan {
  const wpm = opts.wpm ?? 140;
  const breathEvery = opts.breathEverySeconds ?? 8;
  const words = tokenise(script);
  const totalWords = words.length;
  const naturalSeconds = totalWords > 0 ? (totalWords / wpm) * 60 : 0;
  const totalSeconds = opts.targetSeconds != null && naturalSeconds > 0
    ? opts.targetSeconds
    : naturalSeconds;
  const scale = naturalSeconds > 0 && totalSeconds > 0 ? totalSeconds / naturalSeconds : 1;

  const wordTimings: WordTiming[] = [];
  const breaths: number[] = [];
  const emphasis: number[] = [];
  let cursor = 0;
  let lastBreathSecond = 0;
  const perWord = totalWords > 0 ? totalSeconds / totalWords : 0;

  words.forEach((raw, i) => {
    const startAt = cursor;
    const endAt = startAt + perWord;
    // Emphasise ALL-CAPS words (3+ chars) or *word*
    if (/^[A-Z]{3,}$/.test(raw) || /^\*.+\*$/.test(raw)) {
      emphasis.push(i);
    }
    wordTimings.push({ word: stripMarkup(raw), index: i, startAt, endAt });
    cursor = endAt;
    // Punctuation-based pause; add a scaled pause after ',' and '.'
    if (/[,;:]$/.test(raw)) cursor += 0.15 * scale;
    if (/[.!?]$/.test(raw)) cursor += 0.35 * scale;
    if (cursor - lastBreathSecond >= breathEvery && /[.!?]$/.test(raw)) {
      breaths.push(i);
      lastBreathSecond = cursor;
    }
  });

  const captions = groupCaptions(wordTimings);

  return {
    totalWords,
    totalSeconds: cursor > 0 ? cursor : totalSeconds,
    wpm,
    wordTimings,
    breaths,
    emphasis,
    captions,
  };
}

function stripMarkup(word: string): string {
  return word.replace(/^\*/, "").replace(/\*$/, "");
}

function groupCaptions(words: WordTiming[]): CaptionChunk[] {
  const CHUNK_MAX_CHARS = 40;
  const chunks: CaptionChunk[] = [];
  let buffer: WordTiming[] = [];
  let bufferLen = 0;

  const flush = () => {
    if (!buffer.length) return;
    const text = buffer.map((w) => w.word).join(" ");
    chunks.push({
      text,
      startAt: buffer[0]!.startAt,
      endAt: buffer[buffer.length - 1]!.endAt,
    });
    buffer = [];
    bufferLen = 0;
  };

  for (const w of words) {
    const wordLen = w.word.length + 1; // + space
    if (bufferLen + wordLen > CHUNK_MAX_CHARS) flush();
    buffer.push(w);
    bufferLen += wordLen;
  }
  flush();
  return chunks;
}

// ─── Read helpers ────────────────────────────────────────────────────────

export function fitsInDuration(plan: VoiceoverPlan, durationSeconds: number): boolean {
  return plan.totalSeconds <= durationSeconds;
}

export function requiredWpm(script: string, durationSeconds: number): number {
  const words = tokenise(script).length;
  if (durationSeconds <= 0 || words === 0) return 0;
  return Math.round((words / durationSeconds) * 60);
}
