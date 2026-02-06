import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  FileText, Image, File, Search, Loader2, ExternalLink, Headphones, Paperclip,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface DocumentItem {
  id: string;
  url: string;
  name: string | null;
  created_at: string | null;
  sac_id: string;
  sac_number?: number;
  sac_title?: string;
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

export default function Documentation() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [filtered, setFiltered] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAllDocuments();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(documents);
    } else {
      const q = search.toLowerCase();
      setFiltered(
        documents.filter(
          (d) =>
            d.name?.toLowerCase().includes(q) ||
            d.sac_title?.toLowerCase().includes(q) ||
            String(d.sac_number).includes(q)
        )
      );
    }
  }, [search, documents]);

  const fetchAllDocuments = async () => {
    setLoading(true);
    const { data: images } = await supabase
      .from('sac_images')
      .select('id, url, name, created_at, sac_id')
      .order('created_at', { ascending: false });

    if (images && images.length > 0) {
      const sacIds = [...new Set(images.map((i) => i.sac_id))];
      const { data: sacs } = await supabase
        .from('sacs')
        .select('id, number, title')
        .in('id', sacIds);

      const sacMap = new Map(sacs?.map((s) => [s.id, s]) || []);
      setDocuments(
        images.map((img) => ({
          ...img,
          sac_number: sacMap.get(img.sac_id)?.number,
          sac_title: sacMap.get(img.sac_id)?.title,
        }))
      );
    } else {
      setDocuments([]);
    }
    setLoading(false);
  };

  const stats = {
    total: documents.length,
    images: documents.filter((d) => isImageFile(d.name)).length,
    docs: documents.filter((d) => !isImageFile(d.name)).length,
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Paperclip className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Arquivos</h1>
          <p className="text-muted-foreground text-sm">
            Todos os documentos e imagens anexados aos SACs
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total de Arquivos', value: stats.total, icon: File },
          { label: 'Imagens', value: stats.images, icon: Image },
          { label: 'Documentos', value: stats.docs, icon: FileText },
        ].map((stat) => (
          <Card key={stat.label} className="shadow-card border-0">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome do arquivo ou SAC..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Documents list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="shadow-card border-0">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mb-3 opacity-50" />
            <p className="font-medium">Nenhum arquivo encontrado</p>
            <p className="text-sm">
              {search ? 'Tente alterar os termos da busca' : 'Os arquivos anexados aos SACs aparecerão aqui'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-card border-0">
          <CardContent className="p-0">
            <div className="divide-y">
              {filtered.map((doc) => {
                const Icon = getFileIcon(doc.name);
                const ext = getFileExtension(doc.name);
                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors group"
                  >
                    {isImageFile(doc.name) ? (
                      <img
                        src={doc.url}
                        alt={doc.name || 'Imagem'}
                        className="h-12 w-12 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name || 'Sem nome'}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        {ext && (
                          <Badge variant="outline" className="text-[9px] py-0">
                            {ext}
                          </Badge>
                        )}
                        {doc.sac_number && (
                          <button
                            onClick={() => navigate(`/sacs/${doc.sac_id}`)}
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            <Headphones className="h-3 w-3" />
                            SAC #{doc.sac_number}
                          </button>
                        )}
                        {doc.created_at && (
                          <span>
                            {format(new Date(doc.created_at), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      asChild
                    >
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
