import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Flame, BarChart3, TrendingUp, Users, HelpCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { PlanFeatureGate } from '@/components/PlanFeatureGate';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';

interface QuestionHeatmapData {
  questionId: string;
  questionText: string;
  questionOrder: number;
  answerFormat: string;
  options: string[];
  responses: {
    option: string;
    count: number;
    percentage: number;
  }[];
  totalResponses: number;
}

interface ResponseHeatmapProps {
  quizId?: string;
}

// Configuração de paginação
const QUESTIONS_PER_PAGE = 5;

// Cores do heatmap - de frio (azul) para quente (vermelho)
const getHeatColor = (percentage: number): string => {
  if (percentage >= 50) return 'bg-red-500';
  if (percentage >= 40) return 'bg-orange-500';
  if (percentage >= 30) return 'bg-yellow-500';
  if (percentage >= 20) return 'bg-lime-500';
  if (percentage >= 10) return 'bg-green-500';
  return 'bg-blue-500';
};

const getHeatTextColor = (percentage: number): string => {
  if (percentage >= 50) return 'text-red-500';
  if (percentage >= 40) return 'text-orange-500';
  if (percentage >= 30) return 'text-yellow-500';
  if (percentage >= 20) return 'text-lime-500';
  if (percentage >= 10) return 'text-green-500';
  return 'text-blue-500';
};

const getHeatBgColor = (percentage: number): string => {
  if (percentage >= 50) return 'bg-red-500/10 border-red-500/30';
  if (percentage >= 40) return 'bg-orange-500/10 border-orange-500/30';
  if (percentage >= 30) return 'bg-yellow-500/10 border-yellow-500/30';
  if (percentage >= 20) return 'bg-lime-500/10 border-lime-500/30';
  if (percentage >= 10) return 'bg-green-500/10 border-green-500/30';
  return 'bg-blue-500/10 border-blue-500/30';
};

export const ResponseHeatmap = ({ quizId: externalQuizId }: ResponseHeatmapProps) => {
  const { allowHeatmap, isLoading: planLoading } = usePlanFeatures();
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<{ id: string; title: string }[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<string>(externalQuizId || '');
  const [heatmapData, setHeatmapData] = useState<QuestionHeatmapData[]>([]);
  const [totalRespondents, setTotalRespondents] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Calcular paginação
  const totalPages = Math.ceil(heatmapData.length / QUESTIONS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE;
    return heatmapData.slice(startIndex, startIndex + QUESTIONS_PER_PAGE);
  }, [heatmapData, currentPage]);

  // Reset page when quiz changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedQuiz]);

  // Sync with external quizId prop
  useEffect(() => {
    if (externalQuizId) {
      setSelectedQuiz(externalQuizId);
    }
  }, [externalQuizId]);

  // Carregar lista de quizzes do usuário (only when no external quizId)
  useEffect(() => {
    if (externalQuizId) return; // Skip loading quiz list when parent controls the filter
    const loadQuizzes = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('quizzes')
        .select('id, title')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setQuizzes(data || []);
      
      // Se não há quiz selecionado, seleciona o primeiro
      if (!selectedQuiz && data && data.length > 0) {
        setSelectedQuiz(data[0].id);
      }
    };

    loadQuizzes();
  }, [externalQuizId]);

  // Carregar dados do heatmap quando quiz muda
  useEffect(() => {
    if (!selectedQuiz) {
      setLoading(false);
      return;
    }

    const loadHeatmapData = async () => {
      setLoading(true);
      try {
        // Buscar perguntas do quiz
        const { data: questions } = await supabase
          .from('quiz_questions')
          .select('id, question_text, order_number, answer_format, options, blocks')
          .eq('quiz_id', selectedQuiz)
          .order('order_number', { ascending: true });

        if (!questions || questions.length === 0) {
          setHeatmapData([]);
          setTotalRespondents(0);
          setLoading(false);
          return;
        }

        // Filtrar: excluir slides sem bloco tipo 'question' (intros, CTAs)
        const questionsWithQuestion = questions.filter(q => {
          if (!Array.isArray(q.blocks)) return false;
          return (q.blocks as any[]).some((b: any) => b.type === 'question');
        });

        if (questionsWithQuestion.length === 0) {
          setHeatmapData([]);
          setTotalRespondents(0);
          setLoading(false);
          return;
        }

        // Buscar todas as respostas do quiz
        const { data: responses, count } = await supabase
          .from('quiz_responses')
          .select('answers', { count: 'exact' })
          .eq('quiz_id', selectedQuiz);

        setTotalRespondents(count || 0);

        // Extrair texto real da pergunta dos blocos
        const extractQuestionText = (q: any): string => {
          if (Array.isArray(q.blocks)) {
            const qBlock = (q.blocks as any[]).find((b: any) => b.type === 'question');
            if (qBlock?.questionText) {
              // Strip HTML tags
              return qBlock.questionText.replace(/<[^>]*>/g, '').trim() || q.question_text;
            }
          }
          return q.question_text;
        };

        // Extrair answerFormat dos blocos
        const extractAnswerFormat = (q: any): string => {
          if (Array.isArray(q.blocks)) {
            const qBlock = (q.blocks as any[]).find((b: any) => b.type === 'question');
            if (qBlock?.answerFormat) return qBlock.answerFormat;
          }
          return q.answer_format;
        };

        if (!responses || responses.length === 0) {
          const emptyData = questionsWithQuestion.map((q, idx) => ({
            questionId: q.id,
            questionText: extractQuestionText(q),
            questionOrder: idx + 1,
            answerFormat: extractAnswerFormat(q),
            options: parseOptions(q.options, extractAnswerFormat(q), q.blocks),
            responses: [],
            totalResponses: 0,
          }));
          setHeatmapData(emptyData);
          setLoading(false);
          return;
        }

        // Criar mapeamento de IDs atuais para detectar respostas com IDs antigos
        const currentQuestionIds = new Set(questionsWithQuestion.map(q => q.id));

        // Processar respostas para cada pergunta
        const processedData: QuestionHeatmapData[] = questionsWithQuestion.map((question, qIndex) => {
          const realFormat = extractAnswerFormat(question);
          const options = parseOptions(question.options, realFormat, (question as any).blocks);
          const responseCounts: Record<string, number> = {};
          
          // Inicializar contadores
          options.forEach(opt => {
            responseCounts[opt] = 0;
          });

          // Contar respostas
          let totalForQuestion = 0;
          responses.forEach(response => {
            const answers = response.answers as Record<string, string | string[]>;
            if (!answers) return;
            
            // Tentar buscar resposta pelo ID atual da pergunta
            let answer = answers[question.id];
            
            // Fallback por posição: se o ID não bate, verificar se as chaves são IDs antigos
            if (!answer) {
              const answerKeys = Object.keys(answers);
              const hasAnyCurrentId = answerKeys.some(k => currentQuestionIds.has(k));
              
              // Se nenhuma chave corresponde aos IDs atuais, mapear por posição
              if (!hasAnyCurrentId && answerKeys.length > 0) {
                const sortedKeys = answerKeys;
                if (qIndex < sortedKeys.length) {
                  answer = answers[sortedKeys[qIndex]];
                }
              }
            }
            
            if (answer) {
              totalForQuestion++;
              
              if (Array.isArray(answer)) {
                answer.forEach(a => {
                  if (responseCounts[a] !== undefined) {
                    responseCounts[a]++;
                  } else {
                    responseCounts[a] = 1;
                  }
                });
              } else {
                if (responseCounts[answer] !== undefined) {
                  responseCounts[answer]++;
                } else {
                  responseCounts[answer] = 1;
                }
              }
            }
          });

          // Calcular percentuais
          const responseData = Object.entries(responseCounts)
            .map(([option, count]) => ({
              option,
              count,
              percentage: totalForQuestion > 0 ? (count / totalForQuestion) * 100 : 0,
            }))
            .sort((a, b) => b.count - a.count);

          return {
            questionId: question.id,
            questionText: extractQuestionText(question),
            questionOrder: qIndex + 1, // Renumerar sequencialmente
            answerFormat: realFormat,
            options,
            responses: responseData,
            totalResponses: totalForQuestion,
          };
        });

        setHeatmapData(processedData);
      } catch (error) {
        console.error('Erro ao carregar heatmap:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHeatmapData();
  }, [selectedQuiz]);

  // Parse options baseado no formato
  const parseOptions = (options: any, format: string, blocks?: any): string[] => {
    if (format === 'yes_no') {
      return ['Sim', 'Não'];
    }
    
    if (format === 'short_text') {
      return []; // Texto livre não tem opções fixas
    }

    // First try standard options array
    if (Array.isArray(options) && options.length > 0) {
      return options.map(opt => {
        if (typeof opt === 'string') return opt;
        if (opt?.text) return opt.text;
        if (opt?.label) return opt.label;
        return String(opt);
      });
    }

    // Fallback: extract options from blocks (modern quiz format)
    if (Array.isArray(blocks)) {
      const questionBlock = blocks.find((b: any) => b.type === 'question');
      if (questionBlock?.options && Array.isArray(questionBlock.options)) {
        return questionBlock.options.map((opt: any) => {
          if (typeof opt === 'string') return opt;
          if (opt?.text) return opt.text;
          if (opt?.label) return opt.label;
          return String(opt);
        });
      }
    }

    return [];
  };

  // Encontrar a opção mais popular
  const getMostPopular = (responses: QuestionHeatmapData['responses']) => {
    if (responses.length === 0) return null;
    return responses[0];
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map(j => (
                  <Skeleton key={j} className="h-10 w-full" />
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <CardTitle>Heatmap de Respostas</CardTitle>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Visualize quais opções são mais escolhidas em cada pergunta. 
                  Cores mais quentes (vermelho/laranja) indicam opções mais populares.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            {/* Only show internal quiz selector when no external quizId AND no quizId prop */}
            {!externalQuizId && quizzes.length > 0 && (
              <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Selecione um quiz" />
                </SelectTrigger>
                <SelectContent>
                  {quizzes.map(quiz => (
                    <SelectItem key={quiz.id} value={quiz.id}>
                      {quiz.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <CardDescription className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {totalRespondents} respondentes
            </span>
            <span className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              {heatmapData.length} perguntas
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Legenda */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Popularidade:</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-blue-500" />
              <span>Baixa</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-green-500" />
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-yellow-500" />
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-orange-500" />
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-red-500" />
              <span>Alta</span>
            </div>
          </div>

          {heatmapData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma pergunta encontrada para este quiz.</p>
            </div>
          ) : (
            <>
              {/* Pagination Info */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mb-4 pb-4 border-b">
                  <p className="text-sm text-muted-foreground">
                    Mostrando perguntas {((currentPage - 1) * QUESTIONS_PER_PAGE) + 1}-{Math.min(currentPage * QUESTIONS_PER_PAGE, heatmapData.length)} de {heatmapData.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-3 text-sm font-medium">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {paginatedData.map((question, index) => {
                    const mostPopular = getMostPopular(question.responses);
                    
                    return (
                      <div
                        key={question.questionId}
                        className="space-y-3"
                      >
                        {/* Cabeçalho da pergunta */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                Q{question.questionOrder}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {question.answerFormat === 'single_choice' && 'Única escolha'}
                                {question.answerFormat === 'multiple_choice' && 'Múltipla escolha'}
                                {question.answerFormat === 'yes_no' && 'Sim/Não'}
                                {question.answerFormat === 'short_text' && 'Texto livre'}
                              </span>
                            </div>
                            <p className="font-medium mt-1">{question.questionText}</p>
                          </div>
                          
                          {mostPopular && (
                            <div className="text-right text-sm">
                              <p className="text-muted-foreground text-xs">Mais escolhida</p>
                              <p className={`font-semibold ${getHeatTextColor(mostPopular.percentage)}`}>
                                {mostPopular.percentage.toFixed(0)}%
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Respostas */}
                        {question.totalResponses === 0 ? (
                          <p className="text-sm text-muted-foreground italic">
                            Nenhuma resposta ainda
                          </p>
                        ) : question.answerFormat === 'short_text' ? (
                          <p className="text-sm text-muted-foreground italic">
                            Texto livre - {question.totalResponses} respostas
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {question.responses.map((response, respIndex) => (
                              <div
                                key={response.option}
                                className={`relative p-3 rounded-lg border ${getHeatBgColor(response.percentage)}`}
                              >
                                {/* Barra de progresso de fundo */}
                                <div 
                                  className={`absolute inset-0 rounded-lg ${getHeatColor(response.percentage)} opacity-20`}
                                  style={{ width: `${response.percentage}%` }}
                                />
                                
                                <div className="relative flex items-center justify-between gap-4">
                                  <span className="text-sm font-medium truncate flex-1">
                                    {response.option}
                                  </span>
                                  
                                  <div className="flex items-center gap-3 text-sm">
                                    <span className="text-muted-foreground">
                                      {response.count} {response.count === 1 ? 'voto' : 'votos'}
                                    </span>
                                    <span className={`font-bold ${getHeatTextColor(response.percentage)}`}>
                                      {response.percentage.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {index < paginatedData.length - 1 && (
                          <div className="border-b border-dashed pt-4" />
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>

              {/* Pagination Controls Bottom */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próximo
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Insights */}
          {heatmapData.length > 0 && totalRespondents > 0 && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 mt-6">
              <div className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 mt-0.5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-primary">Insights</p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                    {heatmapData.filter(q => q.totalResponses > 0).map(q => {
                      const top = getMostPopular(q.responses);
                      if (!top || top.percentage < 50) return null;
                      return (
                        <li key={q.questionId}>
                          • <strong>Q{q.questionOrder}:</strong> "{top.option}" domina com {top.percentage.toFixed(0)}%
                        </li>
                      );
                    }).filter(Boolean).slice(0, 3)}
                    {heatmapData.filter(q => q.totalResponses > 0 && getMostPopular(q.responses)?.percentage! >= 50).length === 0 && (
                      <li>• Respostas bem distribuídas - nenhuma opção domina claramente</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
