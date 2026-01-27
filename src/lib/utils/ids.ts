// Simple ID generation for entities that don't have UUIDs

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
