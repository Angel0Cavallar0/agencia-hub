import { useState, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileAudio, Clock, AlertCircle, Construction } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";

interface Cliente {
  id_cliente: string;
  nome_cliente: string;
}

export default function Reunioes() {
  const [activeTab, setActiveTab] = useState("reunioes");
  const [selectedClient, setSelectedClient] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch clients
  const { data: clients, isLoading: loadingClients } = useQuery({
    queryKey: ["clients-for-meetings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes_infos")
        .select("id_cliente, nome_cliente")
        .eq("cliente_ativo", true)
        .order("nome_cliente");

      if (error) throw error;
      return data as Cliente[];
    },
  });

  // Fetch webhook URL from global_settings
  const { data: webhookSetting } = useQuery({
    queryKey: ["meetings-webhook"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("global_settings")
        .select("value")
        .eq("key", "meetings_webhook")
        .maybeSingle();

      if (error) throw error;
      return data?.value as string | null;
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's an audio file
    if (!file.type.startsWith("audio/")) {
      toast.error("Por favor, selecione um arquivo de áudio válido");
      return;
    }

    setAudioFile(file);

    // Get audio duration
    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    audio.onloadedmetadata = () => {
      setAudioDuration(audio.duration);
      URL.revokeObjectURL(audio.src);
    };
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const handleUpload = async () => {
    if (!audioFile) {
      toast.error("Selecione um arquivo de áudio");
      return;
    }

    if (!selectedClient) {
      toast.error("Selecione um cliente");
      return;
    }

    const selectedClientData = clients?.find((c) => c.id_cliente === selectedClient);
    if (!selectedClientData) {
      toast.error("Cliente não encontrado");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedFileName = audioFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `reunioes/${selectedClient}/${timestamp}_${sanitizedFileName}`;

      setUploadProgress(30);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("evolution")
        .upload(filePath, audioFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setUploadProgress(60);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("evolution")
        .getPublicUrl(filePath);

      const fileUrl = urlData.publicUrl;

      setUploadProgress(80);

      // Send webhook if configured
      if (webhookSetting) {
        const webhookPayload = {
          file_url: fileUrl,
          file_name: audioFile.name,
          client_id: selectedClient,
          client_name: selectedClientData.nome_cliente,
          duration_seconds: audioDuration,
          duration_formatted: formatDuration(audioDuration),
          uploaded_at: new Date().toISOString(),
        };

        try {
          await fetch(webhookSetting, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(webhookPayload),
          });
        } catch (webhookError) {
          console.error("Erro ao enviar webhook:", webhookError);
          // Don't fail the upload if webhook fails
          toast.warning("Arquivo enviado, mas o webhook falhou");
        }
      }

      setUploadProgress(100);

      toast.success("Arquivo enviado com sucesso!");

      // Reset form
      setAudioFile(null);
      setSelectedClient("");
      setAudioDuration(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao enviar arquivo: " + (error as Error).message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reuniões</h1>
          <p className="text-muted-foreground">
            Faça upload de áudios de reuniões para transcrição
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="reunioes">Reuniões</TabsTrigger>
            <TabsTrigger value="transcricoes">Transcrições</TabsTrigger>
          </TabsList>

          <TabsContent value="reunioes" className="mt-6">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Upload de Áudio</CardTitle>
                <CardDescription>
                  Envie o arquivo de áudio da reunião e selecione o cliente relacionado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Client Selection */}
                <div className="space-y-2">
                  <Label htmlFor="client">Cliente</Label>
                  <Select
                    value={selectedClient}
                    onValueChange={setSelectedClient}
                    disabled={loadingClients}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map((client) => (
                        <SelectItem key={client.id_cliente} value={client.id_cliente}>
                          {client.nome_cliente}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="audio">Arquivo de Áudio</Label>
                  <div
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {audioFile ? (
                      <div className="space-y-2">
                        <FileAudio className="h-12 w-12 mx-auto text-primary" />
                        <p className="font-medium">{audioFile.name}</p>
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Duração: {formatDuration(audioDuration)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Clique para trocar o arquivo
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                        <p className="text-muted-foreground">
                          Clique para selecionar ou arraste o arquivo aqui
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Formatos suportados: MP3, WAV, M4A, OGG
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} />
                    <p className="text-sm text-muted-foreground text-center">
                      Enviando arquivo...
                    </p>
                  </div>
                )}

                {/* Webhook Warning */}
                {!webhookSetting && (
                  <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-500">Webhook não configurado</p>
                      <p className="text-muted-foreground">
                        Configure o webhook na página de Configurações para processar as reuniões automaticamente.
                      </p>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  onClick={handleUpload}
                  disabled={!audioFile || !selectedClient || isUploading}
                  className="w-full"
                >
                  {isUploading ? "Enviando..." : "Enviar Reunião"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transcricoes" className="mt-6">
            <Card>
              <CardContent className="py-16">
                <div className="text-center space-y-4">
                  <Construction className="h-16 w-16 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-medium">Em desenvolvimento</h3>
                    <p className="text-muted-foreground">
                      A funcionalidade de transcrições está sendo desenvolvida e estará disponível em breve.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
