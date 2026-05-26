export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
      <h1 className="text-4xl font-bold">
        오늘 뭐 먹지?
      </h1>

      <button className="w-60 h-14 rounded-2xl bg-black text-white text-xl">
        오프라인
      </button>

      <button className="w-60 h-14 rounded-2xl bg-gray-200 text-black text-xl">
        배달
      </button>
    </main>
  );
}