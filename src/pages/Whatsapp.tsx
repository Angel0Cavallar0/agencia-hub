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

type ChatMessage = {
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
  source: "chat";
};

type GroupMessage = {
  group_id: string;
  group_name: string | null;
  group_photo: string | null;
  is_group: boolean | null;
  is_edited: boolean | null;
  nome_wpp: string | null;
  sender_phone: string | null;
  message_id: string;
  message: string | null;
  direcao: string | null;
  encaminhada: boolean | null;
  created_at: string | null;
  source: "group";
};

type WhatsappMessage = ChatMessage | GroupMessage;

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
  const [selectedChatSource, setSelectedChatSource] = useState<"chat" | "group" | null>(null);
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

      const [{ data: chatData, error: chatError }, { data: groupData, error: groupError }] =
        await Promise.all([
          supabase.from("chat_messages").select("*").order("created_at", { ascending: true }),
          supabase.from("group_messages").select("*").order("created_at", { ascending: true }),
        ]);

      if (chatError || groupError) {
        const error = chatError || groupError;
        console.error("Erro ao carregar mensagens do WhatsApp:", error);
        toast.error("Não foi possível carregar as mensagens do WhatsApp.", {
          description: error?.message,
        });
      }

      const chatMessages = (chatData || []).map((message) => ({
        ...(message as ChatMessage),
        source: "chat" as const,
      }));

      const groupMessages = (groupData || []).map((message) => ({
        ...(message as GroupMessage),
        source: "group" as const,
      }));

      const combinedMessages = [...chatMessages, ...groupMessages].sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateA - dateB;
      });

      setMessages(combinedMessages);

      if (combinedMessages.length > 0) {
        const firstMessage = combinedMessages[0];
        const firstId = firstMessage.source === "group" ? firstMessage.group_id : firstMessage.chat_id;
        setSelectedChat((current) => current ?? firstId ?? null);
        setSelectedChatSource((current) => current ?? firstMessage.source);
      }

      setLoading(false);
    };

    fetchMessages();

    const addUniqueMessage = (newMessage: WhatsappMessage) => {
      setMessages((prev) => {
        const exists = prev.some((message) => message.message_id === newMessage.message_id);
        if (exists) return prev;
        return [...prev, newMessage];
      });
    };

    const chatChannel = supabase
      .channel("chat-messages-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          console.log("Nova mensagem recebida:", payload);
          addUniqueMessage({ ...(payload.new as ChatMessage), source: "chat" });
        }
      )
      .subscribe();

    const groupChannel = supabase
      .channel("group-messages-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
        },
        (payload) => {
          console.log("Nova mensagem de grupo recebida:", payload);
          addUniqueMessage({ ...(payload.new as GroupMessage), source: "group" });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(groupChannel);
    };
  }, []);

  const chats = useMemo(() => {
    const grouped = new Map<
      string,
      {
        id: string;
        name: string;
        photo: string | null;
        isGroup: boolean;
        lastMessage?: WhatsappMessage;
        source: "chat" | "group";
      }
    >();

    messages.forEach((message) => {
      const isGroupSource = message.source === "group";
      const id = isGroupSource ? message.group_id : message.chat_id;
      if (!id) return;

      const key = `${message.source}:${id}`;
      const current = grouped.get(key);
      const isMoreRecent =
        message.created_at && (!current?.lastMessage?.created_at || message.created_at > current.lastMessage.created_at);

      if (!current || isMoreRecent) {
        grouped.set(key, {
          id,
          name: isGroupSource ? message.group_name || "Grupo sem nome" : message.chat_name || "Chat sem nome",
          photo: isGroupSource ? message.group_photo || null : message.foto_contato || null,
          isGroup: isGroupSource ? true : Boolean(message.is_group),
          lastMessage: message,
          source: message.source,
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
        .filter((message) => {
          const id = message.source === "group" ? message.group_id : message.chat_id;
          return id === selectedChat && message.source === selectedChatSource;
        })
        .sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateA - dateB;
        }),
    [messages, selectedChat, selectedChatSource]
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

  const formatDateLabel = (timestamp?: string | null) => {
    if (!timestamp) return "Data desconhecida";
    return new Date(timestamp).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const formattedContent = `*#${senderName}:*\n${newMessage}`;

    const baseMessage = replyTo || currentMessages[currentMessages.length - 1];
    const targetSource = selectedChatSource ?? baseMessage?.source ?? "chat";
    let sentMessage: WhatsappMessage | null = null;

    if (!selectedChat || !selectedChatSource) {
      const defaultId = baseMessage?.source === "group" ? baseMessage.group_id : baseMessage?.chat_id;
      setSelectedChat(defaultId || crypto.randomUUID());
      setSelectedChatSource(targetSource);
    }

    if (targetSource === "group") {
      const groupInfo = chats.find(
        (chat) => chat.id === selectedChat && chat.source === "group"
      );

      const newRecord: GroupMessage = {
        group_id: selectedChat || groupInfo?.id || crypto.randomUUID(),
        group_name: groupInfo?.name || (baseMessage && "group_name" in baseMessage ? baseMessage.group_name : null) ||
          "Grupo sem nome",
        group_photo: groupInfo?.photo || (baseMessage && "group_photo" in baseMessage ? baseMessage.group_photo : null) || null,
        is_group: true,
        is_edited: false,
        nome_wpp: senderName,
        sender_phone:
          (baseMessage && "sender_phone" in baseMessage ? baseMessage.sender_phone : null) || null,
        message_id: crypto.randomUUID(),
        message: formattedContent,
        direcao: "SENT",
        encaminhada: false,
        created_at: new Date().toISOString(),
        source: "group",
      };

      const { source, ...recordToInsert } = newRecord;
      const { error } = await supabase.from("group_messages").insert(recordToInsert);

      if (error) {
        toast.error("Não foi possível enviar a mensagem.");
        return;
      }

      sentMessage = newRecord;
      setMessages((prev) => {
        const exists = prev.some((message) => message.message_id === newRecord.message_id);
        if (exists) return prev;
        return [...prev, newRecord];
      });
      setSelectedChat(newRecord.group_id);
      setSelectedChatSource("group");
    } else {
      const newRecord: ChatMessage = {
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
        source: "chat",
      };

      const { source, ...recordToInsert } = newRecord;
      const { error } = await supabase.from("chat_messages").insert(recordToInsert);

      if (error) {
        toast.error("Não foi possível enviar a mensagem.");
        return;
      }

      sentMessage = newRecord;
      setMessages((prev) => {
        const exists = prev.some((message) => message.message_id === newRecord.message_id);
        if (exists) return prev;
        return [...prev, newRecord];
      });
      setSelectedChat((current) => current ?? newRecord.chat_id);
      setSelectedChatSource("chat");
    }

    setNewMessage("");
    setReplyTo(null);

    if (webhookUrl) {
      try {
        const sanitizeMessage = (message: WhatsappMessage | null) => {
          if (!message) return null;
          const { source, ...rest } = message;
          return rest;
        };

        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reply: sanitizeMessage(replyTo),
            message: sanitizeMessage(sentMessage),
          }),
        });
      } catch (err) {
        console.error(err);
        toast.warning("Mensagem enviada, mas o webhook não pôde ser acionado.");
      }
    }
  };

  const selectedChatData = useMemo(() => {
    return chats.find((chat) => chat.id === selectedChat && chat.source === selectedChatSource);
  }, [chats, selectedChat, selectedChatSource]);

  return (
    <Layout noPadding>
      <div className="flex h-full min-h-0 flex-col">
        <div className="grid h-full min-h-0 lg:grid-cols-[340px_1fr]">
          {/* Sidebar de conversas */}
          <div className="flex min-h-0 flex-col border-r border-border bg-background">
            <div className="sticky top-0 z-10 border-b border-border bg-muted/30 p-4">
              <h2 className="text-lg font-semibold">Conversas</h2>
            </div>
            <ScrollArea className="flex-1">
              {loading && <p className="p-4 text-sm text-muted-foreground">Carregando...</p>}
              {!loading && chats.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground">Nenhuma conversa</p>
              )}
              <div className="divide-y divide-border">
                {chats.map((chat) => (
                  <button
                    key={`${chat.source}-${chat.id}`}
                    onClick={() => {
                      setSelectedChat(chat.id);
                      setSelectedChatSource(chat.source);
                    }}
                    className={`w-full p-4 text-left transition hover:bg-muted/50 ${
                      selectedChat === chat.id && selectedChatSource === chat.source ? "bg-muted/80" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={chat.photo || undefined} alt={chat.name} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {chat.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate font-semibold">{chat.name}</p>
                          <span className="text-xs text-muted-foreground">
                            {chat.lastMessage?.created_at
                              ? new Date(chat.lastMessage.created_at).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                        </div>
                        <p className="truncate text-sm text-muted-foreground">{chat.lastMessage?.message}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Área de chat */}
          <div className="flex min-h-0 flex-col bg-background">
            {!selectedChat ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-muted-foreground">Selecione uma conversa</p>
              </div>
            ) : (
              <>
                {/* Header do chat */}
                <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-muted/30 p-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={selectedChatData?.photo || undefined}
                      alt={selectedChatData?.name}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedChatData?.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedChatData?.name}</p>
                    {selectedChatData?.isGroup && (
                      <p className="text-xs text-muted-foreground">Grupo</p>
                    )}
                  </div>
                </div>

                {/* Mensagens */}
                <ScrollArea className="flex-1 bg-muted/20 p-4">
                  <div className="space-y-3">
                    {currentMessages.map((message, index) => {
                      const previousMessage = currentMessages[index - 1];
                      const currentDateLabel = formatDateLabel(message.created_at);
                      const previousDateLabel = formatDateLabel(previousMessage?.created_at);
                      const showDateSeparator = index === 0 || currentDateLabel !== previousDateLabel;

                      return (
                        <div key={message.message_id} className="space-y-2">
                          {showDateSeparator && (
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <div className="h-px flex-1 bg-border" />
                              <span className="rounded-full bg-muted px-3 py-1 font-semibold capitalize">
                                {currentDateLabel}
                              </span>
                              <div className="h-px flex-1 bg-border" />
                            </div>
                          )}
                          <div
                            className={`flex ${message.direcao === "SENT" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[65%] rounded-lg px-3 py-2 shadow-sm ${
                                message.direcao === "SENT"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-background border border-border"
                              }`}
                            >
                              {message.source === "group" && "nome_wpp" in message && message.nome_wpp && (
                                <p className="mb-1 text-[11px] font-semibold opacity-80">{message.nome_wpp}</p>
                              )}
                              <p className="whitespace-pre-wrap text-sm">{message.message}</p>
                              <div className="mt-1 flex items-center justify-end gap-1">
                                {message.is_edited && (
                                  <span className="text-[10px] opacity-60">editado</span>
                                )}
                                <span className="text-[10px] opacity-60">
                                  {message.created_at
                                    ? new Date(message.created_at).toLocaleTimeString("pt-BR", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : ""}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input de mensagem */}
                <div className="border-t border-border bg-background p-4">
                  {replyTo && (
                    <div className="mb-2 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-2 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-primary">Respondendo</p>
                        <p className="truncate text-xs text-muted-foreground">{replyTo.message}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)}>
                        ✕
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
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
                      className="flex-1"
                    />
                    <Button onClick={handleSend} size="icon" className="shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m22 2-7 20-4-9-9-4Z" />
                        <path d="M22 2 11 13" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
