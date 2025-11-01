import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { MessageSquare, Send, Image as ImageIcon, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api, Profile } from "@/lib/api";

const MassSend = () => {
  const [numbers, setNumbers] = useState("");
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [profileMessages, setProfileMessages] = useState<{ [key: string]: string }>({});
  const [profileImages, setProfileImages] = useState<{ [key: string]: File | null }>({});
  const [profileAudios, setProfileAudios] = useState<{ [key: string]: File | null }>({});
  const [delay, setDelay] = useState([30]);
  const [randomDelay, setRandomDelay] = useState(false);
  const [autoPauseEnabled, setAutoPauseEnabled] = useState(false);
  const [autoPauseAfter, setAutoPauseAfter] = useState([30]);
  const [autoPauseDuration, setAutoPauseDuration] = useState([15]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isSending, setIsSending] = useState(false);
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

  const handleProfileToggle = (profile: string) => {
    setSelectedProfiles((prev) =>
      prev.includes(profile) ? prev.filter((p) => p !== profile) : [...prev, profile]
    );
  };

  const handleProfileMessageChange = (profile: string, message: string) => {
    setProfileMessages((prev) => ({ ...prev, [profile]: message }));
  };

  const handleProfileImageChange = (profile: string, file: File | null) => {
    setProfileImages((prev) => ({ ...prev, [profile]: file }));
  };

  const handleProfileAudioChange = (profile: string, file: File | null) => {
    setProfileAudios((prev) => ({ ...prev, [profile]: file }));
  };

  const handleStartMassSend = async () => {
    if (selectedProfiles.length === 0) {
      toast({
        title: "Ошибка",
        description: "Выберите хотя бы один профиль",
        variant: "destructive",
      });
      return;
    }

    if (!numbers) {
      toast({
        title: "Ошибка",
        description: "Добавьте номера телефонов",
        variant: "destructive",
      });
      return;
    }

    const hasContent = selectedProfiles.every((profile) =>
      profileMessages[profile] || profileImages[profile] || profileAudios[profile]
    );
    if (!hasContent) {
      toast({
        title: "Ошибка",
        description: "Добавьте контент (текст, фото или аудио) для всех выбранных профилей",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const phoneNumbers = numbers
        .split("\n")
        .map((n) => n.trim())
        .filter((n) => n);

      const profilesConfig: Record<string, string> = {};
      selectedProfiles.forEach((profile) => {
        profilesConfig[profile] = profileMessages[profile] || "";
      });

      const delayConfig = {
        random: randomDelay,
        delay: delay[0],
        auto_pause_enabled: autoPauseEnabled,
        auto_pause_after: autoPauseAfter[0],
        auto_pause_duration: autoPauseDuration[0],
      };

      toast({
        title: "Массовая рассылка запущена!",
        description: `Рассылка началась. Это может занять некоторое время...`,
      });

      const result = await api.massSend(phoneNumbers, profilesConfig, delayConfig, profileImages, profileAudios);

      if (result.success) {
        toast({
          title: "Рассылка завершена!",
          description: `Отправлено: ${result.sent} из ${result.total} сообщений`,
        });
        setNumbers("");
        setSelectedProfiles([]);
        setProfileMessages({});
      }
    } catch (error) {
      toast({
        title: "Ошибка рассылки",
        description: "Не удалось выполнить массовую рассылку. Проверьте подключение к серверу.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Массовая рассылка
          </CardTitle>
          <CardDescription>Отправьте сообщения большому количеству получателей</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Список номеров телефонов</Label>
            <Textarea
              placeholder="Введите номера телефонов (по одному на строку)&#10;+79991234567&#10;+79997654321&#10;+79995551234"
              value={numbers}
              onChange={(e) => setNumbers(e.target.value)}
              className="min-h-[120px] bg-secondary border-border font-mono text-sm resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {numbers.split("\n").filter((n) => n.trim()).length} номеров добавлено
            </p>
          </div>

          <div className="space-y-4">
            <Label>Настройка задержки</Label>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {randomDelay ? "Случайная задержка (20-60 сек)" : `Задержка: ${delay[0]} сек`}
              </span>
              <div className="flex items-center gap-2">
                <Label htmlFor="random-delay" className="text-sm cursor-pointer">
                  Случайная задержка
                </Label>
                <Switch
                  id="random-delay"
                  checked={randomDelay}
                  onCheckedChange={setRandomDelay}
                />
              </div>
            </div>
            {!randomDelay && (
              <div className="space-y-2">
                <Slider
                  value={delay}
                  onValueChange={setDelay}
                  min={5}
                  max={120}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5 сек</span>
                  <span>120 сек</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-pause" className="cursor-pointer">Авто-Пауза</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Автоматическая пауза после определённого количества сообщений
                </p>
              </div>
              <Switch
                id="auto-pause"
                checked={autoPauseEnabled}
                onCheckedChange={setAutoPauseEnabled}
              />
            </div>
            
            {autoPauseEnabled && (
              <div className="space-y-4 pl-4 border-l-2 border-primary/30">
                <div className="space-y-2">
                  <Label className="text-sm">
                    Пауза после: {autoPauseAfter[0]} сообщений
                  </Label>
                  <Slider
                    value={autoPauseAfter}
                    onValueChange={setAutoPauseAfter}
                    min={10}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>10 сообщений</span>
                    <span>100 сообщений</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm">
                    Длительность паузы: {autoPauseDuration[0]} минут
                  </Label>
                  <Slider
                    value={autoPauseDuration}
                    onValueChange={setAutoPauseDuration}
                    min={5}
                    max={60}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>5 мин</span>
                    <span>60 мин</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle>Выберите профили и сообщения</CardTitle>
          <CardDescription>Выберите профили и укажите сообщение для каждого</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profiles.map((profile) => (
            <Card key={profile.name} className="border-border bg-secondary/30">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={profile.name}
                    checked={selectedProfiles.includes(profile.name)}
                    onCheckedChange={() => handleProfileToggle(profile.name)}
                  />
                  <Label
                    htmlFor={profile.name}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {profile.name}
                  </Label>
                </div>
                {selectedProfiles.includes(profile.name) && (
                  <div className="space-y-3">
                    <Textarea
                      placeholder={`Сообщение для профиля ${profile.name}...`}
                      value={profileMessages[profile.name] || ""}
                      onChange={(e) => handleProfileMessageChange(profile.name, e.target.value)}
                      className="min-h-[80px] bg-background border-border resize-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`image-${profile.name}`)?.click()}
                      >
                        <ImageIcon className="mr-2 h-4 w-4" />
                        {profileImages[profile.name] ? profileImages[profile.name]?.name : 'Фото'}
                      </Button>
                      <input
                        id={`image-${profile.name}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleProfileImageChange(profile.name, e.target.files?.[0] || null)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`audio-${profile.name}`)?.click()}
                      >
                        <Mic className="mr-2 h-4 w-4" />
                        {profileAudios[profile.name] ? profileAudios[profile.name]?.name : 'Аудио'}
                      </Button>
                      <input
                        id={`audio-${profile.name}`}
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => handleProfileAudioChange(profile.name, e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Button
        className="w-full"
        size="lg"
        onClick={handleStartMassSend}
        disabled={selectedProfiles.length === 0 || isSending}
      >
        <Send className="mr-2 h-4 w-4" />
        {isSending ? "Отправка..." : "Запустить массовую рассылку"}
      </Button>
    </div>
  );
};

export default MassSend;
