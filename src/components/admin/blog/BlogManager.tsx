import { Suspense, lazy } from "react";
import { AdminSubTabs } from "@/components/admin/AdminSubTabs";
import { FileText, Sparkles, DollarSign, Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const BlogPostsManager = lazy(() =>
  import("./BlogPostsManager").then((m) => ({ default: m.BlogPostsManager }))
);
const BlogPromptConfig = lazy(() =>
  import("./BlogPromptConfig").then((m) => ({ default: m.BlogPromptConfig }))
);
const BlogCostTracking = lazy(() =>
  import("./BlogCostTracking").then((m) => ({ default: m.BlogCostTracking }))
);
const BlogAutomationSettings = lazy(() =>
  import("./BlogAutomationSettings").then((m) => ({ default: m.BlogAutomationSettings }))
);

const Loading = () => <Skeleton className="h-64 w-full" />;

export function BlogManager() {
  return (
    <AdminSubTabs
      tabs={[
        { id: "posts", label: "Posts", icon: <FileText className="h-4 w-4" />, color: "emerald" },
        { id: "prompts", label: "Prompts IA", icon: <Sparkles className="h-4 w-4" />, color: "purple" },
        { id: "costs", label: "Custos", icon: <DollarSign className="h-4 w-4" />, color: "yellow" },
        { id: "automation", label: "Automação", icon: <Settings className="h-4 w-4" />, color: "blue" },
      ]}
      defaultTab="posts"
    >
      {(activeTab) => (
        <Suspense fallback={<Loading />}>
          {activeTab === "posts" && <BlogPostsManager />}
          {activeTab === "prompts" && <BlogPromptConfig />}
          {activeTab === "costs" && <BlogCostTracking />}
          {activeTab === "automation" && <BlogAutomationSettings />}
        </Suspense>
      )}
    </AdminSubTabs>
  );
}

export default BlogManager;
