import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Book, 
  FileText, 
  Users, 
  Headphones, 
  Shield, 
  Settings,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

const sections = [
  {
    title: 'Gestão de SACs',
    icon: Headphones,
    description: 'Como criar, gerenciar e acompanhar chamados',
    items: [
      { title: 'Criando um novo SAC', content: 'Acesse SACs > Novo SAC. Preencha título, descrição, cliente, analista responsável e prazo. Você pode anexar imagens se necessário.' },
      { title: 'Alterando status', content: 'No Kanban, arraste o card para a coluna desejada. Na lista, clique no SAC e altere o status pelo seletor.' },
      { title: 'Comentários', content: 'Na página do SAC, use a aba Comentários para adicionar observações. Marque "Interno" para comentários visíveis apenas à equipe.' },
      { title: 'Observadores', content: 'Adicione observadores para que outros membros acompanhem o SAC sem serem responsáveis diretos.' },
    ],
  },
  {
    title: 'Gestão de Clientes',
    icon: Users,
    description: 'Como cadastrar e gerenciar clientes',
    items: [
      { title: 'Cadastro de cliente', content: 'Acesse Clientes > Novo Cliente. Preencha nome, documento (CNPJ/CPF), contato e endereço.' },
      { title: 'Edição', content: 'Clique no ícone de edição na listagem para alterar dados do cliente.' },
      { title: 'Inativação', content: 'Clientes podem ser inativados sem serem excluídos, mantendo o histórico de SACs.' },
    ],
  },
  {
    title: 'Relatórios',
    icon: FileText,
    description: 'Análise e exportação de dados',
    items: [
      { title: 'Dashboard', content: 'Visualize contadores de SACs por status e prioridade em tempo real.' },
      { title: 'Gráficos', content: 'Acesse Relatórios para ver gráficos de distribuição por status, prioridade e desempenho de analistas.' },
      { title: 'Exportação', content: 'Use os filtros para selecionar os dados e exporte em CSV para análises externas.' },
    ],
  },
  {
    title: 'Administração',
    icon: Shield,
    description: 'Configurações e permissões',
    items: [
      { title: 'Usuários', content: 'Gerencie papéis (Admin, Supervisor, Analista, Usuário) e ative/desative usuários.' },
      { title: 'Permissões', content: 'Configure permissões granulares de CRUD por papel e recurso.' },
      { title: 'Campos Personalizados', content: 'Crie campos extras para SACs como Número do Pedido, Categoria, etc.' },
      { title: 'Card do Kanban', content: 'Personalize quais campos aparecem nos cards do Kanban.' },
    ],
  },
];

export default function Documentation() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Book className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Documentação</h1>
          <p className="text-muted-foreground">Guia de uso do sistema SA COMERC - SAC</p>
        </div>
      </div>

      <div className="grid gap-6">
        {sections.map((section) => (
          <Card key={section.title} className="shadow-card border-0">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.items.map((item, index) => (
                <div key={item.title}>
                  <h4 className="font-medium mb-1 flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{index + 1}</Badge>
                    {item.title}
                  </h4>
                  <p className="text-sm text-muted-foreground pl-8">{item.content}</p>
                  {index < section.items.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        <Card className="shadow-card border-0 bg-primary/5">
          <CardContent className="flex items-center gap-4 py-6">
            <HelpCircle className="h-10 w-10 text-primary" />
            <div>
              <h3 className="font-semibold">Precisa de ajuda?</h3>
              <p className="text-sm text-muted-foreground">
                Entre em contato com o suporte técnico ou consulte a documentação completa.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
