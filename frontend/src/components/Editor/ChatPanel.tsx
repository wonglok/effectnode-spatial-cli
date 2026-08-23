import { useState } from "react";
import { useChatStore } from "../../store/chatStore";

export function ChatPanel() {
  const threads = useChatStore((state) => state.threads);
  const activeThreadId = useChatStore((state) => state.activeThreadId);
  const createThread = useChatStore((state) => state.createThread);
  const selectThread = useChatStore((state) => state.selectThread);
  const sendMessage = useChatStore((state) => state.sendMessage);

  const [showThreads, setShowThreads] = useState(false);
  const [draft, setDraft] = useState("");

  const activeThread = threads.find((thread) => thread.id === activeThreadId);

  const handleSend = () => {
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraft("");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-ink-100 px-3 py-2">
        <span className="min-w-0 truncate text-xs font-semibold text-ink-500">
          {activeThread?.title ?? "Chat"}
        </span>
        <button
          type="button"
          onClick={() => setShowThreads((v) => !v)}
          className="shrink-0 text-xs font-medium text-tiffany-600 transition hover:text-tiffany-700"
        >
          {showThreads ? "Close" : "Threads"}
        </button>
      </div>

      {showThreads && (
        <div className="border-b border-ink-100 px-2 py-2">
          <button
            type="button"
            onClick={createThread}
            className="mb-1 w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-tiffany-600 transition hover:bg-tiffany-50"
          >
            + New thread
          </button>
          <div className="space-y-0.5">
            {threads.length === 0 && (
              <p className="px-2 py-1 text-xs text-ink-400">No threads yet</p>
            )}
            {threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => {
                  selectThread(thread.id);
                  setShowThreads(false);
                }}
                className={[
                  "w-full truncate rounded-md px-2 py-1.5 text-left text-xs",
                  thread.id === activeThreadId
                    ? "bg-tiffany-50 font-medium text-tiffany-700"
                    : "text-ink-600 hover:bg-ink-50",
                ].join(" ")}
              >
                {thread.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {!activeThread || activeThread.messages.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-ink-400">
            Start a conversation
          </p>
        ) : (
          activeThread.messages.map((message) => (
            <div
              key={message.id}
              className={[
                "max-w-[85%] rounded-lg px-2.5 py-1.5 text-xs leading-relaxed",
                message.role === "user"
                  ? "ml-auto bg-tiffany-600 text-white"
                  : "bg-ink-100 text-ink-700",
              ].join(" ")}
            >
              {message.content}
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-1.5 border-t border-ink-100 p-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder="Message…"
          className="min-w-0 flex-1 rounded-md border border-ink-200 bg-white px-2 py-1.5 text-xs text-ink-800 placeholder:text-ink-400 outline-none transition focus:border-tiffany-400 focus:ring-2 focus:ring-tiffany-300/40"
        />
        <button
          type="button"
          onClick={handleSend}
          className="btn-primary shrink-0 rounded-md px-2.5 py-1.5 text-xs font-semibold"
        >
          Send
        </button>
      </div>
    </div>
  );
}
