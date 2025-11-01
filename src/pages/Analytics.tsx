import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, CheckCircle, XCircle, Clock } from "lucide-react";
import { api, AnalyticsData } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Analytics = () => {
  const [stats, setStats] = useState<AnalyticsData>({
    sent: 0,
    delivered: 0,
    failed: 0,
    success_rate: 0,
    avg_delay: 0,
    recent_messages: [],
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
    // Refresh every 30 seconds
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await api.getAnalytics();
      setStats(data);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить аналитику. Проверьте подключение к серверу.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "только что";
    if (diffMins < 60) return `${diffMins} минут назад`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} часов назад`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Аналитика рассылок
          </CardTitle>
          <CardDescription>Статистика ваших рассылок и эффективность доставки</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-secondary/30 border-primary/20">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.sent}</div>
                <div className="text-xs text-muted-foreground">Отправлено</div>
              </CardContent>
            </Card>

            <Card className="bg-secondary/30 border-green-500/20">
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.delivered}</div>
                <div className="text-xs text-muted-foreground">Доставлено</div>
              </CardContent>
            </Card>

            <Card className="bg-secondary/30 border-red-500/20">
              <CardContent className="p-4 text-center">
                <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.failed}</div>
                <div className="text-xs text-muted-foreground">Ошибки</div>
              </CardContent>
            </Card>

            <Card className="bg-secondary/30 border-primary/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{stats.success_rate}%</div>
                <div className="text-xs text-muted-foreground mt-2">Успешность</div>
              </CardContent>
            </Card>

            <Card className="bg-secondary/30 border-primary/20">
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.avg_delay}с</div>
                <div className="text-xs text-muted-foreground">Средняя задержка</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle>Последние 5 сообщений</CardTitle>
          <CardDescription>История последних отправленных сообщений</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recent_messages.length > 0 ? (
              stats.recent_messages.map((msg, index) => (
                <Card key={index} className="bg-secondary/30 border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {msg.status === "success" ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <div className="font-medium">{msg.phone}</div>
                          <div className="text-sm text-muted-foreground">
                            Профиль: {msg.profile}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">{formatTime(msg.timestamp)}</div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Нет отправленных сообщений
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
