import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Activity, BarChart3, Settings2, Download, TrendingUp, Sigma, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DashboardPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modelType, setModelType] = useState("");
  const [dependentVar, setDependentVar] = useState("");
  const [independentVars, setIndependentVars] = useState([]);
  const [entityVar, setEntityVar] = useState("");
  const [timeVar, setTimeVar] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const userName = localStorage.getItem("user_name") || "Usuário";

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_name");
    localStorage.removeItem("username");
    toast.success("Logout realizado com sucesso");
    navigate("/");
  };

  useEffect(() => {
    loadAnalysisData();
  }, [id]);

  const loadAnalysisData = async () => {
    try {
      const response = await axios.get(`${API}/analysis/${id}`);
      setAnalysisData(response.data);
      setModelType(response.data.metadata.suggested_model);
      setLoading(false);
    } catch (error) {
      toast.error("Erro ao carregar dados da análise");
      setLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    console.log("handleRunAnalysis called", { dependentVar, independentVars, modelType });
    
    if (!dependentVar || independentVars.length === 0) {
      toast.error("Selecione as variáveis dependente e independentes");
      console.log("Validation failed:", { dependentVar, independentVars });
      return;
    }

    setAnalyzing(true);
    try {
      const payload = {
        analysis_id: id,
        model_type: modelType,
        dependent_var: dependentVar,
        independent_vars: independentVars,
        entity_var: entityVar || null,
        time_var: timeVar || null,
        arima_order: [1, 1, 1],
      };
      
      console.log("Sending payload:", payload);

      const response = await axios.post(`${API}/analyze`, payload);
      console.log("Analysis response:", response.data);
      setResults(response.data);
      toast.success("Análise concluída com sucesso!");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Erro ao executar análise: " + (error.response?.data?.detail || error.message));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExportPDF = async () => {
    if (!results) return;
    try {
      const response = await axios.post(`${API}/export/pdf`, results, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "analise_econometrica.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("PDF exportado com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar PDF");
    }
  };

  const handleToggleIndependentVar = (varName) => {
    setIndependentVars((prev) =>
      prev.includes(varName) ? prev.filter((v) => v !== varName) : [...prev, varName]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-sm text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
            Carregando dados...
          </p>
        </div>
      </div>
    );
  }

  const columns = analysisData?.metadata?.columns || [];
  const numericColumns = columns.filter((col) => !col.toLowerCase().includes("id"));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Econometric Lab OS
              </h1>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
                {analysisData?.metadata?.filename}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <User className="w-4 h-4" />
              <span style={{ fontFamily: 'Inter, sans-serif' }}>{userName}</span>
            </div>
            <Button
              data-testid="export-pdf-button"
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={!results}
              className="h-9 px-3 rounded-sm font-medium"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
            <Button
              data-testid="logout-button"
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="h-9 px-3 rounded-sm font-medium"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-sm border-border/60">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Linhas
                  </p>
                  <p className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {analysisData?.metadata?.rows}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-border/60">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Colunas
                  </p>
                  <p className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {analysisData?.metadata?.columns?.length}
                  </p>
                </div>
                <Sigma className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-border/60 md:col-span-2">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-8 h-8 text-primary flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Modelo Sugerido
                  </p>
                  <p className="text-sm font-bold text-slate-900 mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    {analysisData?.metadata?.suggested_model?.toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {analysisData?.metadata?.model_reasoning}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="shadow-sm border-border/60">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                <Settings2 className="w-5 h-5" />
                Configuração
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="model-type" className="text-xs font-medium mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Tipo de Modelo
                </Label>
                <Select value={modelType} onValueChange={setModelType}>
                  <SelectTrigger data-testid="model-type-select" id="model-type" className="h-10 rounded-sm">
                    <SelectValue placeholder="Selecionar modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Regressão Linear (OLS)</SelectItem>
                    <SelectItem value="panel">Dados em Painel</SelectItem>
                    <SelectItem value="arima">ARIMA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div>
                <Label htmlFor="dependent-var" className="text-xs font-medium mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Variável Dependente (Y)
                </Label>
                <Select value={dependentVar} onValueChange={setDependentVar}>
                  <SelectTrigger data-testid="dependent-var-select" id="dependent-var" className="h-10 rounded-sm">
                    <SelectValue placeholder="Selecionar variável" />
                  </SelectTrigger>
                  <SelectContent>
                    {numericColumns.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Variáveis Independentes (X)
                </Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-border/60 rounded-sm p-3 bg-slate-50">
                  {numericColumns
                    .filter((col) => col !== dependentVar)
                    .map((col) => (
                      <label key={col} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 rounded transition-colors">
                        <input
                          type="checkbox"
                          data-testid={`independent-var-${col}`}
                          checked={independentVars.includes(col)}
                          onChange={() => handleToggleIndependentVar(col)}
                          className="rounded border-border/60"
                        />
                        <span className="text-xs text-slate-900" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {col}
                        </span>
                      </label>
                    ))}
                </div>
              </div>

              {modelType === "panel" && (
                <>
                  <div>
                    <Label htmlFor="entity-var" className="text-xs font-medium mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Variável de Entidade
                    </Label>
                    <Select value={entityVar} onValueChange={setEntityVar}>
                      <SelectTrigger id="entity-var" className="h-10 rounded-sm">
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="time-var" className="text-xs font-medium mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Variável de Tempo
                    </Label>
                    <Select value={timeVar} onValueChange={setTimeVar}>
                      <SelectTrigger id="time-var" className="h-10 rounded-sm">
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {modelType === "arima" && (
                <div>
                  <Label htmlFor="time-var-arima" className="text-xs font-medium mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Variável de Tempo
                  </Label>
                  <Select value={timeVar} onValueChange={setTimeVar}>
                    <SelectTrigger id="time-var-arima" className="h-10 rounded-sm">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                data-testid="run-analysis-button"
                onClick={handleRunAnalysis}
                disabled={analyzing}
                className="w-full h-10 px-4 py-2 rounded-sm font-medium transition-all active:scale-95"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {analyzing ? "Analisando..." : "Executar Análise"}
              </Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            {results ? (
              <>
                <Card className="shadow-sm border-border/60">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      Coeficientes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        <thead>
                          <tr className="border-b border-border/60 bg-slate-100">
                            <th className="text-left py-3 px-4 font-semibold text-slate-900">Variável</th>
                            <th className="text-right py-3 px-4 font-semibold text-slate-900">Coeficiente</th>
                            <th className="text-right py-3 px-4 font-semibold text-slate-900">Erro Padrão</th>
                            <th className="text-right py-3 px-4 font-semibold text-slate-900">t-stat</th>
                            <th className="text-right py-3 px-4 font-semibold text-slate-900">p-valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.coefficients.map((coef, idx) => (
                            <tr key={idx} className="border-b border-border/60 hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-4 font-medium text-slate-900">{coef.variable}</td>
                              <td className="text-right py-3 px-4 text-slate-700">{coef.coefficient.toFixed(4)}</td>
                              <td className="text-right py-3 px-4 text-slate-700">{coef.std_error.toFixed(4)}</td>
                              <td className="text-right py-3 px-4 text-slate-700">{coef.t_statistic.toFixed(4)}</td>
                              <td className={`text-right py-3 px-4 font-medium ${
                                coef.p_value < 0.05 ? "text-green-600" : "text-slate-700"
                              }`}>
                                {coef.p_value.toFixed(4)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-border/60">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      Estatísticas do Modelo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(results.statistics).map(([key, value]) => (
                        <div key={key} className="bg-slate-50 border border-border/60 rounded-sm p-4">
                          <p className="text-xs font-medium text-muted-foreground mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {key.replace(/_/g, " ").toUpperCase()}
                          </p>
                          <p className="text-lg font-bold text-slate-900" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            {typeof value === "number" ? value.toFixed(4) : value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-border/60">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      Gráficos de Diagnóstico
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue={Object.keys(results.charts)[0]} className="w-full">
                      <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Object.keys(results.charts).length}, minmax(0, 1fr))` }}>
                        {Object.keys(results.charts).map((chartName) => (
                          <TabsTrigger key={chartName} value={chartName} className="capitalize" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {chartName}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {Object.entries(results.charts).map(([chartName, chartData]) => (
                        <TabsContent key={chartName} value={chartName} className="mt-4">
                          <div className="chart-container bg-white border border-border/60 rounded-sm p-4">
                            <img
                              src={`data:image/png;base64,${chartData}`}
                              alt={chartName}
                              className="w-full h-auto"
                              data-testid={`chart-${chartName}`}
                            />
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="shadow-sm border-border/60">
                <CardContent className="py-12 text-center">
                  <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Configure as variáveis e execute a análise para visualizar os resultados
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;