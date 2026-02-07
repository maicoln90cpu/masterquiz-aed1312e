import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  ChevronDown,
  FileCode,
  FileText,
  RefreshCw,
  Info
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ChunkInfo {
  name: string;
  size: number;
  gzipSize: number;
  type: 'js' | 'css';
}

interface BundleAnalysis {
  timestamp: string;
  fileCount: number;
  totalSize: number;
  totalGzipSize: number;
  jsSize: number;
  jsGzipSize: number;
  cssSize: number;
  cssGzipSize: number;
  files: ChunkInfo[];
}

interface BundleComparison {
  totalDiffPercent: number;
  gzipDiffPercent: number;
  status: 'improved' | 'stable' | 'warning' | 'critical';
}

// Dados de referência (em produção, viriam de uma API/arquivo)
const REFERENCE_DATA: BundleAnalysis = {
  timestamp: new Date().toISOString(),
  fileCount: 15,
  totalSize: 2500000, // ~2.5MB raw
  totalGzipSize: 650000, // ~650KB gzipped
  jsSize: 2200000,
  jsGzipSize: 580000,
  cssSize: 300000,
  cssGzipSize: 70000,
  files: [
    { name: 'react-vendor.js', size: 150000, gzipSize: 45000, type: 'js' },
    { name: 'ui-vendor.js', size: 280000, gzipSize: 85000, type: 'js' },
    { name: 'chart-vendor.js', size: 350000, gzipSize: 110000, type: 'js' },
    { name: 'animation-vendor.js', size: 120000, gzipSize: 40000, type: 'js' },
    { name: 'i18n-vendor.js', size: 80000, gzipSize: 25000, type: 'js' },
    { name: 'dnd-vendor.js', size: 95000, gzipSize: 30000, type: 'js' },
    { name: 'pdf-vendor.js', size: 450000, gzipSize: 140000, type: 'js' },
    { name: 'index.js', size: 675000, gzipSize: 105000, type: 'js' },
    { name: 'index.css', size: 300000, gzipSize: 70000, type: 'css' },
  ],
};

// Limites de tamanho recomendados (gzipped)
const SIZE_LIMITS = {
  total: 700000, // 700KB total
  js: 600000,    // 600KB JS
  css: 100000,   // 100KB CSS
  chunk: 150000, // 150KB por chunk
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getHealthStatus(current: number, limit: number): 'good' | 'warning' | 'critical' {
  const ratio = current / limit;
  if (ratio < 0.8) return 'good';
  if (ratio < 1.0) return 'warning';
  return 'critical';
}

function getStatusColor(status: 'good' | 'warning' | 'critical'): string {
  switch (status) {
    case 'good': return 'text-green-500';
    case 'warning': return 'text-yellow-500';
    case 'critical': return 'text-red-500';
  }
}

function getStatusBadge(status: 'good' | 'warning' | 'critical') {
  switch (status) {
    case 'good': return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">Saudável</Badge>;
    case 'warning': return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">Atenção</Badge>;
    case 'critical': return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">Crítico</Badge>;
  }
}

export const BundleSizeMonitor = () => {
  const [data, setData] = useState<BundleAnalysis>(REFERENCE_DATA);
  const [isChunksOpen, setIsChunksOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const overallStatus = getHealthStatus(data.totalGzipSize, SIZE_LIMITS.total);
  const jsStatus = getHealthStatus(data.jsGzipSize, SIZE_LIMITS.js);
  const cssStatus = getHealthStatus(data.cssGzipSize, SIZE_LIMITS.css);

  const compressionRatio = ((1 - data.totalGzipSize / data.totalSize) * 100).toFixed(0);

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simula refresh - em produção, chamaria API
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Análise de Bundle Size</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(overallStatus)}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Atualizar dados</TooltipContent>
              </Tooltip>
            </div>
          </div>
          <CardDescription>
            Monitoramento contínuo do tamanho do bundle da aplicação
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Resumo Geral */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total (gzip)</p>
              <p className={`text-xl font-bold ${getStatusColor(overallStatus)}`}>
                {formatBytes(data.totalGzipSize)}
              </p>
              <p className="text-xs text-muted-foreground">
                raw: {formatBytes(data.totalSize)}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">JavaScript</p>
              <p className={`text-xl font-bold ${getStatusColor(jsStatus)}`}>
                {formatBytes(data.jsGzipSize)}
              </p>
              <Progress 
                value={(data.jsGzipSize / SIZE_LIMITS.js) * 100} 
                className="h-1"
              />
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">CSS</p>
              <p className={`text-xl font-bold ${getStatusColor(cssStatus)}`}>
                {formatBytes(data.cssGzipSize)}
              </p>
              <Progress 
                value={(data.cssGzipSize / SIZE_LIMITS.css) * 100} 
                className="h-1"
              />
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Compressão</p>
              <p className="text-xl font-bold text-green-500">
                {compressionRatio}%
              </p>
              <p className="text-xs text-muted-foreground">
                economia com gzip
              </p>
            </div>
          </div>

          {/* Limites e Alertas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Uso do limite recomendado</span>
              <span className={getStatusColor(overallStatus)}>
                {((data.totalGzipSize / SIZE_LIMITS.total) * 100).toFixed(0)}%
              </span>
            </div>
            <Progress 
              value={(data.totalGzipSize / SIZE_LIMITS.total) * 100} 
              className={`h-2 ${overallStatus === 'critical' ? 'bg-red-200' : ''}`}
            />
            <p className="text-xs text-muted-foreground">
              Limite recomendado: {formatBytes(SIZE_LIMITS.total)} (gzip) para boa performance
            </p>
          </div>

          {/* Alertas se houver */}
          {overallStatus !== 'good' && (
            <div className={`p-3 rounded-lg flex items-start gap-2 ${
              overallStatus === 'critical' 
                ? 'bg-red-500/10 border border-red-500/20' 
                : 'bg-yellow-500/10 border border-yellow-500/20'
            }`}>
              <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                overallStatus === 'critical' ? 'text-red-500' : 'text-yellow-500'
              }`} />
              <div>
                <p className={`text-sm font-medium ${
                  overallStatus === 'critical' ? 'text-red-500' : 'text-yellow-500'
                }`}>
                  {overallStatus === 'critical' 
                    ? 'Bundle acima do limite recomendado!' 
                    : 'Bundle próximo do limite recomendado'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Considere revisar imports não utilizados, code-splitting adicional ou lazy loading.
                </p>
              </div>
            </div>
          )}

          {/* Breakdown por Chunk */}
          <Collapsible open={isChunksOpen} onOpenChange={setIsChunksOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <FileCode className="h-4 w-4" />
                  Ver detalhes por chunk ({data.files.length} arquivos)
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isChunksOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-4 space-y-2">
              {data.files
                .sort((a, b) => b.gzipSize - a.gzipSize)
                .map((file, i) => {
                  const chunkStatus = getHealthStatus(file.gzipSize, SIZE_LIMITS.chunk);
                  const percent = ((file.gzipSize / data.totalGzipSize) * 100).toFixed(1);
                  
                  return (
                    <div key={file.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
                      {file.type === 'js' ? (
                        <FileCode className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <FileText className="h-4 w-4 text-blue-500" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono truncate">{file.name}</p>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={parseFloat(percent)} 
                            className="h-1 flex-1"
                          />
                          <span className="text-xs text-muted-foreground">{percent}%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${getStatusColor(chunkStatus)}`}>
                          {formatBytes(file.gzipSize)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          raw: {formatBytes(file.size)}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </CollapsibleContent>
          </Collapsible>

          {/* Dicas de Otimização */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 text-primary" />
              <div>
                <p className="text-sm font-medium text-primary">Dicas de Otimização</p>
                <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                  <li>• Use <code className="bg-muted px-1 rounded">React.lazy()</code> para componentes pesados</li>
                  <li>• Importe apenas o necessário de bibliotecas (tree-shaking)</li>
                  <li>• Considere substituir bibliotecas grandes por alternativas menores</li>
                  <li>• Execute <code className="bg-muted px-1 rounded">npm run analyze</code> para análise detalhada</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Última atualização */}
          <p className="text-xs text-muted-foreground text-center">
            Última análise: {new Date(data.timestamp).toLocaleString('pt-BR')}
          </p>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
