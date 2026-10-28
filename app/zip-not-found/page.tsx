import { ZipForm } from "@/components/ZipForm";

export const metadata = { title: "ZIP not found" };

export default function ZipNotFound() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-10">
      <h1 className="font-display text-4xl uppercase">We couldn&rsquo;t place that ZIP</h1>
      <p className="text-muted">
        Some ZIP codes (PO boxes, single buildings) aren&rsquo;t on Census maps. Try the ZIP where you live,
        or pick your state from the home page.
      </p>
      <ZipForm error="Try another 5-digit ZIP code." />
    </div>
  );
}
