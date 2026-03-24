// ✅ FASE 2 - ITEM 6: Adicionar imports para filtros de data
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Loader2, Filter, X, FileSpreadsheet, Search, Plus, Calendar as CalendarIcon, List, LayoutGrid, ArrowUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";
import { PlanLimitWarning } from "@/components/PlanLimitWarning";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { MobileNav } from "@/components/MobileNav";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ResponsesSkeleton } from "@/components/ui/responses-skeleton";
import { logExportAction } from "@/lib/auditLogger";
import { ResponseAnswersList } from "@/components/responses/ResponseAnswersList";
import { ResponsesSpreadsheet } from "@/components/responses/ResponsesSpreadsheet";
import { ResponseHeatmap } from "@/components/analytics/ResponseHeatmap";
// ✅ ITEM 5: Remover import estático de XLSX - será lazy loaded
// import * as XLSX from "xlsx";

const Responses = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [responses, setResponses] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResponse, setSelectedResponse] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("heatmap");
  const ITEMS_PER_PAGE = 50; // ✅ Paginação: 50 itens por página
  const { subscription, responseLimit } = useSubscriptionLimits();
  const { user } = useCurrentUser();
  
  // ✅ FASE 2 - ITEM 6: Estados para filtros de data
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const quizzesLoadedRef = useRef(false);

  // ✅ Separar: carregar quizzes apenas 1x
  useEffect(() => {
    if (quizzesLoadedRef.current) return;
    const loadQuizzes = async () => {
      if (!user) return;
      const { data: quizzesData } = await supabase
        .from('quizzes')
        .select('id, title')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      setQuizzes(quizzesData || []);
      quizzesLoadedRef.current = true;
    };
    loadQuizzes();
  }, []);

  // ✅ Carregar responses separadamente (reage a filtros)
  useEffect(() => {
    loadResponses();
  }, [selectedQuiz, currentPage, startDate, endDate]);

  const loadResponses = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('quiz_responses')
        .select(`
          id, quiz_id, completed_at, respondent_name, respondent_email, respondent_whatsapp, answers, custom_field_data, result_id, 
          quizzes!inner(id, title, user_id, quiz_questions(id, question_text, order_number, blocks)), 
          quiz_results(result_text)
        `, { count: 'exact' })
        .eq('quizzes.user_id', user.id)
        .order('completed_at', { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      if (selectedQuiz !== "all") {
        query = query.eq('quiz_id', selectedQuiz);
      }
      if (startDate) {
        query = query.gte('completed_at', startDate.toISOString());
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('completed_at', endOfDay.toISOString());
      }

      const { data: responsesData, error, count } = await query;
      if (error) throw error;
      setResponses(responsesData || []);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error loading responses:', error);
      toast.error(t('responses.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  // ✅ CORREÇÃO: useMemo para evitar recalcular filteredResponses em cada render
  const filteredResponses = useMemo(() => {
    if (!searchTerm) return responses;
    const searchLower = searchTerm.toLowerCase();
    return responses.filter(response => 
      response.respondent_name?.toLowerCase().includes(searchLower) ||
      response.respondent_email?.toLowerCase().includes(searchLower) ||
      response.respondent_whatsapp?.includes(searchTerm)
    );
  }, [responses, searchTerm]);

  // ✅ ITEM 5: Lazy load XLSX export
  const exportToExcel = async () => {
    if (responses.length === 0) {
      toast.error(t('responses.noDataToExport'));
      return;
    }

    try {
      // ✅ Importar XLSX dinamicamente apenas quando necessário
      const XLSX = await import('xlsx');

      const exportData = filteredResponses.map(response => {
        const baseData: any = {
          [t('responses.quiz')]: response.quizzes?.title || t('responses.na'),
          [t('responses.name')]: response.respondent_name || t('responses.na'),
          [t('responses.email')]: response.respondent_email || t('responses.na'),
          [t('responses.whatsapp')]: response.respondent_whatsapp || t('responses.na'),
          [t('responses.result')]: response.quiz_results?.result_text || t('responses.na'),
          [t('responses.date')]: new Date(response.completed_at).toLocaleDateString('pt-BR'),
          [t('common.time')]: new Date(response.completed_at).toLocaleTimeString('pt-BR'),
        };

        // Adicionar custom fields
        if (response.custom_field_data && Object.keys(response.custom_field_data).length > 0) {
          Object.entries(response.custom_field_data).forEach(([key, value]) => {
            baseData[key] = String(value);
          });
        }

        return baseData;
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, t('responses.responsesTitle'));
      XLSX.writeFile(wb, `respostas-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      // GTM: LeadExported
      const w = window as Window & { dataLayer?: Record<string, unknown>[] };
      w.dataLayer = w.dataLayer || [];
      w.dataLayer.push({ event: 'LeadExported', source: 'responses_excel', count: filteredResponses.length });
      
      // Audit log para export
      await logExportAction('export:excel_generated', selectedQuiz !== 'all' ? selectedQuiz : undefined, {
        total_records: filteredResponses.length,
        quiz_filter: selectedQuiz,
        date_range: { start: startDate?.toISOString(), end: endDate?.toISOString() }
      });
      
      toast.success(t('responses.exportSuccess'));
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error(t('responses.exportError'));
    }
  };

  // Export to Google Sheets (CSV format)
  const exportToGoogleSheets = async () => {
    if (responses.length === 0) {
      toast.error(t('responses.noDataToExport'));
      return;
    }

    try {
      const XLSX = await import('xlsx');

      const exportData = filteredResponses.map(response => {
        const baseData: any = {
          [t('responses.quiz')]: response.quizzes?.title || t('responses.na'),
          [t('responses.name')]: response.respondent_name || t('responses.na'),
          [t('responses.email')]: response.respondent_email || t('responses.na'),
          [t('responses.whatsapp')]: response.respondent_whatsapp || t('responses.na'),
          [t('responses.result')]: response.quiz_results?.result_text || t('responses.na'),
          [t('responses.date')]: new Date(response.completed_at).toLocaleDateString('pt-BR'),
          [t('common.time')]: new Date(response.completed_at).toLocaleTimeString('pt-BR'),
        };

        if (response.custom_field_data && Object.keys(response.custom_field_data).length > 0) {
          Object.entries(response.custom_field_data).forEach(([key, value]) => {
            baseData[key] = String(value);
          });
        }

        return baseData;
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const csv = XLSX.utils.sheet_to_csv(ws);
      
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `respostas-google-sheets-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      // GTM: LeadExported (CSV)
      const w2 = window as Window & { dataLayer?: Record<string, unknown>[] };
      w2.dataLayer = w2.dataLayer || [];
      w2.dataLayer.push({ event: 'LeadExported', source: 'responses_csv', count: exportData.length });
      
      toast.success(t('responses.csvDownloaded'), { duration: 8000 });
    } catch (error) {
      console.error('Error exporting to Google Sheets:', error);
      toast.error(t('responses.exportGoogleSheetsError'));
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold">{t('responses.title')}</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToExcel} disabled={filteredResponses.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button variant="default" onClick={exportToGoogleSheets} disabled={filteredResponses.length === 0}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Google Sheets
            </Button>
          </div>
        </div>
        {/* Contador de Respostas */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl">{filteredResponses.length}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {searchTerm || selectedQuiz !== "all" 
                ? `${t('responses.found')} (${responses.length} ${t('responses.inTotal')})` 
                : t('responses.total')}
            </p>
          </CardHeader>
        </Card>
        
        {/* ✅ ITEM 6: Aviso de limite do plano */}
        <PlanLimitWarning 
          current={responses.length} 
          limit={responseLimit} 
          type="response" 
        />

        {/* ✅ FASE 2 - ITEM 6: Filtros com Date Range */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('responses.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
              <SelectTrigger 
                className={cn(
                  "w-full md:w-48",
                  activeTab === "spreadsheet" && selectedQuiz === "all" && 
                    "ring-2 ring-primary ring-offset-2 animate-pulse"
                )}
              >
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t('responses.filterByQuiz')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('responses.allQuizzes')}</SelectItem>
                {quizzes.map(quiz => (
                  <SelectItem key={quiz.id} value={quiz.id}>{quiz.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* ✅ FASE 2 - ITEM 6: Date Range Filters */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full md:w-[240px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy") : t('responses.startDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full md:w-[240px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yyyy") : t('responses.endDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {(startDate || endDate) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setStartDate(undefined);
                  setEndDate(undefined);
                }}
                title={t('responses.clearFilters')}
                aria-label={t('responses.clearFilters')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* ✅ Tabs para alternar entre visualizações */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="heatmap" className="flex items-center gap-2">
              {t('responses.heatmap', 'Heatmap')}
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              {t('responses.allResponses', 'Todas Respostas')}
            </TabsTrigger>
            <TabsTrigger value="spreadsheet" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              {t('responses.spreadsheet.title', 'Planilha de Dados')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>{t('responses.recent')} ({filteredResponses.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <ResponsesSkeleton />
                ) : filteredResponses.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                        <Search className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-lg font-medium">{t('responses.noResponses')}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {searchTerm || selectedQuiz !== "all"
                            ? t('responses.adjustFilters')
                            : t('responses.createQuizToStart')}
                        </p>
                      </div>
                      {responses.length === 0 && (
                        <Button onClick={() => navigate("/create-quiz")} className="mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          {t('quiz.createNew')}
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Versão Desktop: Tabela com scroll horizontal */}
                    <div className="hidden md:block overflow-x-auto scrollbar-thin">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('responses.name')}</TableHead>
                            <TableHead>{t('responses.email')}</TableHead>
                            <TableHead>{t('responses.whatsapp')}</TableHead>
                            <TableHead>{t('responses.quiz')}</TableHead>
                            <TableHead>{t('responses.date')}</TableHead>
                            <TableHead className="text-right">{t('common.actions')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredResponses.map((response) => (
                            <TableRow key={response.id}>
                              <TableCell className="font-medium">{response.respondent_name || "-"}</TableCell>
                              <TableCell>{response.respondent_email || "-"}</TableCell>
                              <TableCell>{response.respondent_whatsapp || "-"}</TableCell>
                              <TableCell>{response.quizzes?.title}</TableCell>
                              <TableCell>{new Date(response.completed_at).toLocaleDateString('pt-BR')}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" onClick={() => setSelectedResponse(response)}>
                                  {t('common.viewDetails')}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Versão Mobile: Cards */}
                    <div className="md:hidden space-y-3">
                      {filteredResponses.map((response, index) => (
                        <motion.div
                          key={response.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
                        >
                          <Card className="p-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{response.respondent_name || "-"}</p>
                                  <p className="text-sm text-muted-foreground">{response.respondent_email || "-"}</p>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {new Date(response.completed_at).toLocaleDateString('pt-BR')}
                                </Badge>
                              </div>
                              <div className="text-sm">
                                <p className="text-muted-foreground">WhatsApp: {response.respondent_whatsapp || "-"}</p>
                                <p className="text-muted-foreground">Quiz: {response.quizzes?.title}</p>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full mt-2"
                                onClick={() => setSelectedResponse(response)}
                              >
                                {t('common.viewDetails')}
                              </Button>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>

                    {/* Paginação */}
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-2 mt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          {t('common.previous')}
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {t('responses.page')} {currentPage} {t('responses.of')} {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          {t('common.next')}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="spreadsheet">
            {selectedQuiz !== "all" ? (
              <ResponsesSpreadsheet quizId={selectedQuiz} />
            ) : (
              <Card className="p-8 text-center border-primary/50 bg-primary/5">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-bounce">
                    <ArrowUp className="h-8 w-8 text-primary" />
                  </div>
                  <LayoutGrid className="h-12 w-12 text-primary" />
                  <div>
                    <p className="text-lg font-medium">{t('responses.spreadsheet.selectQuiz', 'Selecione um Quiz')}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {t('responses.spreadsheet.selectQuizDesc', 'Escolha um quiz no filtro acima para ver a planilha de dados com análise de funil')}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="heatmap">
            <ResponseHeatmap quizId={selectedQuiz !== 'all' ? selectedQuiz : undefined} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Detalhes */}
      <Dialog open={!!selectedResponse} onOpenChange={() => setSelectedResponse(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('responses.responseDetails')}</DialogTitle>
            <DialogDescription>
              {t('responses.viewAllInfo')}
            </DialogDescription>
          </DialogHeader>
          {selectedResponse && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('responses.name')}</p>
                  <p className="font-medium">{selectedResponse.respondent_name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('responses.email')}</p>
                  <p className="font-medium">{selectedResponse.respondent_email || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('responses.whatsapp')}</p>
                  <p className="font-medium">{selectedResponse.respondent_whatsapp || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('responses.date')}</p>
                  <p className="font-medium">
                    {new Date(selectedResponse.completed_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">{t('responses.result')}</p>
                <Card>
                  <CardContent className="pt-4">
                    <p>{selectedResponse.quiz_results?.result_text || "N/A"}</p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">{t('responses.answers')}</p>
                <Card>
                  <CardContent className="pt-4">
                    <ResponseAnswersList 
                      answers={selectedResponse.answers} 
                      questions={selectedResponse.quizzes?.quiz_questions}
                    />
                  </CardContent>
                </Card>
              </div>

              {selectedResponse.custom_field_data && Object.keys(selectedResponse.custom_field_data).length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t('responses.customFields')}</p>
                  <Card>
                    <CardContent className="pt-4">
                      <pre className="text-sm whitespace-pre-wrap">
                        {JSON.stringify(selectedResponse.custom_field_data, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Responses;
