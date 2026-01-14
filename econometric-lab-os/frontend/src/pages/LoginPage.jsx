import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const VALID_USERS = [
  { username: "admin", password: "admin123", name: "Administrador" },
  { username: "pesquisador", password: "pesquisa2024", name: "Pesquisador" },
  { username: "estudante", password: "estudo2024", name: "Estudante" },
];

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const user = VALID_USERS.find(
        (u) => u.username === username && u.password === password
      );

      if (user) {
        localStorage.setItem("auth_token", "logged_in");
        localStorage.setItem("user_name", user.name);
        localStorage.setItem("username", user.username);
        toast.success(`Bem-vindo, ${user.name}!`);
        navigate("/upload");
      } else {
        toast.error("Usuário ou senha inválidos");
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Activity className="w-12 h-12 text-primary" />
          </div>
          <h1
            className="text-4xl font-bold tracking-tight text-slate-900 mb-3"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Econometric Lab OS
          </h1>
          <p
            className="text-lg text-slate-600"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Plataforma profissional para análise econométrica
          </p>
        </div>

        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle
              className="text-2xl font-semibold"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Login
            </CardTitle>
            <CardDescription
              className="text-sm leading-relaxed"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label
                  htmlFor="username"
                  className="text-xs font-medium mb-2 block"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Usuário
                </Label>
                <Input
                  id="username"
                  data-testid="login-username"
                  type="text"
                  placeholder="Digite seu usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-10 rounded-sm"
                  required
                  style={{ fontFamily: "Inter, sans-serif" }}
                />
              </div>

              <div>
                <Label
                  htmlFor="password"
                  className="text-xs font-medium mb-2 block"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Senha
                </Label>
                <Input
                  id="password"
                  data-testid="login-password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 rounded-sm"
                  required
                  style={{ fontFamily: "Inter, sans-serif" }}
                />
              </div>

              <Button
                data-testid="login-button"
                type="submit"
                disabled={loading}
                className="w-full h-10 px-4 py-2 rounded-sm font-medium transition-all active:scale-95"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border/60">
              <p
                className="text-xs text-muted-foreground mb-3"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Usuários de demonstração:
              </p>
              <div className="space-y-2">
                {VALID_USERS.map((user) => (
                  <div
                    key={user.username}
                    className="bg-slate-50 border border-border/60 rounded-sm p-2 text-xs"
                    style={{ fontFamily: "JetBrains Mono, monospace" }}
                  >
                    <span className="font-medium text-slate-900">
                      {user.name}:
                    </span>{" "}
                    <span className="text-slate-600">
                      {user.username} / {user.password}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;