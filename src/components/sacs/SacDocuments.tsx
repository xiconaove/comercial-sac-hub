import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Upload, Loader2, Trash2, FileText, Image, File, Download, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface SacDocument {
  id: string;
  url: string;
  name: string | null;
  created_at: string | null;
  uploaded_by: string | null;
  uploader_name?: string | null;
}

interface SacDocumentsProps {
  sacId: string;
}

const getFileIcon = (name: string | null) => {
  if (!name) return File;
  const ext = name.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '')) return Image;
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'].includes(ext || '')) return FileText;
  return File;
};

const getFileExtension = (name: string | null) => {
  if (!name) return '';
  return name.split('.').pop()?.toUpperCase() || '';
};

const isImageFile = (name: string | null) => {
  if (!name) return false;
  const ext = name.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '');
};

export function SacDocuments({ sacId }: SacDocumentsProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<SacDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [sacId]);

  const fetchDocuments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('sac_images')
      .select('id, url, name, created_at, uploaded_by')
      .eq('sac_id', sacId)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      const uploaderIds = [...new Set(data.map(d => d.uploaded_by).filter(Boolean))] as string[];
      const { data: profiles } = uploaderIds.length > 0
        ? await supabase.from('profiles').select('id, full_name').in('id', uploaderIds)
        : { data: [] };
      const pMap = new Map<string, string | null>((profiles || []).map(p => [p.id, p.full_name] as [string, string | null]));
      setDocuments(data.map(d => ({ ...d, uploader_name: d.uploaded_by ? (pMap.get(d.uploaded_by) ?? null) : null })));
    } else {
      setDocuments([]);
    }
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !user) return;

    setUploading(true);
    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${sacId}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('sac-attachments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('sac-attachments')
          .getPublicUrl(filePath);

        await supabase.from('sac_images').insert({
          sac_id: sacId,
          url: urlData.publicUrl,
          name: file.name,
          uploaded_by: user.id,
        });
      }

      toast.success(`${files.length} arquivo(s) enviado(s)!`);
      fetchDocuments();
    } catch (err: any) {
      toast.error('Erro ao enviar arquivo: ' + err.message);
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDelete = async (doc: SacDocument) => {
    try {
      // Extract path from URL to delete from storage
      const urlParts = doc.url.split('/sac-attachments/');
      if (urlParts.length > 1) {
        await supabase.storage.from('sac-attachments').remove([urlParts[1]]);
      }
      await supabase.from('sac_images').delete().eq('id', doc.id);
      toast.success('Arquivo removido!');
      fetchDocuments();
    } catch {
      toast.error('Erro ao remover arquivo');
    }
  };

  if (loading) {
    return (
      <Card className="shadow-card border-0">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card border-0">
      <CardContent className="p-4 space-y-4">
        {/* Upload area */}
        <div className="border-2 border-dashed rounded-lg p-4 hover:border-primary/50 transition-colors">
          <input
            type="file"
            multiple
            onChange={handleUpload}
            className="hidden"
            id={`doc-upload-${sacId}`}
            disabled={uploading}
          />
          <label
            htmlFor={`doc-upload-${sacId}`}
            className="flex flex-col items-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 mb-2 animate-spin" />
            ) : (
              <Upload className="h-8 w-8 mb-2" />
            )}
            <span className="text-sm font-medium">
              {uploading ? 'Enviando...' : 'Clique para anexar arquivos'}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              Imagens, PDFs, documentos e outros
            </span>
          </label>
        </div>

        {/* Files list */}
        {documents.length === 0 ? (
          <p className="text-center text-muted-foreground py-4 text-sm">
            Nenhum documento anexado
          </p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => {
              const Icon = getFileIcon(doc.name);
              const ext = getFileExtension(doc.name);
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors group"
                >
                  {isImageFile(doc.name) ? (
                    <img
                      src={doc.url}
                      alt={doc.name || 'Imagem'}
                      className="h-10 w-10 rounded object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name || 'Sem nome'}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      {ext && <Badge variant="outline" className="text-[9px] py-0">{ext}</Badge>}
                      {doc.uploader_name && <span>{doc.uploader_name}</span>}
                      {doc.created_at && (
                        <span>{format(new Date(doc.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      asChild
                    >
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDelete(doc)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
