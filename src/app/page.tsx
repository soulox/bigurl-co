import { URLShortener } from "@/components/URLShortener";

export default function Home() {
  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20">
      <main className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-semibold mb-6">BigURL</h1>
        <URLShortener />
      </main>
    </div>
  );
}
