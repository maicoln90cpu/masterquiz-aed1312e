import { useEffect, useState } from 'react';
import { List } from 'lucide-react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  contentHtml: string;
}

export const TableOfContents = ({ contentHtml }: TableOfContentsProps) => {
  const [items, setItems] = useState<TocItem[]>([]);

  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(contentHtml, 'text/html');
    const headings = doc.querySelectorAll('h2, h3');
    const tocItems: TocItem[] = [];

    headings.forEach((heading, idx) => {
      const id = heading.id || `heading-${idx}`;
      tocItems.push({
        id,
        text: heading.textContent || '',
        level: parseInt(heading.tagName[1]),
      });
    });

    setItems(tocItems);
  }, [contentHtml]);

  if (items.length < 2) return null;

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="rounded-lg border bg-card p-4 mb-8" aria-label="Índice do artigo">
      <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-foreground">
        <List className="h-4 w-4" />
        Índice
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.id} style={{ paddingLeft: `${(item.level - 2) * 16}px` }}>
            <button
              type="button"
              onClick={() => scrollTo(item.id)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors text-left"
            >
              {item.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};
