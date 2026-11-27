export function getRedirectPath(state: unknown, fallback: string): string {
  if (
    typeof state === "object" &&
    state !== null &&
    "from" in state &&
    typeof state["from"] === "string"
  ) {
    return state["from"];
  }
  return fallback;
}
