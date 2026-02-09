import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Building2, FileText, CheckCircle2, ArrowRight, ArrowLeft, Search } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface LandingPageConfig {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  welcome_message: string | null;
  success_message: string | null;
  responsible_id: string | null;
}

interface ExistingClient {
  id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
}

export default function LandingPageForm() {
  const { slug } = useParams();
  const [config, setConfig] = useState<LandingPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [protocol, setProtocol] = useState<number | null>(null);

  // Client match dialog
  const [matchDialog, setMatchDialog] = useState(false);
  const [matchedClient, setMatchedClient] = useState<ExistingClient | null>(null);
  const [useExistingClient, setUseExistingClient] = useState(false);
  const [existingClientId, setExistingClientId] = useState<string | null>(null);

  // Step 1: Company fields
  const [companyName, setCompanyName] = useState('');
  const [companyCnpj, setCompanyCnpj] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyCity, setCompanyCity] = useState('');
  const [companyState, setCompanyState] = useState('');
  const [contactName, setContactName] = useState('');

  // Step 2: SAC fields
  const [sacTitle, setSacTitle] = useState('');
  const [sacDescription, setSacDescription] = useState('');
  const [sacPriority, setSacPriority] = useState('media');
  const [sacNfNumber, setSacNfNumber] = useState('');

  useEffect(() => {
    fetchConfig();
  }, [slug]);

  const fetchConfig = async () => {
    const { data } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();
    if (data) setConfig(data);
    else setNotFound(true);
    setLoading(false);
  };

  const searchClient = async (field: 'name' | 'document', value: string) => {
    if (!value || value.length < 3) return;
    const { data } = await supabase
      .from('clients')
      .select('id, name, document, email, phone, city, state')
      .ilike(field, `%${value}%`)
      .limit(1);
    if (data && data.length > 0) {
      setMatchedClient(data[0]);
      setMatchDialog(true);
    }
  };

  const handleConfirmMatch = () => {
    if (matchedClient) {
      setUseExistingClient(true);
      setExistingClientId(matchedClient.id);
      setCompanyName(matchedClient.name);
      setCompanyCnpj(matchedClient.document || '');
      setCompanyEmail(matchedClient.email || '');
      setCompanyPhone(matchedClient.phone || '');
      setCompanyCity(matchedClient.city || '');
      setCompanyState(matchedClient.state || '');
    }
    setMatchDialog(false);
  };

  const handleDismissMatch = () => {
    setMatchDialog(false);
    setMatchedClient(null);
  };

  const goToStep2 = () => {
    if (!companyName.trim()) {
      toast.error('Nome da empresa é obrigatório');
      return;
    }
    if (!companyEmail.trim()) {
      toast.error('Email é obrigatório');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!sacTitle.trim() || !sacDescription.trim()) {
      toast.error('Título e descrição do SAC são obrigatórios');
      return;
    }
    if (!config) return;
    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-public-sac', {
        body: {
          landing_page_slug: slug,
          company: {
            existing_client_id: existingClientId,
            name: companyName,
            cnpj: companyCnpj,
            email: companyEmail,
            phone: companyPhone,
            city: companyCity,
            state: companyState,
            contact_name: contactName,
          },
          sac: {
            title: sacTitle,
            description: sacDescription,
            priority: sacPriority,
            nf_number: sacNfNumber,
          },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setProtocol(data.protocol);
      setStep(3);
      toast.success('SAC criado com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao enviar: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Página não encontrada</h1>
          <p className="text-muted-foreground">Esta landing page não existe ou está desativada.</p>
        </div>
      </div>
    );
  }

  const primaryColor = config?.primary_color || '#3b82f6';
  const secondaryColor = config?.secondary_color || '#1e40af';

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}10)` }}>
      {/* Header */}
      <div className="py-8 px-4 text-center" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
        {config?.logo_url && (
          <img src={config.logo_url} alt="Logo" className="h-16 mx-auto mb-4 rounded-lg" />
        )}
        <h1 className="text-3xl font-bold text-white">{config?.title}</h1>
        {config?.description && <p className="text-white/80 mt-2 max-w-xl mx-auto">{config.description}</p>}
        {config?.welcome_message && <p className="text-white/70 mt-3 text-sm max-w-lg mx-auto">{config.welcome_message}</p>}
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center py-6">
        <div className="flex items-center gap-2">
          {[
            { num: 1, label: 'Empresa' },
            { num: 2, label: 'SAC' },
            { num: 3, label: 'Confirmação' },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step >= s.num ? 'text-white' : 'bg-muted text-muted-foreground'
                }`}
                style={step >= s.num ? { backgroundColor: primaryColor } : undefined}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span className={`text-sm font-medium ${step >= s.num ? 'text-foreground' : 'text-muted-foreground'}`}>
                {s.label}
              </span>
              {i < 2 && <div className={`w-12 h-0.5 ${step > s.num ? 'bg-primary' : 'bg-muted'}`} style={step > s.num ? { backgroundColor: primaryColor } : undefined} />}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-2xl mx-auto px-4 pb-12">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" style={{ color: primaryColor }} />
                    Dados da Empresa
                  </CardTitle>
                  <CardDescription>Informe os dados da sua empresa</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Nome da Empresa *</Label>
                      <div className="relative">
                        <Input
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          onBlur={() => searchClient('name', companyName)}
                          placeholder="Razão social ou nome fantasia"
                          disabled={useExistingClient}
                        />
                        {useExistingClient && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1 h-7 text-xs"
                            onClick={() => { setUseExistingClient(false); setExistingClientId(null); }}
                          >
                            Alterar
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>CNPJ</Label>
                      <Input
                        value={companyCnpj}
                        onChange={(e) => setCompanyCnpj(e.target.value)}
                        onBlur={() => searchClient('document', companyCnpj)}
                        placeholder="00.000.000/0000-00"
                        disabled={useExistingClient}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nome do Contato</Label>
                      <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Seu nome" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        placeholder="email@empresa.com"
                        disabled={useExistingClient}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value)}
                        placeholder="(00) 00000-0000"
                        disabled={useExistingClient}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cidade</Label>
                      <Input
                        value={companyCity}
                        onChange={(e) => setCompanyCity(e.target.value)}
                        placeholder="Cidade"
                        disabled={useExistingClient}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <Input
                        value={companyState}
                        onChange={(e) => setCompanyState(e.target.value)}
                        placeholder="UF"
                        maxLength={2}
                        disabled={useExistingClient}
                      />
                    </div>
                  </div>
                  {useExistingClient && (
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Empresa identificada no sistema
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button onClick={goToStep2} style={{ backgroundColor: primaryColor }}>
                      Próximo <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" style={{ color: primaryColor }} />
                    Dados do SAC
                  </CardTitle>
                  <CardDescription>Descreva o problema ou solicitação</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Título do chamado *</Label>
                    <Input value={sacTitle} onChange={(e) => setSacTitle(e.target.value)} placeholder="Resumo breve do problema" />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição detalhada *</Label>
                    <Textarea value={sacDescription} onChange={(e) => setSacDescription(e.target.value)} placeholder="Descreva o problema ou solicitação com o máximo de detalhes possível..." rows={5} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Prioridade</Label>
                      <Select value={sacPriority} onValueChange={setSacPriority}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baixa">Baixa</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="urgente">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Número da NF (opcional)</Label>
                      <Input value={sacNfNumber} onChange={(e) => setSacNfNumber(e.target.value)} placeholder="Ex: 12345" />
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      <ArrowLeft className="mr-2 h-4 w-4" />Voltar
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting} style={{ backgroundColor: primaryColor }}>
                      {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : 'Enviar SAC'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="shadow-lg border-0 text-center">
                <CardContent className="py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: `${primaryColor}20` }}>
                    <CheckCircle2 className="h-8 w-8" style={{ color: primaryColor }} />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {config?.success_message || 'SAC criado com sucesso!'}
                  </h2>
                  {protocol && (
                    <div className="inline-block px-6 py-3 rounded-xl text-white text-lg font-mono font-bold" style={{ backgroundColor: primaryColor }}>
                      Protocolo: #{protocol}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Guarde seu número de protocolo para acompanhamento. Uma confirmação será enviada para <strong>{companyEmail}</strong>.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep(1);
                      setCompanyName(''); setCompanyCnpj(''); setCompanyEmail(''); setCompanyPhone('');
                      setCompanyCity(''); setCompanyState(''); setContactName('');
                      setSacTitle(''); setSacDescription(''); setSacPriority('media'); setSacNfNumber('');
                      setUseExistingClient(false); setExistingClientId(null); setProtocol(null);
                    }}
                    className="mt-4"
                  >
                    Abrir novo chamado
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Client Match Dialog */}
      <Dialog open={matchDialog} onOpenChange={setMatchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" style={{ color: primaryColor }} />
              Empresa encontrada
            </DialogTitle>
            <DialogDescription>
              Encontramos uma empresa cadastrada com dados semelhantes
            </DialogDescription>
          </DialogHeader>
          {matchedClient && (
            <div className="p-4 rounded-lg bg-muted/50 space-y-1.5">
              <p className="font-semibold">{matchedClient.name}</p>
              {matchedClient.document && <p className="text-sm text-muted-foreground">CNPJ: {matchedClient.document}</p>}
              {matchedClient.email && <p className="text-sm text-muted-foreground">Email: {matchedClient.email}</p>}
              {matchedClient.phone && <p className="text-sm text-muted-foreground">Telefone: {matchedClient.phone}</p>}
              {(matchedClient.city || matchedClient.state) && (
                <p className="text-sm text-muted-foreground">{[matchedClient.city, matchedClient.state].filter(Boolean).join(' - ')}</p>
              )}
            </div>
          )}
          <p className="text-sm">Deseja usar os dados desta empresa?</p>
          <DialogFooter>
            <Button variant="outline" onClick={handleDismissMatch}>Não, cadastrar nova</Button>
            <Button onClick={handleConfirmMatch} style={{ backgroundColor: primaryColor }}>Sim, usar esta empresa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
