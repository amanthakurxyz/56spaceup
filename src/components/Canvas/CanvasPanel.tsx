export default function CanvasPanel() {
  return (
    <div className="relative w-full h-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Floating Toolbar Placeholder */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-800 px-6 py-3 rounded-2xl shadow-xl flex items-center space-x-6 border border-zinc-200 dark:border-zinc-700">
        <button className="text-zinc-600 dark:text-zinc-300 hover:text-blue-500 transition-colors tooltip" data-tip="Select">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
        </button>
        <button className="text-zinc-600 dark:text-zinc-300 hover:text-blue-500 transition-colors tooltip" data-tip="Pan">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" /></svg>
        </button>
        <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-600"></div>
        <button className="text-zinc-600 dark:text-zinc-300 hover:text-blue-500 transition-colors tooltip" data-tip="Mask/In-paint">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
        </button>
        <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-600"></div>
        <button className="text-zinc-600 dark:text-zinc-300 hover:text-blue-500 transition-colors tooltip" data-tip="Undo">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
        </button>
      </div>
    </div>
  );
}
