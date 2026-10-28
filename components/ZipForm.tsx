// Posts to /lookup so the ZIP never lands in a URL someone might share.
export function ZipForm({ error }: { error?: string }) {
  return (
    <form id="zip" action="/lookup" method="post" className="space-y-2">
      <label htmlFor="zip-input" className="block text-sm font-semibold uppercase tracking-wide">
        Your ZIP code
      </label>
      <div className="flex gap-2">
        <input
          id="zip-input"
          name="zip"
          inputMode="numeric"
          autoComplete="postal-code"
          pattern="[0-9]{5}"
          maxLength={5}
          required
          placeholder="e.g. 30303"
          className="w-full min-w-0 rounded-md border-2 border-ink bg-card px-4 py-3 font-mono text-lg tracking-widest outline-none focus:ring-4 focus:ring-highlight"
        />
        <button
          type="submit"
          className="shrink-0 rounded-md bg-ink px-5 py-3 font-display text-lg uppercase tracking-wide text-paper hover:opacity-90"
        >
          Show me
        </button>
      </div>
      {error && <p className="text-sm font-medium text-against">{error}</p>}
    </form>
  );
}
