import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FileText, Clock, Pause, Play, CheckCircle2, XCircle, Trash2 } from "lucide-react";

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'message' | 'pause' | 'error' | 'info';
  profile?: string;
  phone?: string;
  duration?: number;
  pauseEnd?: Date;
  message: string;
}

const Logs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    // Listen for logs from localStorage or global state
    const checkLogs = () => {
      const storedLogs = localStorage.getItem('mass_send_logs');
      if (storedLogs) {
        try {
          const parsed = JSON.parse(storedLogs);
          setLogs(parsed.map((log: any) => ({
            ...log,
            timestamp: new Date(log.timestamp),
            pauseEnd: log.pauseEnd ? new Date(log.pauseEnd) : undefined
          })));
        } catch (error) {
          console.error('Error parsing logs:', error);
        }
      }
    };

    checkLogs();
    const interval = setInterval(checkLogs, 1000);
    return () => clearInterval(interval);
  }, []);

  const clearLogs = () => {
    localStorage.removeItem('mass_send_logs');
    setLogs([]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'pause':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'message':
        return 'border-green-500/20 bg-green-500/5';
      case 'pause':
        return 'border-yellow-500/20 bg-yellow-500/5';
      case 'error':
        return 'border-red-500/20 bg-red-500/5';
      default:
        return 'border-blue-500/20 bg-blue-500/5';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Логи отправки
              </CardTitle>
              <CardDescription>
                Подробная информация о процессе массовой рассылки
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearLogs}
              disabled={logs.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Очистить
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Нет активных логов</p>
              <p className="text-sm mt-2">Запустите массовую рассылку, чтобы увидеть логи</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {logs.map((log) => (
                  <Card key={log.id} className={`border ${getLogColor(log.type)}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getLogIcon(log.type)}</div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {formatTime(log.timestamp)}
                            </span>
                            {log.duration && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {log.duration}с
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{log.message}</p>
                          {log.profile && (
                            <div className="text-xs text-muted-foreground mt-2 space-y-1">
                              <div>Аккаунт: <span className="font-mono">{log.profile}</span></div>
                              {log.phone && (
                                <div>Номер: <span className="font-mono">{log.phone}</span></div>
                              )}
                            </div>
                          )}
                          {log.pauseEnd && (
                            <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                              Продолжение в: {formatTime(log.pauseEnd)}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Logs;