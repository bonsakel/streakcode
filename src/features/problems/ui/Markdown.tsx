import ReactMarkdown from 'react-markdown';

/** Renders problem markdown. react-markdown ignores raw HTML, so content cannot inject markup. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-skill space-y-3 text-sm leading-relaxed [&_code]:rounded [&_code]:bg-raised [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.85em] [&_h1]:text-2xl [&_h2]:mt-5 [&_h2]:text-lg [&_h3]:mt-4 [&_h3]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_ol_li]:list-decimal [&_pre]:overflow-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-line [&_pre]:bg-bg [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:font-bold [&_table]:w-full [&_td]:border [&_td]:border-line [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-line [&_th]:px-2 [&_th]:py-1 [&_th]:text-left">
      <ReactMarkdown
        components={{
          // Scrollable code blocks must be reachable by keyboard.
          pre: ({ children: c }) => <pre tabIndex={0}>{c}</pre>,
          // The page title is the h1, so content headings start at h2 (no skipped levels).
          h3: ({ children: c }) => <h2 className="mt-4 text-base font-bold">{c}</h2>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
