export class DomainError extends Error {
  constructor(public readonly code: string, message: string, public readonly status = 400) {
    super(message);
    this.name = "DomainError";
  }
}

export function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new DomainError("INTEGRATION_UNCONFIGURED", `${name} is required for this feature.`, 503);
  return value;
}
