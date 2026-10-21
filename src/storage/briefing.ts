import type { Briefing, BriefingItem } from "../data/sampleBriefing";

const collectionKeys = [
  "executeNow",
  "decisionsRequired",
  "atRisk",
  "waiting",
  "opportunities",
  "relationshipRepairs",
  "reviewQueue",
] as const;

export function removeRecommendation(briefing: Briefing, recommendationId: string): Briefing {
  const next: Briefing = { ...briefing };
  for (const key of collectionKeys) {
    next[key] = briefing[key].filter((item) => item.id !== recommendationId);
  }

  if (briefing.nextBestAction.id === recommendationId) {
    const candidates = collectionKeys
      .flatMap((key) => next[key])
      .sort((left, right) => right.impactScore - left.impactScore);
    if (candidates[0]) next.nextBestAction = candidates[0];
  }

  next.generatedAt = new Date().toISOString();
  next.status = "Briefing updated.";
  return next;
}

export function deferRecommendation(
  briefing: Briefing,
  recommendationId: string,
): Briefing {
  const next = removeRecommendation(briefing, recommendationId);
  const original = findRecommendation(briefing, recommendationId);
  if (!original) return next;

  const deferred: BriefingItem = {
    ...original,
    id: `${original.id}-deferred-${Date.now()}`,
    title: `${original.title} (deferred)`,
    context: "Deferred for later review.",
    actions: [{ id: "review", label: "Review" }],
    tone: "neutral",
  };
  next.reviewQueue = [...next.reviewQueue, deferred];
  return next;
}

export function findRecommendation(
  briefing: Briefing,
  recommendationId: string,
): BriefingItem | undefined {
  if (briefing.nextBestAction.id === recommendationId) return briefing.nextBestAction;
  return collectionKeys.flatMap((key) => briefing[key]).find((item) => item.id === recommendationId);
}
