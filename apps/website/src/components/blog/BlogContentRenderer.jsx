import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Rendu du contenu Markdown d'un article.
 * Utilise react-markdown + remark-gfm (tables, listes, liens, etc.)
 * Stylé avec des classes Tailwind inline (pas de dépendance @tailwindcss/typography requise).
 */
const BlogContentRenderer = ({ content = '' }) => {
  if (!content) return null;

  return (
    <div className="blog-content [&>*:first-child]:!mt-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-gray-900 first:mt-0 mt-6 mb-3 leading-tight md:text-3xl">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-gray-900 first:mt-0 mt-7 mb-3 border-b border-gray-100 pb-2 leading-snug md:text-2xl">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-gray-800 first:mt-0 mt-5 mb-2 md:text-xl">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold text-gray-800 first:mt-0 mt-4 mb-2 md:text-lg">{children}</h4>
          ),
          p: ({ children }) => (
            <p className="mb-3 text-base leading-relaxed text-gray-700 last:mb-0">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 list-outside list-disc space-y-1 pl-5 text-gray-700 last:mb-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 list-outside list-decimal space-y-1 pl-5 text-gray-700 last:mb-0">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-base leading-snug">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-600">{children}</em>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-4 rounded-r-lg border-l-4 border-primary-400 bg-primary-50 py-2.5 pl-4 pr-3 italic text-gray-600">
              {children}
            </blockquote>
          ),
          code: ({ inline, children }) =>
            inline ? (
              <code className="bg-gray-100 text-primary-700 text-sm font-mono px-1.5 py-0.5 rounded">
                {children}
              </code>
            ) : (
              <pre className="my-4 overflow-x-auto rounded-xl bg-gray-900 p-4 font-mono text-sm text-green-300">
                <code>{children}</code>
              </pre>
            ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-primary-600 underline underline-offset-2 hover:text-primary-800 transition-colors"
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <figure className="my-5">
              <img
                src={src}
                alt={alt || ''}
                loading="lazy"
                className="w-full rounded-xl shadow-md"
              />
              {alt && (
                <figcaption className="mt-1.5 text-center text-xs text-gray-400">{alt}</figcaption>
              )}
            </figure>
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-200 rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50 text-gray-700 font-semibold">{children}</thead>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-gray-100 hover:bg-gray-50">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left border-r border-gray-200 last:border-r-0">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 border-r border-gray-100 last:border-r-0">{children}</td>
          ),
          hr: () => <hr className="my-5 border-gray-200" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default BlogContentRenderer;
