import { logger } from '@/lib/logger';
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Search, Upload, Image as ImageIcon, Video, Music, Cloud, HardDrive, ChevronLeft, ChevronRight } from "lucide-react";
import { MediaLibraryCard } from "@/components/MediaLibraryCard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useVideoStorage } from "@/hooks/useVideoStorage";
import { useBunnyUpload } from "@/hooks/useBunnyUpload";

interface MediaFile {
  name: string;
  id: string;
  created_at: string;
  metadata: Record<string, any>;
  publicUrl: string;
  source?: 'storage' | 'bunny';
  bunnyVideoId?: string;
  sizeMb?: number;
  thumbnailUrl?: string;
}

const ITEMS_PER_PAGE = 24;

export default function MediaLibrary() {
  const { t } = useTranslation();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "images" | "videos" | "audio">("all");
  const [currentPage, setCurrentPage] = useState(1);
  
  const { 
    allowVideoUpload, 
    videoStorageLimitMb, 
    usedMb, 
    videoCount, 
    usagePercentage, 
    refetch: refetchVideoUsage,
    isUnlimited 
  } = useVideoStorage();
  const { deleteFromBunny } = useBunnyUpload();

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error(t('mediaLibrary.loginRequired'));
        return;
      }

      // Load files from Supabase Storage
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from('quiz-media')
        .list(user.id, {
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (storageError) {
        logger.error("Erro ao carregar storage:", storageError);
      }

      const storageFilesWithUrls: MediaFile[] = (storageFiles || []).map(file => {
        const { data } = supabase.storage
          .from('quiz-media')
          .getPublicUrl(`${user.id}/${file.name}`);
        
        return {
          ...file,
          publicUrl: data.publicUrl,
          source: 'storage' as const
        };
      });

      // Load videos from Bunny CDN
      const { data: bunnyVideos, error: bunnyError } = await supabase
        .from('bunny_videos')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      if (bunnyError) {
        logger.error("Erro ao carregar vídeos Bunny:", bunnyError);
      }

      const bunnyFilesFormatted: MediaFile[] = (bunnyVideos || []).map(video => ({
        name: video.original_name || video.file_name,
        id: video.id,
        created_at: video.created_at,
        metadata: {
          mimetype: 'video/mp4',
          size: video.size_mb * 1024 * 1024,
          duration: video.duration_seconds,
          status: video.status
        },
        publicUrl: video.cdn_url || '',
        source: 'bunny' as const,
        bunnyVideoId: video.id,
        sizeMb: video.size_mb,
        thumbnailUrl: video.thumbnail_url || undefined
      }));

      // Combine both sources
      const allFiles = [...storageFilesWithUrls, ...bunnyFilesFormatted].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setFiles(allFiles);
    } catch (error: any) {
      logger.error("Erro ao carregar arquivos:", error);
      toast.error(t('mediaLibrary.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileName: string, source?: 'storage' | 'bunny', bunnyVideoId?: string) => {
    try {
      if (source === 'bunny' && bunnyVideoId) {
        // Delete from Bunny CDN
        const success = await deleteFromBunny(bunnyVideoId);
        if (success) {
          await refetchVideoUsage();
          loadFiles();
        }
      } else {
        // Delete from Supabase Storage
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.storage
          .from('quiz-media')
          .remove([`${user.id}/${fileName}`]);

        if (error) throw error;

        toast.success(t('mediaLibrary.deleteSuccess'));
        loadFiles();
      }
    } catch (error: any) {
      logger.error("Erro ao excluir arquivo:", error);
      toast.error(t('mediaLibrary.deleteError'));
    }
  };

  const getFileType = (mimetype?: string): "image" | "video" | "audio" | "other" => {
    if (!mimetype) return "other";
    if (mimetype.startsWith("image/")) return "image";
    if (mimetype.startsWith("video/")) return "video";
    if (mimetype.startsWith("audio/")) return "audio";
    return "other";
  };

  const filteredFiles = useMemo(() => {
    let result = files.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
      const fileType = getFileType(file.metadata?.mimetype);
      
      if (activeTab === "all") return matchesSearch;
      if (activeTab === "videos") return matchesSearch && (fileType === "video" || file.source === 'bunny');
      return matchesSearch && fileType === activeTab;
    });
    return result;
  }, [files, searchQuery, activeTab]);

  // Pagination
  const paginatedFiles = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredFiles.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredFiles, currentPage]);

  const totalPages = Math.ceil(filteredFiles.length / ITEMS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  const getTabCount = (type: "all" | "images" | "videos" | "audio") => {
    if (type === "all") return files.length;
    if (type === "videos") {
      return files.filter(f => getFileType(f.metadata?.mimetype) === "video" || f.source === 'bunny').length;
    }
    return files.filter(f => getFileType(f.metadata?.mimetype) === type).length;
  };

  const getUsageColor = () => {
    if (usagePercentage >= 90) return "text-destructive";
    if (usagePercentage >= 70) return "text-yellow-500";
    return "text-primary";
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('mediaLibrary.title')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('mediaLibrary.subtitle')}
            </p>
          </div>
          <Button onClick={loadFiles} variant="outline">
            {t('mediaLibrary.refresh')}
          </Button>
        </div>

        {/* Video Storage Usage Card */}
        {allowVideoUpload && (
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="py-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-primary" />
                  <span className="font-medium">{t('mediaLibrary.storage')}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <span>{videoCount} {videoCount !== 1 ? t('mediaLibrary.videosPlural') : t('mediaLibrary.videos')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span className={getUsageColor()}>
                      {usedMb.toFixed(2)} MB
                    </span>
                    {!isUnlimited && (
                      <span className="text-muted-foreground">
                        / {videoStorageLimitMb} MB
                      </span>
                    )}
                    {isUnlimited && (
                      <span className="text-muted-foreground">({t('mediaLibrary.unlimited')})</span>
                    )}
                  </div>
                </div>
              </div>
              {!isUnlimited && (
                <Progress 
                  value={usagePercentage} 
                  className="h-2"
                />
              )}
              {usagePercentage >= 90 && !isUnlimited && (
                <p className="text-xs text-destructive mt-2">
                  ⚠️ {t('mediaLibrary.storageWarning')}
                </p>
              )}
            </CardContent>
          </Card>
        )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('mediaLibrary.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                {t('mediaLibrary.all')} ({getTabCount("all")})
              </TabsTrigger>
              <TabsTrigger value="images" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                {t('mediaLibrary.images')} ({getTabCount("images")})
              </TabsTrigger>
              <TabsTrigger value="videos" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Videos ({getTabCount("videos")})
              </TabsTrigger>
              <TabsTrigger value="audio" className="flex items-center gap-2">
                <Music className="h-4 w-4" />
                {t('mediaLibrary.audio')} ({getTabCount("audio")})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : paginatedFiles.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {searchQuery ? t('mediaLibrary.noFilesFound') : t('mediaLibrary.noFilesYet')}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedFiles.map((file) => (
                      <MediaLibraryCard
                        key={file.id}
                        file={file}
                        onDelete={(fileName) => handleDelete(fileName, file.source, file.bunnyVideoId)}
                      />
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        {t('mediaLibrary.page')} {currentPage} {t('mediaLibrary.of')} {totalPages} ({filteredFiles.length} {t('mediaLibrary.files')})
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          {t('mediaLibrary.previous')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          {t('mediaLibrary.next')}
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  );
}
