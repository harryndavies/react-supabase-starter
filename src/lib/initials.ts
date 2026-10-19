/** Initials for someone without a picture: "Sam Smith" -> "SS", "sam" -> "S". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const letters = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts.slice(0, 1)
  return letters.map((p) => p?.[0]?.toUpperCase() ?? '').join('') || '?'
}
