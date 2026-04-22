import { useEffect, useRef, useState, ElementType } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

/**
 * ✂️ Truncate — Onda 8.2
 *
 * Texto que nunca vaza do container. Mostra tooltip com o texto completo
 * ao passar o mouse APENAS quando ele realmente foi cortado.
 *
 * - `lines={1}` → uma linha + ellipsis horizontal
 * - `lines={2+}` → multi-linha com ellipsis (line-clamp)
 *
 * Exemplo:
 *   <Truncate>{lead.email}</Truncate>
 *   <Truncate lines={2} as="h3">{quiz.title}</Truncate>
 */
interface TruncateProps {
  children: string;
  /** Número de linhas antes de truncar. Default: 1. */
  lines?: number;
  /** Elemento HTML usado (default: span). */
  as?: ElementType;
  /** Desabilita o tooltip mesmo quando truncado. */
  noTooltip?: boolean;
  className?: string;
}

export function Truncate({
  children,
  lines = 1,
  as: Tag = "span",
  noTooltip = false,
  className,
}: TruncateProps) {
  const ref = useRef<HTMLElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => {
      // Para lines=1: scrollWidth > clientWidth
      // Para multi-linha: scrollHeight > clientHeight
      const overflow =
        lines === 1
          ? el.scrollWidth > el.clientWidth
          : el.scrollHeight > el.clientHeight;
      setIsTruncated(overflow);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children, lines]);

  const truncateClass =
    lines === 1
      ? "truncate block max-w-full"
      : cn("overflow-hidden", `line-clamp-${lines}`);

  const content = (
    <Tag
      ref={ref as any}
      className={cn(truncateClass, "min-w-0", className)}
      style={lines > 1 ? { display: "-webkit-box", WebkitLineClamp: lines, WebkitBoxOrient: "vertical" } : undefined}
    >
      {children}
    </Tag>
  );

  if (noTooltip || !isTruncated) return content;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs break-words">
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}