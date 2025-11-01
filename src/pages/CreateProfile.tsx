import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const CreateProfile = () => {
  const [profileName, setProfileName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateProfile = async () => {
    if (!profileName) {
      toast({
        title: "Ошибка",
        description: "Введите имя профиля",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const result = await api.createProfile(profileName);

      if (result.success) {
        toast({
          title: "Профиль создан!",
          description: `Профиль "${profileName}" успешно создан. Отсканируйте QR-код в открывшемся окне Chrome.`,
        });
        setProfileName("");
      } else {
        toast({
          title: "Ошибка",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка подключения",
        description: "Не удалось подключиться к серверу. Убедитесь, что Python бэкенд запущен.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="border-border bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          Создать новый профиль
        </CardTitle>
        <CardDescription>Создайте профиль для авторизации в WhatsApp Web</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="profile-name">Имя профиля</Label>
          <Input
            id="profile-name"
            placeholder="Например: Рабочий, Личный, Маркетинг..."
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            className="bg-secondary border-border"
          />
          <p className="text-xs text-muted-foreground">
            Выберите уникальное имя для идентификации профиля
          </p>
        </div>

        <Card className="bg-secondary/30 border-primary/20">
          <CardContent className="pt-6 space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Что происходит после создания:
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Откроется WhatsApp Web</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Отсканируйте QR-код в приложении</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Профиль будет сохранен для дальнейшего использования</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Button
          className="w-full"
          size="lg"
          onClick={handleCreateProfile}
          disabled={!profileName || isCreating}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          {isCreating ? "Создание профиля..." : "Создать профиль"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CreateProfile;
