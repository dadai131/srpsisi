import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditLog {
  id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
  user_id: string;
}

interface AuditLogsTableProps {
  logs: AuditLog[];
  isLoading: boolean;
}

const getActionBadgeVariant = (action: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (action.includes('login')) return 'default';
  if (action.includes('logout')) return 'secondary';
  if (action.includes('delete')) return 'destructive';
  return 'outline';
};

const getActionLabel = (action: string): string => {
  const labels: Record<string, string> = {
    'admin_login': 'Login',
    'admin_logout': 'Logout',
    'settings_update': 'Atualização de Configurações',
    'content_delete': 'Exclusão de Conteúdo'
  };
  return labels[action] || action;
};

export const AuditLogsTable: React.FC<AuditLogsTableProps> = ({ logs, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Logs de Auditoria</CardTitle>
          <CardDescription className="text-muted-foreground">
            Carregando...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Logs de Auditoria</CardTitle>
        <CardDescription className="text-muted-foreground">
          Histórico de ações administrativas recentes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum log de auditoria encontrado
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Data/Hora</TableHead>
                <TableHead className="text-muted-foreground">Ação</TableHead>
                <TableHead className="text-muted-foreground">Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="border-border hover:bg-secondary/50">
                  <TableCell className="text-foreground">
                    {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(log.action)}>
                      {getActionLabel(log.action)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {log.details && Object.keys(log.details).length > 0 ? (
                      <code className="bg-secondary px-2 py-1 rounded text-xs">
                        {JSON.stringify(log.details)}
                      </code>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
