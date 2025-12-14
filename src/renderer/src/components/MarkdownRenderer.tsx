import React from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps): React.JSX.Element {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        components={{
          // Headings
          h1: ({ ...props }) => (
            <h1 className="text-xl font-bold text-dark-100 mt-4 mb-2 first:mt-0" {...props} />
          ),
          h2: ({ ...props }) => (
            <h2 className="text-lg font-bold text-dark-100 mt-3 mb-2 first:mt-0" {...props} />
          ),
          h3: ({ ...props }) => (
            <h3 className="text-base font-semibold text-dark-100 mt-3 mb-2 first:mt-0" {...props} />
          ),
          h4: ({ ...props }) => (
            <h4 className="text-sm font-semibold text-dark-200 mt-2 mb-1 first:mt-0" {...props} />
          ),
          h5: ({ ...props }) => (
            <h5 className="text-sm font-medium text-dark-200 mt-2 mb-1 first:mt-0" {...props} />
          ),
          h6: ({ ...props }) => (
            <h6 className="text-xs font-medium text-dark-300 mt-2 mb-1 first:mt-0" {...props} />
          ),
          // Paragraphs
          p: ({ ...props }) => (
            <p className="text-sm text-dark-100 leading-relaxed mb-2 last:mb-0" {...props} />
          ),
          // Lists
          ul: ({ ...props }) => (
            <ul
              className="list-disc list-inside text-sm text-dark-100 mb-2 space-y-1 ml-4"
              {...props}
            />
          ),
          ol: ({ ...props }) => (
            <ol
              className="list-decimal list-inside text-sm text-dark-100 mb-2 space-y-1 ml-4"
              {...props}
            />
          ),
          li: ({ ...props }) => <li className="text-sm text-dark-100 leading-relaxed" {...props} />,
          // Code blocks
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''
            const codeString = String(children).replace(/\n$/, '')
            const isInline = !match

            return !isInline && match ? (
              <div className="my-3 rounded-lg overflow-hidden">
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={language}
                  PreTag="div"
                  className="!m-0 !rounded-lg text-sm leading-relaxed"
                >
                  {codeString}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code
                className="px-1.5 py-0.5 bg-dark-700/50 text-blue-300 rounded text-xs font-mono"
                {...props}
              >
                {children}
              </code>
            )
          },
          // Blockquotes
          blockquote: ({ ...props }) => (
            <blockquote
              className="border-l-4 border-blue-500/50 pl-3 py-1 my-2 bg-blue-500/5 text-sm text-dark-200 italic"
              {...props}
            />
          ),
          // Links
          a: ({ ...props }) => (
            <a
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          // Horizontal rule
          hr: ({ ...props }) => <hr className="my-3 border-dark-700/50" {...props} />,
          // Strong/Bold
          strong: ({ ...props }) => <strong className="font-semibold text-dark-100" {...props} />,
          // Emphasis/Italic
          em: ({ ...props }) => <em className="italic text-dark-200" {...props} />,
          // Tables
          table: ({ ...props }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full border-collapse border border-dark-700/50" {...props} />
            </div>
          ),
          thead: ({ ...props }) => <thead className="bg-dark-700/30" {...props} />,
          tbody: ({ ...props }) => <tbody {...props} />,
          tr: ({ ...props }) => <tr className="border-b border-dark-700/50" {...props} />,
          th: ({ ...props }) => (
            <th
              className="px-3 py-2 text-left text-xs font-semibold text-dark-200 border border-dark-700/50"
              {...props}
            />
          ),
          td: ({ ...props }) => (
            <td className="px-3 py-2 text-sm text-dark-100 border border-dark-700/50" {...props} />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
