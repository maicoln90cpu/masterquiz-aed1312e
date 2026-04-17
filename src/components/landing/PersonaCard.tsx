import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface PersonaCardProps {
  icon: LucideIcon;
  title: string;
  problem: string;
  solution: string;
  index: number;
}

export const PersonaCard = ({ icon: Icon, title, problem, solution, index }: PersonaCardProps) => {
  return (
    <div
      className="landing-animate"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <Card className="h-full hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group cursor-pointer border-2 hover:border-primary/50">
        <CardHeader>
          <div className="mb-4 p-3 rounded-lg bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-destructive mb-2">❌ {problem}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-primary mb-2">✅ Com MasterQuiz:</p>
            <p className="text-muted-foreground">{solution}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
