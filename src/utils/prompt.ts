export function confirm(message: string, opts: { noInput?: boolean; force?: boolean }): boolean {
  if (opts.force) return true;
  if (opts.noInput) {
    console.error("Confirmation required but --no-input is set. Use --force to skip.");
    process.exit(1);
  }
  const answer = prompt(`${message} [y/N] `);
  return answer?.toLowerCase() === "y" || answer?.toLowerCase() === "yes";
}
