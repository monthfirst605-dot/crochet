import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-5 text-center">
      <div>
        <p className="font-display text-6xl">Dropped stitch</p>
        <p className="mt-4 text-bark">That page isn&apos;t here.</p>
        <Link href="/shop" className="mt-8 inline-block rounded-full bg-sun px-6 py-3 font-semibold text-cocoa">
          Back to the shop
        </Link>
      </div>
    </main>
  );
}
