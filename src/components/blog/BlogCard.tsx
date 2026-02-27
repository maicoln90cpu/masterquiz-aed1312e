import { Link } from 'react-router-dom';
import { Calendar, Clock, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface BlogCardProps {
  slug: string;
  title: string;
  excerpt: string | null;
  featuredImageUrl: string | null;
  categories: string[];
  readingTimeMin: number;
  publishedAt: string;
  viewsCount: number;
}

export const BlogCard = ({
  slug,
  title,
  excerpt,
  featuredImageUrl,
  categories,
  readingTimeMin,
  publishedAt,
  viewsCount,
}: BlogCardProps) => {
  return (
    <Link
      to={`/blog/${slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm hover:shadow-md transition-all duration-300"
    >
      {/* Image */}
      <div className="aspect-video overflow-hidden bg-muted">
        {featuredImageUrl ? (
          <img
            src={featuredImageUrl}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-primary/10">
            <span className="text-4xl">📝</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 md:p-5">
        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {categories.slice(0, 2).map((cat) => (
              <Badge key={cat} variant="secondary" className="text-xs font-medium">
                {cat}
              </Badge>
            ))}
          </div>
        )}

        {/* Title */}
        <h2 className="text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors mb-2">
          {title}
        </h2>

        {/* Excerpt */}
        {excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
            {excerpt}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto pt-3 border-t">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(publishedAt), "dd MMM yyyy", { locale: ptBR })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {readingTimeMin} min
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <Eye className="h-3.5 w-3.5" />
            {viewsCount}
          </span>
        </div>
      </div>
    </Link>
  );
};
