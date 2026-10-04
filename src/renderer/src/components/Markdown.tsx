import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Raw HTML in the text is not rendered (react-markdown default), so AI or guest text can't inject markup.
// Links open in the system browser (see setWindowOpenHandler in the main process).
export function Markdown({ text }: { text: string }) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer">
              {children}
            </a>
          )
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}
