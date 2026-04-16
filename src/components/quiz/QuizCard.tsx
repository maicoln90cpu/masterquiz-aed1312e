import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  Edit, 
  Trash2, 
  Copy, 
  MoreHorizontal, 
  BarChart, 
  Code, 
  Link as LinkIcon,
  Calendar,
  FileText,
  FlaskConical,
  Pencil
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { Quiz, Profile, QuizTag } from "@/types/quiz";

interface QuizTagRelationData {
  tag_id: string;
  quiz_tags: QuizTag | null;
}

export interface QuizWithTags extends Quiz {
  quiz_tag_relations?: QuizTagRelationData[];
  tags?: QuizTag[];
}

interface QuizCardProps {
  quiz: QuizWithTags;
  userProfile: Pick<Profile, 'company_slug'> | null;
  onDelete: (id: string) => void;
  onDuplicate: (quiz: Quiz) => void;
  onCopyLink: (slug: string) => void;
  onEmbed: (slug: string) => void;
  onPreview: (id: string) => void;
  onEditSlug?: (quizId: string, currentSlug: string) => void;
  onGenerateTestLead?: (quizId: string) => void;
  isGeneratingTestLead?: boolean;
}

export function QuizCard({
  quiz,
  userProfile,
  onDelete,
  onDuplicate,
  onCopyLink,
  onEmbed,
  onPreview,
  onEditSlug,
  onGenerateTestLead,
  isGeneratingTestLead,
}: QuizCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const statusVariant = quiz.status === 'active' ? 'default' : 'secondary';
  const statusLabel = quiz.status === 'active' 
    ? t('dashboard.public') 
    : t('dashboard.draft');

  const formattedDate = new Date(quiz.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const host = window.location.host;
  const publicUrl = userProfile?.company_slug 
    ? `${host}/${userProfile.company_slug}/${quiz.slug}`
    : `${host}/quiz/${quiz.slug}`;

  const tags = quiz.tags || quiz.quiz_tag_relations?.map(rel => rel.quiz_tags).filter((t): t is QuizTag => t !== null) || [];

  return (
    <Card className="hover:shadow-lg transition-all group overflow-hidden">
      {/* ========== MOBILE LAYOUT (< 640px) - ULTRA COMPACTO ========== */}
      <div className="block sm:hidden p-3 space-y-2">
        {/* Linha 1: Título + Badges */}
        <div className="flex items-start justify-between gap-1.5">
          <h3 className="font-medium text-sm leading-snug line-clamp-1 flex-1 min-w-0">
            {quiz.title}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            {(quiz as any).creation_source === 'express_auto' && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-400 text-amber-600">
                ⚡ Express
              </Badge>
            )}
            <Badge variant={statusVariant} className="text-[10px] px-1.5 py-0">
              {statusLabel}
            </Badge>
          </div>
        </div>

        {/* Linha 2: Descrição - mais compacta */}
        {quiz.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {quiz.description}
          </p>
        )}

        {/* Linha 3: Link truncado */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 rounded px-2 py-1">
          <LinkIcon className="h-3 w-3 shrink-0" />
          <span className="truncate flex-1 font-mono min-w-0 max-w-[180px]">
            {quiz.slug || 'sem-slug'}
          </span>
          {onEditSlug && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 shrink-0 opacity-60 hover:opacity-100"
              onClick={() => onEditSlug(quiz.id, quiz.slug || '')}
            >
              <Pencil className="h-2.5 w-2.5" />
            </Button>
          )}
        </div>

        {/* Linha 4: Botões em linha única - apenas ícones com tooltips */}
        <div className="flex items-center justify-between pt-2 border-t gap-1">
          <TooltipProvider delayDuration={300}>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onPreview(quiz.id)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">{t('dashboard.view')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => navigate(`/create-quiz?id=${quiz.id}`)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">{t('dashboard.edit')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => quiz.slug && onCopyLink(quiz.slug)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">{t('dashboard.copyLink')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => navigate(`/analytics?quiz=${quiz.id}`)}
                  >
                    <BarChart className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">{t('dashboard.analytics')}</TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete(quiz.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">{t('dashboard.delete')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => quiz.slug && onEmbed(quiz.slug)}>
                          <Code className="h-4 w-4 mr-2" />
                          {t('dashboard.embed')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(quiz)}>
                          <FileText className="h-4 w-4 mr-2" />
                          {t('dashboard.duplicate')}
                        </DropdownMenuItem>
                        {quiz.status === 'active' && onGenerateTestLead && (
                          <DropdownMenuItem 
                            onClick={() => onGenerateTestLead(quiz.id)}
                            disabled={isGeneratingTestLead}
                          >
                            <FlaskConical className="h-4 w-4 mr-2" />
                            {t('dashboard.generateTestLead', 'Gerar lead de teste')}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                </TooltipTrigger>
                <TooltipContent side="top">{t('dashboard.more')}</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </div>

      {/* ========== TABLET LAYOUT (640px - 1024px) - 4 LINHAS ========== */}
      <div className="hidden sm:block lg:hidden p-4">
        <div className="space-y-3">
          {/* Linha 1: Título + Badge */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold truncate flex-1 min-w-0">{quiz.title}</h3>
            <Badge variant={statusVariant} className="shrink-0">
              {statusLabel}
            </Badge>
          </div>

          {/* Linha 2: Descrição */}
          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
            {quiz.description || t('dashboard.noDescription')}
          </p>

          {/* Linha 3: Link + Data */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground overflow-hidden">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <LinkIcon className="h-4 w-4 shrink-0" />
              <span className="truncate font-mono text-xs">{publicUrl}</span>
              {onEditSlug && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 opacity-60 hover:opacity-100"
                  onClick={() => onEditSlug(quiz.id, quiz.slug || '')}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">{formattedDate}</span>
            </div>
          </div>

          {/* Linha 4: Todos os botões de ação */}
          <div className="flex items-center gap-2 pt-3 border-t flex-wrap">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onPreview(quiz.id)}
              className="gap-1"
            >
              <Eye className="h-4 w-4" />
              {t('dashboard.view')}
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => navigate(`/create-quiz?id=${quiz.id}`)}
              className="gap-1"
            >
              <Edit className="h-4 w-4" />
              {t('dashboard.edit')}
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => quiz.slug && onCopyLink(quiz.slug)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('dashboard.copyLink')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => quiz.slug && onEmbed(quiz.slug)}
                >
                  <Code className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('dashboard.embed')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => navigate(`/analytics?quiz=${quiz.id}`)}
                >
                  <BarChart className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('dashboard.analytics')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => onDuplicate(quiz)}
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('dashboard.duplicate')}</TooltipContent>
            </Tooltip>
            {quiz.status === 'active' && onGenerateTestLead && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => onGenerateTestLead(quiz.id)}
                    disabled={isGeneratingTestLead}
                  >
                    <FlaskConical className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('dashboard.generateTestLead', 'Gerar lead de teste')}</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive ml-auto"
                  onClick={() => onDelete(quiz.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('dashboard.delete')}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* ========== DESKTOP LAYOUT (>= 1024px) - 4 LINHAS ========== */}
      <div className="hidden lg:block p-5">
        <div className="space-y-3">
          {/* Linha 1: Título + Badge + Tags */}
          <div className="flex items-center gap-3 overflow-hidden">
            <h3 className="font-semibold truncate min-w-0 flex-shrink">{quiz.title}</h3>
            <Badge variant={statusVariant} className="shrink-0">
              {statusLabel}
            </Badge>
            {tags.length > 0 && (
              <div className="flex gap-1.5 shrink-0">
                {tags.slice(0, 3).map(tag => (
                  <Badge 
                    key={tag.id} 
                    variant="outline" 
                    className="text-xs"
                    style={{ color: tag.color, borderColor: tag.color }}
                  >
                    {tag.name}
                  </Badge>
                ))}
                {tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Linha 2: Descrição */}
          <p className="text-sm text-muted-foreground line-clamp-1">
            {quiz.description || t('dashboard.noDescription')}
          </p>

          {/* Linha 3: Link + Data */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground overflow-hidden">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <LinkIcon className="h-4 w-4 shrink-0" />
              <span className="truncate font-mono text-xs">{publicUrl}</span>
              {onEditSlug && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 opacity-60 hover:opacity-100"
                  onClick={() => onEditSlug(quiz.id, quiz.slug || '')}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Calendar className="h-4 w-4" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Linha 4: Todos os botões de ação */}
          <div className="flex items-center gap-2 pt-3 border-t">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onPreview(quiz.id)}
              className="gap-1.5"
            >
              <Eye className="h-4 w-4" />
              {t('dashboard.view')}
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => navigate(`/create-quiz?id=${quiz.id}`)}
              className="gap-1.5"
            >
              <Edit className="h-4 w-4" />
              {t('dashboard.edit')}
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => quiz.slug && onCopyLink(quiz.slug)}
              className="gap-1.5"
            >
              <Copy className="h-4 w-4" />
              {t('dashboard.copyLink')}
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => quiz.slug && onEmbed(quiz.slug)}
              className="gap-1.5"
            >
              <Code className="h-4 w-4" />
              {t('dashboard.embed')}
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => navigate(`/analytics?quiz=${quiz.id}`)}
              className="gap-1.5"
            >
              <BarChart className="h-4 w-4" />
              {t('dashboard.analytics')}
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => onDuplicate(quiz)}
              className="gap-1.5"
            >
              <FileText className="h-4 w-4" />
              {t('dashboard.duplicate')}
            </Button>
            {quiz.status === 'active' && onGenerateTestLead && (
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => onGenerateTestLead(quiz.id)}
                disabled={isGeneratingTestLead}
                className="gap-1.5"
              >
                <FlaskConical className="h-4 w-4" />
                {t('dashboard.generateTestLead', 'Lead de teste')}
              </Button>
            )}
            <Button 
              size="icon" 
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive ml-auto"
              onClick={() => onDelete(quiz.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
