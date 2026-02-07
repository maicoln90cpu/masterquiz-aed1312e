import { Skeleton } from "./skeleton";
import { Card, CardContent, CardHeader } from "./card";

export function ResponsesSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Counter Card */}
      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardHeader>
      </Card>

      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <Skeleton className="h-10 flex-1 md:w-64" />
        <Skeleton className="h-10 w-full md:w-48" />
        <Skeleton className="h-10 w-full md:w-[240px]" />
        <Skeleton className="h-10 w-full md:w-[240px]" />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
