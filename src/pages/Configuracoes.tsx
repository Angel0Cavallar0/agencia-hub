import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Configuracoes() {
  const {
    darkMode,
    setDarkMode,
    primaryColor,
    setPrimaryColor,
    secondaryColor,
    setSecondaryColor,
    logoUrl,
    setLogoUrl,
    loginLogoUrl,
    setLoginLogoUrl,
    faviconUrl,
    setFaviconUrl,
    saveAsGlobal
  } = useTheme();
  const [tempLogoUrl, setTempLogoUrl] = useState(logoUrl);
  const [tempLoginLogoUrl, setTempLoginLogoUrl] = useState(loginLogoUrl);
  const [tempFaviconUrl, setTempFaviconUrl] = useState(faviconUrl);

  const handleSaveUrls = () => {
    setLogoUrl(tempLogoUrl);
    setLoginLogoUrl(tempLoginLogoUrl);
    setFaviconUrl(tempFaviconUrl);
    toast.success("Configurações salvas com sucesso!");
  };

  const hslToHex = (hsl: string): string => {
    const [h, s, l] = hsl.split(" ").map((v) => parseFloat(v));
    const hDecimal = h / 360;
    const sDecimal = s / 100;
    const lDecimal = l / 100;
    
    const c = (1 - Math.abs(2 * lDecimal - 1)) * sDecimal;
    const x = c * (1 - Math.abs(((hDecimal * 6) % 2) - 1));
    const m = lDecimal - c / 2;
    
    let r = 0, g = 0, b = 0;
    if (hDecimal < 1/6) { r = c; g = x; b = 0; }
    else if (hDecimal < 2/6) { r = x; g = c; b = 0; }
    else if (hDecimal < 3/6) { r = 0; g = c; b = x; }
    else if (hDecimal < 4/6) { r = 0; g = x; b = c; }
    else if (hDecimal < 5/6) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    
    const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const hexToHsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">Personalize a aparência do sistema</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Identidade Visual</CardTitle>
            <CardDescription>Configure a logo e o favicon da aplicação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo">URL da Logo</Label>
              <Input
                id="logo"
                placeholder="https://exemplo.com/logo.png"
                value={tempLogoUrl}
                onChange={(e) => setTempLogoUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loginLogo">URL da Logo da Página de Login</Label>
              <Input
                id="loginLogo"
                placeholder="https://exemplo.com/login-logo.png"
                value={tempLoginLogoUrl}
                onChange={(e) => setTempLoginLogoUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="favicon">URL do Favicon</Label>
              <Input
                id="favicon"
                placeholder="https://exemplo.com/favicon.ico"
                value={tempFaviconUrl}
                onChange={(e) => setTempFaviconUrl(e.target.value)}
              />
            </div>
            <Button onClick={handleSaveUrls}>Salvar URLs</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cores do Tema</CardTitle>
            <CardDescription>Personalize as cores da interface</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Cor Primária</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="color"
                  value={hslToHex(primaryColor)}
                  onChange={(e) => setPrimaryColor(hexToHsl(e.target.value))}
                  className="w-20 h-10"
                />
                <Input
                  value={hslToHex(primaryColor)}
                  onChange={(e) => {
                    if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                      setPrimaryColor(hexToHsl(e.target.value));
                    }
                  }}
                  placeholder="#096B68"
                  className="w-32"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Cor Secundária</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="color"
                  value={hslToHex(secondaryColor)}
                  onChange={(e) => setSecondaryColor(hexToHsl(e.target.value))}
                  className="w-20 h-10"
                />
                <Input
                  value={hslToHex(secondaryColor)}
                  onChange={(e) => {
                    if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                      setSecondaryColor(hexToHsl(e.target.value));
                    }
                  }}
                  placeholder="#129990"
                  className="w-32"
                />
              </div>
            </div>

            <Button onClick={saveAsGlobal} variant="outline">
              Salvar como padrão para todos os usuários
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tema</CardTitle>
            <CardDescription>Alterne entre modo claro e escuro</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode">Modo Escuro</Label>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
