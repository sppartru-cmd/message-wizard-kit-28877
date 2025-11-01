import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Key, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface AccessKeyProps {
  onAccessGranted: () => void;
}

const AccessKey = ({ onAccessGranted }: AccessKeyProps) => {
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!key.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите ключ доступа",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await api.validateKey(key);
      
      if (result.valid) {
        // Save activation in localStorage
        localStorage.setItem("app_activated", "true");
        toast({
          title: "Успешно!",
          description: result.message,
        });
        onAccessGranted();
      } else {
        toast({
          title: "Ошибка",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось проверить ключ. Проверьте подключение к серверу.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <Card className="w-full max-w-md border border-gray-800 shadow-2xl bg-[#121212]">
        <CardHeader className="text-center space-y-4 pb-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white mb-2">Активация приложения</CardTitle>
            <CardDescription className="text-gray-400 text-sm">
              Введите ключ доступа для начала работы
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Key className="absolute left-3 top-3 h-5 w-5 text-purple-400" />
                <Input
                  type="text"
                  placeholder="Введите ключ доступа"
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  className="pl-10 bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500 h-12"
                  disabled={loading}
                  maxLength={16}
                />
              </div>
              <p className="text-xs text-gray-500">
                Ключ состоит из 16 больших букв
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-semibold h-12 text-base"
              disabled={loading}
            >
              {loading ? "Проверка..." : "Активировать"}
            </Button>
          </form>
          
          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg space-y-3">
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              Ключ доступа предоставляется администратором.<br />
              После активации доступ предоставляется бесконечно.
            </p>
            <div className="pt-2 border-t border-purple-500/20">
              <p className="text-xs text-gray-300 text-center mb-2">
                Для приобретения ключа:
              </p>
              <a 
                href="https://t.me/lleeellll" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
                @lleeellll
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessKey;
