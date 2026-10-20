// Drawing a practice exam's questions from the course's question bank.
//
// Each rule asks for `count` questions matching a type, difficulty and topic
// (null = any). No question is drawn twice in one attempt. Rules with the
// fewest candidates pick first, so a narrow rule isn't starved by a broad one.

export interface DrawRule {
  count: number;
  type: string | null;
  difficulty: string | null;
  topicId: string | null;
  points: number;
}

export interface DrawCandidate {
  id: string;
  type: string;
  difficulty: string;
  topicId: string | null;
}

export interface Drawn {
  ids: string[];
  points: number[];
}

const fits = (rule: DrawRule, c: DrawCandidate) =>
  (rule.type === null || rule.type === c.type) &&
  (rule.difficulty === null || rule.difficulty === c.difficulty) &&
  (rule.topicId === null || rule.topicId === c.topicId);

/** One random draw, or null when the bank can't satisfy the rules. */
export function drawExam(rules: readonly DrawRule[], bank: readonly DrawCandidate[], random: () => number): Drawn | null {
  const order = rules
    .map((rule, index) => ({ rule, index, pool: bank.filter((c) => fits(rule, c)) }))
    .sort((a, b) => a.pool.length - b.pool.length || a.index - b.index);
  const used = new Set<string>();
  const picked: { rule: number; id: string; points: number }[] = [];
  for (const { rule, index, pool } of order) {
    const free = pool.filter((c) => !used.has(c.id));
    if (free.length < rule.count) return null;
    for (let n = 0; n < rule.count; n++) {
      const at = Math.floor(random() * free.length);
      const [choice] = free.splice(at, 1);
      if (!choice) return null;
      used.add(choice.id);
      picked.push({ rule: index, id: choice.id, points: rule.points });
    }
  }
  // Questions come out grouped in the template's rule order; shuffling is the caller's choice.
  picked.sort((a, b) => a.rule - b.rule);
  return { ids: picked.map((p) => p.id), points: picked.map((p) => p.points) };
}

/** Tries a few random draws before giving up (the greedy order can, rarely, paint itself into a corner). */
export function drawExamWithRetries(
  rules: readonly DrawRule[],
  bank: readonly DrawCandidate[],
  random: () => number,
  tries = 20,
): Drawn | null {
  for (let i = 0; i < tries; i++) {
    const drawn = drawExam(rules, bank, random);
    if (drawn) return drawn;
  }
  return null;
}

/**
 * A custom exam: `count` questions spread as evenly as possible over the
 * chosen topics (one from each topic in turn), then shuffled. When the topics
 * don't have enough questions, it returns all of them.
 */
export function drawAcrossTopics<T extends { id: string; topicId: string | null }>(bank: readonly T[], count: number, random: () => number): T[] {
  const byTopic = new Map<string | null, T[]>();
  for (const q of bank) byTopic.set(q.topicId, [...(byTopic.get(q.topicId) ?? []), q]);
  const pools = shuffledCopy([...byTopic.values()].map((pool) => shuffledCopy(pool, random)), random);
  const picked: T[] = [];
  while (picked.length < count && pools.some((pool) => pool.length > 0)) {
    for (const pool of pools) {
      const next = pool.pop();
      if (next) picked.push(next);
      if (picked.length === count) break;
    }
  }
  return shuffledCopy(picked, random);
}

function shuffledCopy<T>(items: readonly T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/**
 * One of a quiz's models (versions) at random, never `avoid` (the model this
 * browser got last time) when there is another to give.
 */
export function pickModel<T extends { label: string }>(models: readonly T[], avoid: string | null, random: () => number): T | undefined {
  const pool = models.length > 1 ? models.filter((m) => m.label !== avoid) : models;
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}
