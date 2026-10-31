import { Fragment, type ReactNode } from "react";

// [label](https://…) or **bold**
const TOKEN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)|\*\*([^*]+)\*\*/g;

/** Links, bold text, and single newlines as line breaks. */
function inline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(TOKEN)) {
    const [whole, label, href, bold] = match;
    nodes.push(text.slice(last, match.index));
    if (bold) {
      nodes.push(<strong key={match.index}>{bold}</strong>);
    } else {
      const external = href.startsWith("http");
      nodes.push(
        <a key={match.index} href={href} {...(external && { target: "_blank", rel: "noopener noreferrer" })}>
          {label}
        </a>,
      );
    }
    last = match.index + whole.length;
  }
  nodes.push(text.slice(last));

  return nodes.flatMap((node, i): ReactNode[] =>
    typeof node === "string"
      ? node.split("\n").map((line, j) => (
          <Fragment key={`${i}-${j}`}>
            {j > 0 && <br />}
            {line}
          </Fragment>
        ))
      : [node],
  );
}

/**
 * Plain text with blank lines between paragraphs. A block whose lines all
 * start with "- " becomes a bullet list. Inline: `[label](url)` and `**bold**`.
 */
export function RichText({ text }: { text: string }) {
  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, i) => {
    const lines = block.split("\n").map((line) => line.trim());
    if (lines.every((line) => line.startsWith("- "))) {
      return (
        <ul key={i} className="rich-list">
          {lines.map((line, j) => (
            <li key={j}>{inline(line.slice(2))}</li>
          ))}
        </ul>
      );
    }
    return <p key={i}>{inline(block)}</p>;
  });
}

export function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
