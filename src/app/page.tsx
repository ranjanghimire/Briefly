export default function Page() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="text-[20px] font-medium text-black">Briefly</div>
      <div className="mt-2 text-[14px] text-[color:theme(colors.briefly.meta)]">
        Calm, summarized news.
      </div>
      <a
        href="/feed"
        className="mt-6 rounded-full bg-[color:theme(colors.briefly.accent)] px-5 py-2.5 text-[14px] text-white"
      >
        Open feed
      </a>
    </div>
  );
}

