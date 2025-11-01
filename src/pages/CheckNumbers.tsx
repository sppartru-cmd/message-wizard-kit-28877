import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api, Profile } from "@/lib/api";

const CheckNumbers = () => {
  const [selectedProfile, setSelectedProfile] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [numbers, setNumbers] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [registeredNumbers, setRegisteredNumbers] = useState<string[]>([]);
  const [unregisteredNumbers, setUnregisteredNumbers] = useState<string[]>([]);
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

  const handleCheckNumbers = async () => {
    if (!selectedProfile) {
      toast({
        title: "Ошибка",
        description: "Выберите профиль",
        variant: "destructive",
      });
      return;
    }

    if (!numbers.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите номера для проверки",
        variant: "destructive",
      });
      return;
    }

    const phoneNumbers = numbers
      .split("\n")
      .map(num => num.trim())
      .filter(num => num.length > 0);

    if (phoneNumbers.length === 0) {
      toast({
        title: "Ошибка",
        description: "Не найдено корректных номеров",
        variant: "destructive",
      });
      return;
    }

    setIsChecking(true);
    setRegisteredNumbers([]);
    setUnregisteredNumbers([]);

    try {
      const result = await api.checkNumbers(selectedProfile, phoneNumbers);

      if (result.success) {
        setRegisteredNumbers(result.registered);
        setUnregisteredNumbers(result.unregistered);
        toast({
          title: "Проверка завершена!",
          description: `Зарегистрировано: ${result.registered.length}, Не зарегистрировано: ${result.unregistered.length}`,
        });
      } else {
        toast({
          title: "Ошибка проверки",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка подключения",
        description: "Не удалось проверить номера. Проверьте подключение к серверу.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Проверка номеров WhatsApp
          </CardTitle>
          <CardDescription>
            Введите номера для проверки их регистрации в WhatsApp (по одному на строку)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Профиль</Label>
            <Select value={selectedProfile} onValueChange={setSelectedProfile}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите профиль" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.name} value={profile.name}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Номера телефонов</Label>
            <Textarea
              placeholder="79222442442&#10;79222453248&#10;79222543212"
              value={numbers}
              onChange={(e) => setNumbers(e.target.value)}
              className="min-h-[200px] bg-secondary border-border resize-none font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Введите номера в формате: 79222442442 (по одному на строку)
            </p>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleCheckNumbers}
            disabled={!selectedProfile || !numbers.trim() || isChecking}
          >
            <Search className="mr-2 h-4 w-4" />
            {isChecking ? "Проверка..." : "Проверить номера"}
          </Button>
        </CardContent>
      </Card>

      {(registeredNumbers.length > 0 || unregisteredNumbers.length > 0) && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-border bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="h-5 w-5" />
                Зарегистрированы ({registeredNumbers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {registeredNumbers.length > 0 ? (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {registeredNumbers.map((number, index) => (
                    <div
                      key={index}
                      className="p-3 bg-secondary rounded-md border border-green-500/20 flex items-center gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="font-mono">{number}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Нет зарегистрированных номеров
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                Не зарегистрированы ({unregisteredNumbers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {unregisteredNumbers.length > 0 ? (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {unregisteredNumbers.map((number, index) => (
                    <div
                      key={index}
                      className="p-3 bg-secondary rounded-md border border-destructive/20 flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                      <span className="font-mono">{number}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Все номера зарегистрированы
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CheckNumbers;
