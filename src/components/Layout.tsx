import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Users, UserPlus, MessageSquare, BarChart3, Search } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTab = () => {
    if (location.pathname === "/") return "send";
    if (location.pathname === "/profiles") return "profiles";
    if (location.pathname === "/create-profile") return "create";
    if (location.pathname === "/mass-send") return "mass";
    if (location.pathname === "/analytics") return "analytics";
    if (location.pathname === "/check-numbers") return "check";
    return "send";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1
            className="text-5xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent mb-2"
            style={{
              filter: 'drop-shadow(0 0 30px hsl(280 100% 70% / 0.7)) drop-shadow(0 0 60px hsl(320 100% 70% / 0.5))',
              textShadow: '0 0 40px hsl(280 100% 70% / 0.6)'
            }}
          >
            WhatsApp Sender
          </h1>
          <p className="text-foreground/80 text-base">
            Современная панель для управления рассылкой сообщений
          </p>
        </div>

        <div className="mb-6 space-y-3">
          {/* First row - 3 buttons */}
          <Tabs value={getActiveTab()}>
            <TabsList className="grid w-full grid-cols-3 bg-card border border-border/50 h-12">
              <TabsTrigger
                value="send"
                onClick={() => navigate("/")}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_20px_hsl(280_100%_70%/0.5)] transition-all"
              >
                <Send className="mr-2 h-4 w-4" />
                Отправить
              </TabsTrigger>
              <TabsTrigger
                value="profiles"
                onClick={() => navigate("/profiles")}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_20px_hsl(280_100%_70%/0.5)] transition-all"
              >
                <Users className="mr-2 h-4 w-4" />
                Профили
              </TabsTrigger>
              <TabsTrigger
                value="create"
                onClick={() => navigate("/create-profile")}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_20px_hsl(280_100%_70%/0.5)] transition-all"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Создать
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Second row - 3 buttons */}
          <Tabs value={getActiveTab()}>
            <TabsList className="grid w-full grid-cols-3 bg-card border border-border/50 h-12">
              <TabsTrigger
                value="mass"
                onClick={() => navigate("/mass-send")}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_20px_hsl(280_100%_70%/0.5)] transition-all"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Массовая рассылка
              </TabsTrigger>
              <TabsTrigger
                value="check"
                onClick={() => navigate("/check-numbers")}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_20px_hsl(280_100%_70%/0.5)] transition-all"
              >
                <Search className="mr-2 h-4 w-4" />
                Проверка номеров
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                onClick={() => navigate("/analytics")}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_20px_hsl(280_100%_70%/0.5)] transition-all"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Аналитика
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {children}

        <footer className="mt-8 text-center text-sm text-muted-foreground space-y-1">
          <p>© 2025 WhatsApp Sender. Все права защищены.</p>
          <p>
            Контакт разработчика:{" "}
            <a
              href="https://t.me/lleeellll"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-glow transition-colors underline"
            >
              @lleeellll
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
