import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Settings, Phone, Calendar, MessageSquare, CheckCircle2, XCircle } from "lucide-react";
import { api, Profile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ProfileInfo {
  name: string;
  phone: string;
  created_at: string;
  last_used: string;
  statistics: {
    messages_sent: number;
    successful: number;
    failed: number;
  };
}

const Profiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<ProfileInfo | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const data = await api.getProfiles();
      setProfiles(data);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить профили. Проверьте подключение к серверу.",
        variant: "destructive",
      });
    }
  };

  const handleProfileSettings = async (profileName: string) => {
    setLoading(true);
    try {
      const info = await api.getProfileInfo(profileName);
      setSelectedProfile(info);
      setDialogOpen(true);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить информацию о профиле",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (dateString === "Unknown" || dateString === "Never") return dateString;
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <Card className="border-border bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Управление профилями
          </CardTitle>
          <CardDescription>Здесь вы можете управлять вашими профилями WhatsApp</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profiles.map((profile) => (
            <Card key={profile.name} className="border-border bg-secondary/50">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{profile.name}</h3>
                    <p className="text-sm text-muted-foreground">{profile.phone}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Отправлено сообщений: {profile.messages_sent}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleProfileSettings(profile.name)}
                  disabled={loading}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Настроить
                </Button>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Информация о профиле
            </DialogTitle>
            <DialogDescription>
              Подробная информация и статистика профиля
            </DialogDescription>
          </DialogHeader>

          {selectedProfile && (
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Имя профиля</p>
                    <p className="text-sm text-muted-foreground">{selectedProfile.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Номер телефона</p>
                    <p className="text-sm text-muted-foreground">{selectedProfile.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Дата создания</p>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedProfile.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Последнее использование</p>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedProfile.last_used)}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Статистика</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-secondary/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{selectedProfile.statistics.messages_sent}</p>
                    <p className="text-xs text-muted-foreground">Всего</p>
                  </div>
                  <div className="text-center p-3 bg-secondary/50 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 mx-auto mb-1 text-green-500" />
                    <p className="text-2xl font-bold text-green-500">{selectedProfile.statistics.successful}</p>
                    <p className="text-xs text-muted-foreground">Успешно</p>
                  </div>
                  <div className="text-center p-3 bg-secondary/50 rounded-lg">
                    <XCircle className="h-4 w-4 mx-auto mb-1 text-red-500" />
                    <p className="text-2xl font-bold text-red-500">{selectedProfile.statistics.failed}</p>
                    <p className="text-xs text-muted-foreground">Ошибок</p>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={() => setDialogOpen(false)}
              >
                Закрыть
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Profiles;
