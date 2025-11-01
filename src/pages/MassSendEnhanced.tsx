import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Send, Image as ImageIcon, Mic, StopCircle, Pause, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api, Profile } from "@/lib/api";
import { ProfileGroup } from "./ProfileGroups";
import type { LogEntry } from "./Logs";

const MassSendEnhanced = () => {
  const [numbers, setNumbers] = useState("");
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [profileMessages, setProfileMessages] = useState<{ [key: string]: string }>({});
  const [profileImages, setProfileImages] = useState<{ [key: string]: File | null }>({});
  const [profileAudios, setProfileAudios] = useState<{ [key: string]: File | null }>({});
  const [delay, setDelay] = useState([30]);
  const [randomDelay, setRandomDelay] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [groups, setGroups] = useState<ProfileGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [useGroup, setUseGroup] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [autoPauseEnabled, setAutoPauseEnabled] = useState(false);
  const [autoPauseAfter, setAutoPauseAfter] = useState([30]);
  const [autoPauseDuration, setAutoPauseDuration] = useState([15]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadProfiles();
    loadGroups();
  }, []);

  useEffect(() => {
    calculateEstimatedTime();
  }, [numbers, selectedProfiles, delay, randomDelay]);

  const loadProfiles = async () => {
    try {
      const data = await api.getProfiles();
      setProfiles(data);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить профили",
        variant: "destructive",
      });
    }
  };

  const loadGroups = () => {
    const stored = localStorage.getItem('profile_groups');
    if (stored) {
      try {
        setGroups(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading groups:', error);
      }
    }
  };

  const calculateEstimatedTime = () => {
    const phoneNumbers = numbers.split("\n").filter(n => n.trim()).length;
    if (phoneNumbers === 0 || selectedProfiles.length === 0) {
      setEstimatedTime("");
      return;
    }

    const totalMessages = phoneNumbers * selectedProfiles.length;
    let avgDelay: number;
    
    if (randomDelay) {
      avgDelay = (60 + 240) / 2; // Average of 1-4 minutes in seconds
    } else {
      avgDelay = delay[0];
    }

    const totalSeconds = totalMessages * avgDelay;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
      setEstimatedTime(`~${hours}ч ${minutes}м`);
    } else if (minutes > 0) {
      setEstimatedTime(`~${minutes}м`);
    } else {
      setEstimatedTime(`~${totalSeconds}с`);
    }
  };

  const addLog = (log: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const logs = JSON.parse(localStorage.getItem('mass_send_logs') || '[]');
    const newLog: LogEntry = {
      ...log,
      id: Date.now().toString() + Math.random(),
      timestamp: new Date(),
    };
    logs.unshift(newLog);
    // Keep only last 100 logs
    if (logs.length > 100) logs.pop();
    localStorage.setItem('mass_send_logs', JSON.stringify(logs));
  };

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroup(groupId);
    const group = groups.find(g => g.id === groupId);
    if (group) {
      setSelectedProfiles(group.profiles);
      setProfileMessages(group.messages);
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

  const handlePause = () => {
    setIsPaused(true);
    addLog({
      type: 'pause',
      message: 'Рассылка поставлена на паузу',
    });
    toast({
      title: "Пауза",
      description: "Рассылка приостановлена. Нажмите 'Продолжить' для возобновления",
    });
  };

  const handleResume = () => {
    setIsPaused(false);
    addLog({
      type: 'info',
      message: 'Рассылка возобновлена',
    });
    toast({
      title: "Продолжено",
      description: "Рассылка продолжается",
    });
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsSending(false);
    setIsPaused(false);
    addLog({
      type: 'error',
      message: `Рассылка остановлена. Отправлено: ${progress.current} из ${progress.total}`,
    });
    toast({
      title: "Остановлено",
      description: "Массовая рассылка остановлена",
      variant: "destructive",
    });
  };

  const handleStartMassSend = async () => {
    if (useGroup && !selectedGroup) {
      toast({
        title: "Ошибка",
        description: "Выберите группу профилей",
        variant: "destructive",
      });
      return;
    }

    if (!useGroup && selectedProfiles.length === 0) {
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
        description: "Добавьте контент для всех выбранных профилей",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    setIsPaused(false);
    abortControllerRef.current = new AbortController();

    const phoneNumbers = numbers.split("\n").map((n) => n.trim()).filter((n) => n);
    const totalMessages = phoneNumbers.length * selectedProfiles.length;
    setProgress({ current: 0, total: totalMessages });

    addLog({
      type: 'info',
      message: `Массовая рассылка запущена. Всего сообщений: ${totalMessages}`,
    });

    try {
      const profilesConfig: Record<string, string> = {};
      selectedProfiles.forEach((profile) => {
        profilesConfig[profile] = profileMessages[profile] || "";
      });

      const delayConfig = {
        random: randomDelay,
        delay: randomDelay ? 120 : delay[0], // Average delay for random
      };

      // Simulate sending with progress
      let currentMessage = 0;
      for (const phone of phoneNumbers) {
        for (const profile of selectedProfiles) {
          if (abortControllerRef.current?.signal.aborted) {
            throw new Error('Sending stopped by user');
          }

          // Wait while paused
          while (isPaused && !abortControllerRef.current?.signal.aborted) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          const startTime = Date.now();
          
          try {
            // Here would be actual API call - for now simulating
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const duration = Math.round((Date.now() - startTime) / 1000);
            currentMessage++;
            setProgress({ current: currentMessage, total: totalMessages });

            addLog({
              type: 'message',
              profile,
              phone,
              duration,
              message: `Сообщение успешно отправлено`,
            });

            // Check for auto-pause
            if (autoPauseEnabled && currentMessage % autoPauseAfter[0] === 0 && currentMessage < totalMessages) {
              const autoPauseTime = autoPauseDuration[0] * 60 * 1000; // Convert minutes to ms
              const pauseEnd = new Date(Date.now() + autoPauseTime);
              
              addLog({
                type: 'pause',
                message: `Авто-Пауза: отправлено ${autoPauseAfter[0]} сообщений. Отдых ${autoPauseDuration[0]} минут`,
                pauseEnd,
              });

              toast({
                title: "Авто-Пауза",
                description: `Отправлено ${autoPauseAfter[0]} сообщений. Отдых ${autoPauseDuration[0]} минут`,
              });

              await new Promise(resolve => setTimeout(resolve, autoPauseTime));

              addLog({
                type: 'info',
                message: 'Авто-Пауза завершена. Продолжаем рассылку',
              });
            }

            // Apply regular delay
            const delayTime = randomDelay 
              ? (60 + Math.random() * 180) * 1000 // 1-4 minutes
              : delay[0] * 1000;
            
            if (currentMessage < totalMessages) {
              const pauseEnd = new Date(Date.now() + delayTime);
              addLog({
                type: 'pause',
                message: `Задержка ${Math.round(delayTime / 1000)}с перед следующим сообщением`,
                pauseEnd,
              });
              await new Promise(resolve => setTimeout(resolve, delayTime));
            }
          } catch (error) {
            addLog({
              type: 'error',
              profile,
              phone,
              message: `Ошибка отправки: ${error}`,
            });
          }
        }
      }

      toast({
        title: "Рассылка завершена!",
        description: `Отправлено: ${currentMessage} из ${totalMessages} сообщений`,
      });

      addLog({
        type: 'info',
        message: `Рассылка завершена. Отправлено: ${currentMessage} из ${totalMessages}`,
      });

      setNumbers("");
      setSelectedProfiles([]);
      setProfileMessages({});
    } catch (error: any) {
      if (error.message !== 'Sending stopped by user') {
        toast({
          title: "Ошибка рассылки",
          description: "Произошла ошибка при выполнении рассылки",
          variant: "destructive",
        });
      }
    } finally {
      setIsSending(false);
      setIsPaused(false);
      abortControllerRef.current = null;
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
          {/* Group Selection */}
          <div className="flex items-center space-x-2 p-4 bg-secondary/30 rounded-lg">
            <Checkbox
              id="use-group"
              checked={useGroup}
              onCheckedChange={(checked) => setUseGroup(checked as boolean)}
            />
            <Label htmlFor="use-group" className="cursor-pointer flex-1">
              Использовать группу профилей
            </Label>
            {useGroup && (
              <Select value={selectedGroup} onValueChange={handleGroupSelect}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Выберите группу" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name} ({group.profiles.length} профилей)
                    </SelectItem>
                  ))}</SelectContent>
              </Select>
            )}
          </div>

          {/* Numbers Input */}
          <div className="space-y-2">
            <Label>Список номеров телефонов</Label>
            <Textarea
              placeholder="Введите номера телефонов (по одному на строку)
+79991234567
+79997654321"
              value={numbers}
              onChange={(e) => setNumbers(e.target.value)}
              className="min-h-[120px] bg-secondary border-border font-mono text-sm resize-none"
              disabled={isSending}
            />
            <p className="text-xs text-muted-foreground">
              {numbers.split("\n").filter((n) => n.trim()).length} номеров добавлено
            </p>
          </div>

          {/* Delay Settings */}
          <div className="space-y-4">
            <Label>Настройка задержки</Label>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {randomDelay ? "Случайная задержка (1-4 мин)" : `Задержка: ${delay[0]} сек`}
              </span>
              <div className="flex items-center gap-2">
                <Label htmlFor="random-delay" className="text-sm cursor-pointer">
                  Случайная задержка
                </Label>
                <Switch
                  id="random-delay"
                  checked={randomDelay}
                  onCheckedChange={setRandomDelay}
                  disabled={isSending}
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
                  disabled={isSending}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5 сек</span>
                  <span>120 сек</span>
                </div>
              </div>
            )}
          </div>

          {/* Auto-Pause Settings */}
          <Card className="border-border bg-secondary/20">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-pause" className="text-base font-medium cursor-pointer">
                    Авто-Пауза
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Автоматическая пауза после N сообщений
                  </p>
                </div>
                <Switch
                  id="auto-pause"
                  checked={autoPauseEnabled}
                  onCheckedChange={setAutoPauseEnabled}
                  disabled={isSending}
                />
              </div>

              {autoPauseEnabled && (
                <div className="space-y-4 pt-2">
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
                      disabled={isSending}
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
                      disabled={isSending}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>5 мин</span>
                      <span>60 мин</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estimated Time */}
          {estimatedTime && (
            <div className="flex items-center gap-2 p-3 bg-primary/10 text-primary rounded-lg">
              <Clock className="h-5 w-5" />
              <span className="text-sm font-medium">Примерное время завершения: {estimatedTime}</span>
            </div>
          )}

          {/* Progress */}
          {isSending && (
            <Card className="border-border bg-secondary/30">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Прогресс:</span>
                    <span className="font-medium">{progress.current} / {progress.total}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Profile Selection */}
      {!useGroup && (
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
                      disabled={isSending}
                    />
                    <Label
                      htmlFor={profile.name}
                      className="text-sm font-medium cursor-pointer"
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
                        disabled={isSending}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById(`image-${profile.name}`)?.click()}
                          disabled={isSending}
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
                          disabled={isSending}
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
      )}

      {/* Control Buttons */}
      <div className="flex gap-3">
        {!isSending ? (
          <Button
            className="flex-1"
            size="lg"
            onClick={handleStartMassSend}
            disabled={selectedProfiles.length === 0}
          >
            <Send className="mr-2 h-4 w-4" />
            Запустить массовую рассылку
          </Button>
        ) : (
          <>
            <Button
              className="flex-1"
              size="lg"
              variant={isPaused ? "default" : "secondary"}
              onClick={isPaused ? handleResume : handlePause}
            >
              {isPaused ? (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Продолжить
                </>
              ) : (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Пауза
                </>
              )}
            </Button>
            <Button
              className="flex-1"
              size="lg"
              variant="destructive"
              onClick={handleStop}
            >
              <StopCircle className="mr-2 h-4 w-4" />
              Остановить
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default MassSendEnhanced;
