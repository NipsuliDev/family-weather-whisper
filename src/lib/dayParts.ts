
export function getDayParts(now: Date): { current: string; next: string[] } {
  const h = now.getHours();
  // Simple logic: 0-11 morning, 12-17 afternoon, 18-23 evening
  if (h < 12) {
    return {
      current: "This morning",
      next: ["This afternoon", "This evening"]
    };
  }
  if (h < 18) {
    return {
      current: "This afternoon",
      next: ["This evening", "Tomorrow morning"]
    };
  }
  // evening fallback
  return {
    current: "This evening",
    next: ["Tomorrow morning", "Tomorrow afternoon"]
  };
}
