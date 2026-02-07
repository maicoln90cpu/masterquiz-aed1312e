import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import visualCreatorImg from "@/assets/visual-editor-real.jpeg";
import crmDashboardImg from "@/assets/crm-real.jpeg";
import analyticsDashboardImg from "@/assets/analytics-real.jpeg";
import integrationsImg from "@/assets/integrations-real.jpeg";
import multilingualImg from "@/assets/multilingual-real.jpeg";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  highlights: string[];
  badge?: string;
  imagePosition: 'left' | 'right';
}

interface FeatureShowcaseProps {
  features: Feature[];
}

export const FeatureShowcase = ({ features }: FeatureShowcaseProps) => {
  const featureImages = [
    visualCreatorImg,
    crmDashboardImg,
    analyticsDashboardImg,
    integrationsImg,
    multilingualImg,
  ];

  return (
    <div className="space-y-24 md:space-y-32">
      {features.map((feature, index) => (
        <div
          key={index}
          className={`grid lg:grid-cols-2 gap-responsive items-center landing-animate ${
            feature.imagePosition === 'left' ? 'lg:grid-flow-col-dense' : ''
          }`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Content */}
          <div className={`content-spacing-lg ${feature.imagePosition === 'left' ? 'lg:col-start-2' : ''}`}>
            <div className="inline-flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10 hover-scale transition-smooth">
                <feature.icon className="h-8 w-8 text-primary" />
              </div>
              {feature.badge && (
                <Badge variant="secondary">{feature.badge}</Badge>
              )}
            </div>
            
            <h3 className="text-heading-lg md:text-heading-xl font-bold text-balance">{feature.title}</h3>
            
            <p className="text-body-lg text-muted-foreground">{feature.description}</p>
            
            <ul className="space-y-4">
              {feature.highlights.map((highlight, i) => (
                <li 
                  key={i} 
                  className="flex items-start gap-3 group"
                >
                  <span className="text-primary text-lg group-hover:scale-125 transition-smooth">✓</span>
                  <span className="text-foreground">{highlight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Visual Mock */}
          <div className={`relative group ${feature.imagePosition === 'left' ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
            <div className="aspect-video rounded-2xl overflow-hidden border border-border/50 shadow-xl group-hover:shadow-2xl transition-all duration-300 bg-muted">
              {featureImages[index] && (
                <img 
                  src={featureImages[index]} 
                  alt={feature.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}
            </div>
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-3xl blur-3xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        </div>
      ))}
    </div>
  );
};
