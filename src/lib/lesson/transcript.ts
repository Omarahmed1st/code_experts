// OUTPUT boxes show a terminal session: what the program printed, with each
// line the user typed shown where the program read it (as a real terminal
// echoes your typing). The lesson stores that transcript as one string plus the
// keyboard input. This module finds the typed lines inside the transcript, so
// the stage can colour them and the code checker can remove them and compare
// the rest with what the program really printed.

export interface TranscriptPart {
  text: string;
  typed: boolean;
}

/**
 * Splits a transcript into printed and typed parts. Each input line (with its
 * newline) is looked for in order, after the previous one; lines the program
 * never read are simply not found.
 */
export function splitTranscript(transcript: string, input: string): TranscriptPart[] {
  const lines = input === "" ? [] : input.replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n");
  const parts: TranscriptPart[] = [];
  let cursor = 0;
  for (const line of lines) {
    const at = transcript.indexOf(`${line}\n`, cursor);
    if (at === -1) break;
    if (at > cursor) parts.push({ text: transcript.slice(cursor, at), typed: false });
    parts.push({ text: `${line}\n`, typed: true });
    cursor = at + line.length + 1;
  }
  if (cursor < transcript.length) parts.push({ text: transcript.slice(cursor), typed: false });
  return parts;
}

/** Only what the program printed: the transcript without the echoed typing. */
export function printedPart(transcript: string, input: string): string {
  return splitTranscript(transcript, input)
    .filter((p) => !p.typed)
    .map((p) => p.text)
    .join("");
}
