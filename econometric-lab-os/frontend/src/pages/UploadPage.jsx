import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { UploadCloud, FileSpreadsheet, Activity, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const userName = localStorage.getItem("user_name") || "Usuário";

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_name");
    localStorage.removeItem("username");
    toast.success("Logout realizado com sucesso");
    navigate("/");
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Por favor, selecione um arquivo CSV");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${API}/upload-csv`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Arquivo carregado com sucesso!");
      navigate(`/dashboard/${response.data.id}`);
    } catch (error) {
      toast.error("Erro ao carregar arquivo: " + (error.response?.data?.detail || error.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "Manrope, sans-serif" }}>
                Econometric Lab OS
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <User className="w-4 h-4" />
              <span style={{ fontFamily: "Inter, sans-serif" }}>{userName}</span>
            </div>
            <Button
              data-testid="logout-button"
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="h-9 px-3 rounded-sm font-medium"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>
              Upload de Dados
            </h2>
            <p className="text-lg text-slate-600" style={{ fontFamily: "Inter, sans-serif" }}>
              Carregue seu arquivo CSV para iniciar a análise econométrica
            </p>
          </div>

          <Card className="shadow-sm border-border/60">
            <CardContent className="pt-6 space-y-6">
              <div
                data-testid="file-dropzone"
                className={`relative border-2 border-dashed rounded-sm p-12 text-center transition-all duration-200 ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-border/60 hover:border-primary/50 bg-slate-50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  data-testid="file-input"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <UploadCloud className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-primary" />
                    <p className="text-sm font-medium text-slate-900" style={{ fontFamily: "Inter, sans-serif" }}>
                      {file.name}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
                      Arraste e solte seu arquivo CSV aqui
                    </p>
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
                      ou clique para selecionar
                    </p>
                  </div>
                )}
              </div>

              {file && (
                <div className="bg-slate-50 border border-border/60 rounded-sm p-4">
                  <h3 className="text-sm font-medium text-slate-900 mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>
                    Arquivo selecionado:
                  </h3>
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-slate-900" style={{ fontFamily: "Inter, sans-serif" }}>
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                data-testid="upload-button"
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full h-10 px-4 py-2 rounded-sm font-medium transition-all active:scale-95"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {uploading ? "Carregando..." : "Iniciar Análise"}
              </Button>
            </CardContent>
          </Card>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-sm border-border/60">
              <CardContent className="pt-6">
                <h3 className="text-sm font-medium text-slate-900 mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>
                  Regressão Linear
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                  OLS, Múltipla, diagnósticos completos
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-border/60">
              <CardContent className="pt-6">
                <h3 className="text-sm font-medium text-slate-900 mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>
                  Dados em Painel
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                  Efeitos fixos e aleatórios
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-border/60">
              <CardContent className="pt-6">
                <h3 className="text-sm font-medium text-slate-900 mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>
                  Séries Temporais
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                  ARIMA, VAR, previsões
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UploadPage;