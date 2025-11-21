import { useEffect, useMemo, useRef, useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type WhatsappMessage = {
  chat_id: string;
  message_id: string;
  numero_wpp: string | null;
  chat_name: string | null;
  direcao: string | null;
  foto_contato: string | null;
  encaminhado: boolean | null;
  is_group: boolean | null;
  is_edited: boolean | null;
  message: string | null;
  reference_message_id: string | null;
  created_at: string | null;
};

const WEBHOOK_KEY = "whatsapp-webhook-url";

type SenderProfile = {
  nome: string | null;
  sobrenome: string | null;
  apelido: string | null;
};

export default function Whatsapp() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<WhatsappMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<WhatsappMessage | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [senderProfile, setSenderProfile] = useState<SenderProfile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const storedWebhook = localStorage.getItem(WEBHOOK_KEY);
    if (storedWebhook) {
      setWebhookUrl(storedWebhook);
    }
  }, []);

  useEffect(() => {
    const loadSender = async () => {
      if (!user?.id) {
        setSenderProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from("colaborador")
        .select("nome, sobrenome, apelido")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Erro ao carregar dados do usuário do WhatsApp:", error);
        return;
      }

      setSenderProfile({
        nome: data?.nome ?? null,
        sobrenome: data?.sobrenome ?? null,
        apelido: data?.apelido ?? null,
      });
    };

    loadSender();
  }, [user?.id]);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Erro ao carregar mensagens do WhatsApp:", error);
        toast.error("Não foi possível carregar as mensagens do WhatsApp.", {
          description: error.message,
        });
      } else if (data) {
        setMessages(data as WhatsappMessage[]);
        setSelectedChat((current) => current ?? data[0]?.chat_id ?? null);
      }
      setLoading(false);
    };

    fetchMessages();
  }, []);

  const chats = useMemo(() => {
    const grouped = new Map<string, { chat: string; name: string; isGroup: boolean; lastMessage?: WhatsappMessage }>();

    messages.forEach((message) => {
      const current = grouped.get(message.chat_id);
      if (!current || (message.created_at && (!current.lastMessage || message.created_at > current.lastMessage.created_at!))) {
        grouped.set(message.chat_id, {
          chat: message.chat_id,
          name: message.chat_name || "Chat sem nome",
          isGroup: Boolean(message.is_group),
          lastMessage: message,
        });
      }
    });

    return Array.from(grouped.values()).sort((a, b) => {
      const dateA = a.lastMessage?.created_at ? new Date(a.lastMessage.created_at).getTime() : 0;
      const dateB = b.lastMessage?.created_at ? new Date(b.lastMessage.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [messages]);

  const currentMessages = useMemo(
    () =>
      messages
        .filter((message) => message.chat_id === selectedChat)
        .sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateA - dateB;
        }),
    [messages, selectedChat]
  );

  useEffect(() => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages.length, selectedChat]);

  const senderName = useMemo(() => {
    if (senderProfile?.apelido) return senderProfile.apelido;
    const parts = [senderProfile?.nome, senderProfile?.sobrenome].filter(Boolean) as string[];
    if (parts.length > 0) return parts.join(" ");
    return user?.email ?? "Usuário";
  }, [senderProfile?.apelido, senderProfile?.nome, senderProfile?.sobrenome, user?.email]);

  const formatTime = (timestamp?: string | null) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const formattedContent = `*#${senderName}:*\n${newMessage}`;

    const baseMessage = replyTo || currentMessages[currentMessages.length - 1];
    const newRecord: WhatsappMessage = {
      chat_id: baseMessage?.chat_id || selectedChat || crypto.randomUUID(),
      message_id: crypto.randomUUID(),
      numero_wpp: baseMessage?.numero_wpp || null,
      chat_name: baseMessage?.chat_name || "Chat sem nome",
      direcao: "SENT",
      foto_contato: baseMessage?.foto_contato || null,
      encaminhado: baseMessage?.encaminhado ?? false,
      is_group: baseMessage?.is_group ?? false,
      is_edited: false,
      message: formattedContent,
      reference_message_id: replyTo?.message_id || baseMessage?.message_id || null,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("chat_messages").insert(newRecord);

    if (error) {
      toast.error("Não foi possível enviar a mensagem.");
      return;
    }

    setMessages((prev) => [...prev, newRecord]);
    setSelectedChat((current) => current ?? newRecord.chat_id);
    setNewMessage("");
    setReplyTo(null);

    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reply: replyTo,
            message: newRecord,
          }),
        });
      } catch (err) {
        console.error(err);
        toast.warning("Mensagem enviada, mas o webhook não pôde ser acionado.");
      }
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp</h1>
          <p className="text-muted-foreground">Visualize e responda às mensagens recebidas</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Conversas</CardTitle>
              <CardDescription>Grupos e contatos sincronizados do WhatsApp</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[620px] pr-4">
                {loading && <p className="text-sm text-muted-foreground">Carregando mensagens...</p>}
                {!loading && chats.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma conversa encontrada.</p>
                )}
                <div className="space-y-3">
                  {chats.map((chat) => (
                    <button
                      key={chat.chat}
                      onClick={() => setSelectedChat(chat.chat)}
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        selectedChat === chat.chat ? "border-primary bg-primary/10" : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={chat.lastMessage?.foto_contato || undefined} alt={chat.name} />
                          <AvatarFallback>{chat.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium leading-none">{chat.name}</p>
                            {chat.isGroup && <Badge variant="outline">Grupo</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">{formatTime(chat.lastMessage?.created_at)}</p>
                          <p className="truncate text-sm text-muted-foreground">{chat.lastMessage?.message}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Janela de Chat</CardTitle>
              <CardDescription>Visualize o histórico e responda às mensagens recebidas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedChat ? (
                <p className="text-muted-foreground">Selecione uma conversa para visualizar as mensagens.</p>
              ) : (
                <>
                  <ScrollArea className="h-[520px] pr-4">
                    <div className="space-y-4">
                      {currentMessages.map((message) => (
                        <div
                          key={message.message_id}
                          className={`flex ${message.direcao === "SENT" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-lg border p-3 shadow-sm ${
                              message.direcao === "SENT" ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {message.encaminhado && <Badge variant="secondary">Encaminhado</Badge>}
                                {message.is_group && <Badge variant="outline">Grupo</Badge>}
                                {message.is_edited && <Badge variant="outline">Editado</Badge>}
                              </div>
                              <span className="text-[11px] opacity-80">{formatTime(message.created_at)}</span>
                            </div>
                            <p className="mt-2 whitespace-pre-wrap text-sm">{message.message}</p>
                            {message.reference_message_id && (
                              <p className="mt-2 text-xs text-muted-foreground">
                                Respondendo a: {message.reference_message_id}
                              </p>
                            )}
                            {message.direcao !== "SENT" && (
                              <div className="mt-3 flex justify-end">
                                <Button variant="secondary" size="sm" onClick={() => setReplyTo(message)}>
                                  Responder
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {replyTo && (
                    <div className="rounded-lg border bg-muted/60 p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Respondendo a</p>
                          <p className="text-muted-foreground">{replyTo.message}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      placeholder="Digite uma mensagem"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                    />
                    <Button onClick={handleSend}>Enviar</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
