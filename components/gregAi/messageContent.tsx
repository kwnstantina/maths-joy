import { Link } from "@remix-run/react";

// Markdown links Greg emits for exercise recommendations. Only same-site
// paths ("/exercises/…") become links — anything else (http:, javascript:,
// protocol-relative "//") stays plain text, so model output can never send
// a student off-site.
const LINK_PATTERN = /(\[[^\]]+\]\(\/(?!\/)[^)\s]*\))/g;

function renderInline(text: string, key: number): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={j}>{part.slice(2, -2)}</strong>;
    }
    return <span key={j}>{part}</span>;
  });
  return <span key={key}>{parts}</span>;
}

export function renderMessageContent(text: string): React.ReactNode {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const boldRendered = line.split(LINK_PATTERN).map((part, j) => {
      const link = part.match(/^\[([^\]]+)\]\((\/[^)\s]*)\)$/);
      if (link) {
        return (
          <Link key={j} to={link[2]} className="font-medium text-blue-600 underline hover:text-blue-800">
            {link[1]}
          </Link>
        );
      }
      return renderInline(part, j);
    });
    return (
      <span key={i}>
        {boldRendered}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}
