import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  CheckSquare,
  Forward,
  MoreVertical,
  Trash2,
  Paperclip,
  Image,
  Video,
  Mic,
  FileText,
  X,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  image_url?: string | null;
  video_url?: string | null;
  audio_url?: string | null;
  audio_transcripiton?: string | null;
  audio_transcription?: string | null;
  document_url?: string | null;
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
  image_url?: string | null;
  video_url?: string | null;
  audio_url?: string | null;
  audio_transcripiton?: string | null;
  audio_transcription?: string | null;
  document_url?: string | null;
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
  const [isSelectingMessages, setIsSelectingMessages] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [archivedChatKeys, setArchivedChatKeys] = useState<string[]>([]);
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [audioStates, setAudioStates] = useState<
    Record<string, { currentTime: number; duration: number; isPlaying: boolean }>
  >({});
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [expandedMedia, setExpandedMedia] = useState<{
    url: string;
    type: "image" | "video";
  } | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ file: File; type: "image" | "video" | "audio" | "document"; preview?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedArchived = localStorage.getItem("whatsapp-archived-chats");
    if (storedArchived) {
      try {
        setArchivedChatKeys(JSON.parse(storedArchived));
      } catch (error) {
        console.error("Erro ao carregar chats arquivados:", error);
      }
    }

    const storedWebhook = localStorage.getItem(WEBHOOK_KEY);
    if (storedWebhook) {
      setWebhookUrl(storedWebhook);
      return;
    }

    const loadGlobalWebhook = async () => {
      const { data, error } = await supabase
        .from("global_settings")
        .select("value")
        .eq("key", "whatsapp_webhook")
        .maybeSingle();

      if (error) {
        console.error("Erro ao carregar webhook global do WhatsApp:", error);
        return;
      }

      const webhookValue =
        typeof data?.value === "string"
          ? data.value
          : typeof (data?.value as any)?.url === "string"
            ? (data?.value as any).url
            : "";

      if (webhookValue) {
        setWebhookUrl(webhookValue);
        localStorage.setItem(WEBHOOK_KEY, webhookValue);
      }
    };

    loadGlobalWebhook();
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

      const chatMessages: ChatMessage[] = (chatData || []).map((message) => ({
        ...message,
        source: "chat" as const,
      }));

      const groupMessages: GroupMessage[] = (groupData || []).map((message) => ({
        ...message,
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
        archived: boolean;
      }
    >();

    messages.forEach((message) => {
      const isGroupSource = message.source === "group";
      const id = isGroupSource ? message.group_id : message.chat_id;
      if (!id) return;

      const key = `${message.source}:${id}`;
      const current = grouped.get(key);
      const isArchived = archivedChatKeys.includes(key);
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
          archived: isArchived,
        });
      }
    });

    return Array.from(grouped.values()).sort((a, b) => {
      const dateA = a.lastMessage?.created_at ? new Date(a.lastMessage.created_at).getTime() : 0;
      const dateB = b.lastMessage?.created_at ? new Date(b.lastMessage.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [archivedChatKeys, messages]);

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
  }, [currentMessages, selectedChat]);

  useEffect(() => {
    clearSelection();
  }, [selectedChat, selectedChatSource]);

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

  const formatSeconds = (value: number) => {
    if (!Number.isFinite(value) || value < 0) return "0:00";
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const handleAudioStateUpdate = (messageId: string, updater: Partial<{
    currentTime: number;
    duration: number;
    isPlaying: boolean;
  }>) => {
    setAudioStates((prev) => ({
      ...prev,
      [messageId]: {
        currentTime: updater.currentTime ?? prev[messageId]?.currentTime ?? 0,
        duration: updater.duration ?? prev[messageId]?.duration ?? 0,
        isPlaying: updater.isPlaying ?? prev[messageId]?.isPlaying ?? false,
      },
    }));
  };

  const handlePlayPause = async (message: WhatsappMessage) => {
    if (!message.audio_url) return;
    const audio = audioRef.current;
    if (!audio) return;

    const currentState = audioStates[message.message_id] ?? {
      currentTime: 0,
      duration: 0,
      isPlaying: false,
    };

    if (activeAudioId && activeAudioId !== message.message_id) {
      handleAudioStateUpdate(activeAudioId, { isPlaying: false });
    }

    // If the same audio is active, toggle play/pause
    if (activeAudioId === message.message_id) {
      if (!audio.paused) {
        audio.pause();
        handleAudioStateUpdate(message.message_id, { isPlaying: false });
      } else {
        try {
          await audio.play();
          handleAudioStateUpdate(message.message_id, { isPlaying: true });
        } catch (err) {
          console.error("Erro ao reproduzir áudio:", err);
          handleAudioStateUpdate(message.message_id, { isPlaying: false });
        }
      }
      return;
    }

    audio.pause();
    audio.src = message.audio_url;
    audio.currentTime = 0;
    setActiveAudioId(message.message_id);
    handleAudioStateUpdate(message.message_id, {
      currentTime: 0,
      duration: currentState.duration,
      isPlaying: true,
    });

    try {
      await audio.play();
    } catch (err) {
      console.error("Erro ao reproduzir áudio:", err);
      handleAudioStateUpdate(message.message_id, { isPlaying: false });
    }
  };

  const handleSeek = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    message: WhatsappMessage
  ) => {
    if (!message.audio_url) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (activeAudioId && activeAudioId !== message.message_id) {
      handleAudioStateUpdate(activeAudioId, { isPlaying: false });
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = Math.min(Math.max(clickX / rect.width, 0), 1);
    const knownDuration =
      (audioStates[message.message_id]?.duration ?? 0) ||
      (audio.src === message.audio_url ? audio.duration : 0);

    if (audio.src !== message.audio_url) {
      audio.src = message.audio_url;
      setActiveAudioId(message.message_id);
      handleAudioStateUpdate(message.message_id, { isPlaying: false });
    }

    if (!knownDuration || Number.isNaN(knownDuration)) return;

    const newTime = knownDuration * percentage;
    audio.currentTime = newTime;
    handleAudioStateUpdate(message.message_id, { currentTime: newTime });
  };

  const handleAudioMetadata = () => {
    const audio = audioRef.current;
    if (!audio || !activeAudioId) return;
    handleAudioStateUpdate(activeAudioId, { duration: audio.duration });
  };

  const handleAudioTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio || !activeAudioId) return;
    handleAudioStateUpdate(activeAudioId, {
      currentTime: audio.currentTime,
      duration: audio.duration,
      isPlaying: !audio.paused,
    });
  };

  const handleAudioEnded = () => {
    if (!activeAudioId) return;
    handleAudioStateUpdate(activeAudioId, { currentTime: 0, isPlaying: false });
    setActiveAudioId(null);
  };

  const renderAudioAttachment = (message: WhatsappMessage) => {
    if (!message.audio_url) return null;

    const audioState = audioStates[message.message_id] ?? {
      currentTime: 0,
      duration: 0,
      isPlaying: false,
    };

    const progress = audioState.duration
      ? Math.min((audioState.currentTime / audioState.duration) * 100, 100)
      : 0;

    const isActive = activeAudioId === message.message_id;
    const transcription =
      message.audio_transcripiton?.trim() || message.audio_transcription?.trim();

    return (
      <div
        key={`${message.message_id}-audio`}
        className="mt-2 rounded-md bg-background/70 p-3"
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handlePlayPause(message)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition hover:bg-primary/20"
          >
            {audioState.isPlaying && isActive ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>

          <div className="flex flex-1 items-center gap-3">
            <div
              className="relative h-2 flex-1 cursor-pointer rounded-full bg-muted"
              onClick={(event) => handleSeek(event, message)}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-primary"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="w-14 text-right text-xs text-muted-foreground">
              {`${formatSeconds(audioState.currentTime)} / ${formatSeconds(audioState.duration)}`}
            </span>
          </div>
        </div>
        {transcription && (
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">
            {transcription}
          </p>
        )}
      </div>
    );
  };

  const renderAttachments = (message: WhatsappMessage) => {
    const attachments: JSX.Element[] = [];

    if (message.image_url) {
      attachments.push(
        <img
          key={`${message.message_id}-image`}
          src={message.image_url}
          alt="Imagem"
          className="mt-2 max-h-64 w-full cursor-pointer rounded-md object-cover"
          onClick={() => setExpandedMedia({ url: message.image_url!, type: "image" })}
        />
      );
    }

    if (message.video_url) {
      attachments.push(
        <video
          key={`${message.message_id}-video`}
          src={message.video_url}
          className="mt-2 w-full cursor-pointer rounded-md"
          onClick={() => setExpandedMedia({ url: message.video_url!, type: "video" })}
        />
      );
    }

    if (message.audio_url) {
      const audioAttachment = renderAudioAttachment(message);
      if (audioAttachment) attachments.push(audioAttachment);
    }

    if (message.document_url) {
      attachments.push(
        <a
          key={`${message.message_id}-document`}
          href={message.document_url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-2 rounded-md bg-background/70 px-3 py-2 text-sm font-medium underline"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="m15 2 7 7-7-7Z" />
            <path d="M15 2v7h7" />
            <path d="M18 14v7H3V3h7" />
          </svg>
          Documento
        </a>
      );
    }

    return attachments;
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
      // Type guard for ChatMessage properties
      const isChatMsg = (msg: WhatsappMessage | undefined): msg is ChatMessage => 
        msg?.source === "chat";
      
      const chatBase = isChatMsg(baseMessage) ? baseMessage : undefined;
      
      const newRecord: ChatMessage = {
        chat_id: chatBase?.chat_id || selectedChat || crypto.randomUUID(),
        message_id: crypto.randomUUID(),
        numero_wpp: chatBase?.numero_wpp || null,
        chat_name: chatBase?.chat_name || "Chat sem nome",
        direcao: "SENT",
        foto_contato: chatBase?.foto_contato || null,
        encaminhado: chatBase?.encaminhado ?? false,
        is_group: chatBase?.is_group ?? false,
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
            content_type: "Texto",
          }),
        });
      } catch (err) {
        console.error(err);
        toast.warning("Mensagem enviada, mas o webhook não pôde ser acionado.");
      }
    }
  };

  const getContentTypeLabel = (type: "image" | "video" | "audio" | "document" | "text") => {
    switch (type) {
      case "image": return "Foto";
      case "video": return "Vídeo";
      case "audio": return "Áudio";
      case "document": return "Documento";
      default: return "Texto";
    }
  };

  const handleFileSelect = (file: File, type: "image" | "video" | "audio" | "document") => {
    let preview: string | undefined;
    if (type === "image" || type === "video") {
      preview = URL.createObjectURL(file);
    }
    setSelectedFile({ file, type, preview });
  };

  const clearSelectedFile = () => {
    if (selectedFile?.preview) {
      URL.revokeObjectURL(selectedFile.preview);
    }
    setSelectedFile(null);
  };

  const handleSendFile = async () => {
    if (!selectedFile || !selectedChat || !selectedChatSource) {
      toast.error("Selecione um arquivo e uma conversa.");
      return;
    }

    setUploadingFile(true);

    try {
      const { file, type } = selectedFile;
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${selectedChat}/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("whatsapp")
        .upload(filePath, file);

      if (uploadError) {
        toast.error("Erro ao fazer upload do arquivo.", { description: uploadError.message });
        setUploadingFile(false);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from("whatsapp").getPublicUrl(filePath);
      const fileUrl = urlData.publicUrl;

      const formattedContent = `*#${senderName}:*\n[${getContentTypeLabel(type)}]`;
      const baseMessage = replyTo || currentMessages[currentMessages.length - 1];
      const targetSource = selectedChatSource;
      let sentMessage: WhatsappMessage | null = null;

      // Build message record with file URL
      const fileFields = {
        image_url: type === "image" ? fileUrl : null,
        video_url: type === "video" ? fileUrl : null,
        audio_url: type === "audio" ? fileUrl : null,
        document_url: type === "document" ? fileUrl : null,
      };

      if (targetSource === "group") {
        const groupInfo = chats.find(
          (chat) => chat.id === selectedChat && chat.source === "group"
        );

        const newRecord: GroupMessage = {
          group_id: selectedChat,
          group_name: groupInfo?.name || "Grupo sem nome",
          group_photo: groupInfo?.photo || null,
          is_group: true,
          is_edited: false,
          nome_wpp: senderName,
          sender_phone: null,
          message_id: crypto.randomUUID(),
          message: formattedContent,
          ...fileFields,
          direcao: "SENT",
          encaminhada: false,
          created_at: new Date().toISOString(),
          source: "group",
        };

        const { source, ...recordToInsert } = newRecord;
        const { error } = await supabase.from("group_messages").insert(recordToInsert);

        if (error) {
          toast.error("Não foi possível enviar o arquivo.");
          setUploadingFile(false);
          return;
        }

        sentMessage = newRecord;
        setMessages((prev) => [...prev, newRecord]);
      } else {
        const isChatMsg = (msg: WhatsappMessage | undefined): msg is ChatMessage =>
          msg?.source === "chat";
        const chatBase = isChatMsg(baseMessage) ? baseMessage : undefined;

        const newRecord: ChatMessage = {
          chat_id: selectedChat,
          message_id: crypto.randomUUID(),
          numero_wpp: chatBase?.numero_wpp || null,
          chat_name: chatBase?.chat_name || "Chat sem nome",
          direcao: "SENT",
          foto_contato: chatBase?.foto_contato || null,
          encaminhado: false,
          is_group: false,
          is_edited: false,
          message: formattedContent,
          ...fileFields,
          reference_message_id: replyTo?.message_id || null,
          created_at: new Date().toISOString(),
          source: "chat",
        };

        const { source, ...recordToInsert } = newRecord;
        const { error } = await supabase.from("chat_messages").insert(recordToInsert);

        if (error) {
          toast.error("Não foi possível enviar o arquivo.");
          setUploadingFile(false);
          return;
        }

        sentMessage = newRecord;
        setMessages((prev) => [...prev, newRecord]);
      }

      clearSelectedFile();
      setReplyTo(null);
      toast.success("Arquivo enviado com sucesso!");

      // Trigger webhook with content type
      if (webhookUrl && sentMessage) {
        try {
          const { source, ...rest } = sentMessage;
          await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reply: replyTo ? (() => { const { source, ...r } = replyTo; return r; })() : null,
              message: rest,
              content_type: getContentTypeLabel(type),
              file_info: {
                url: fileUrl,
                name: file.name,
                size: file.size,
                type: file.type,
              },
            }),
          });
        } catch (err) {
          console.error(err);
          toast.warning("Arquivo enviado, mas o webhook não pôde ser acionado.");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar arquivo.");
    } finally {
      setUploadingFile(false);
    }
  };

  const selectedChatData = useMemo(() => {
    return chats.find((chat) => chat.id === selectedChat && chat.source === selectedChatSource);
  }, [chats, selectedChat, selectedChatSource]);

  const handleDeleteConversation = async () => {
    if (!selectedChatData) return;

    const confirmation = window.confirm(
      "Deseja realmente excluir toda a conversa? Todas as mensagens serão removidas permanentemente."
    );

    if (!confirmation) return;

    const chatKey = `${selectedChatData.source}:${selectedChatData.id}`;

    if (selectedChatData.source === "group") {
      const { error } = await supabase.from("group_messages").delete().eq("group_id", selectedChatData.id);

      if (error) {
        toast.error("Não foi possível excluir a conversa.", { description: error.message });
        return;
      }
    } else {
      const { error } = await supabase.from("chat_messages").delete().eq("chat_id", selectedChatData.id);

      if (error) {
        toast.error("Não foi possível excluir a conversa.", { description: error.message });
        return;
      }
    }

    setMessages((prev) => prev.filter((message) => {
      const id = message.source === "group" ? message.group_id : message.chat_id;
      return `${message.source}:${id}` !== chatKey;
    }));

    setArchivedChatKeys((prev) => {
      const next = prev.filter((key) => key !== chatKey);
      localStorage.setItem("whatsapp-archived-chats", JSON.stringify(next));
      return next;
    });

    setSelectedChat(null);
    setSelectedChatSource(null);
    setSelectedMessageIds([]);
    setIsSelectingMessages(false);
    toast.success("Conversa excluída com sucesso.");
  };

  const handleSelectMessages = () => {
    if (!selectedChat) {
      toast.error("Selecione uma conversa para escolher mensagens.");
      return;
    }

    setSelectedMessageIds([]);
    setIsSelectingMessages(true);
  };

  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessageIds((prev) =>
      prev.includes(messageId) ? prev.filter((id) => id !== messageId) : [...prev, messageId]
    );
  };

  const clearSelection = () => {
    setIsSelectingMessages(false);
    setSelectedMessageIds([]);
  };

  const handleDeleteSelectedMessages = async () => {
    if (selectedMessageIds.length === 0) return;

    const confirmation = window.confirm("Tem certeza que deseja excluir as mensagens selecionadas?");
    if (!confirmation) return;

    const selectedMessagesForChat = currentMessages.filter(
      (message) => selectedMessageIds.includes(message.message_id) && message.source === "chat"
    );
    const selectedMessagesForGroup = currentMessages.filter(
      (message) => selectedMessageIds.includes(message.message_id) && message.source === "group"
    );

    if (selectedMessagesForChat.length > 0) {
      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .in(
          "message_id",
          selectedMessagesForChat.map((message) => message.message_id)
        );

      if (error) {
        toast.error("Não foi possível excluir algumas mensagens.", { description: error.message });
        return;
      }
    }

    if (selectedMessagesForGroup.length > 0) {
      const { error } = await supabase
        .from("group_messages")
        .delete()
        .in(
          "message_id",
          selectedMessagesForGroup.map((message) => message.message_id)
        );

      if (error) {
        toast.error("Não foi possível excluir algumas mensagens.", { description: error.message });
        return;
      }
    }

    setMessages((prev) => prev.filter((message) => !selectedMessageIds.includes(message.message_id)));
    clearSelection();
    toast.success("Mensagens excluídas com sucesso.");
  };

  const handleForwardSelectedMessages = async () => {
    if (selectedMessageIds.length === 0) return;

    const targetChatId = window.prompt("Informe o ID ou número do chat para encaminhar as mensagens:");
    if (!targetChatId) return;

    const targetChatName =
      window.prompt("Informe o nome do chat/contato de destino (opcional):") || "Chat encaminhado";

    const messagesToForward = currentMessages.filter((message) => selectedMessageIds.includes(message.message_id));

    const recordsToInsert = messagesToForward.map((message, index) => {
      const createdAt = new Date();
      createdAt.setMilliseconds(createdAt.getMilliseconds() + index);

      return {
        chat_id: targetChatId,
        message_id: crypto.randomUUID(),
        numero_wpp: null,
        chat_name: targetChatName,
        direcao: "SENT",
        foto_contato: null,
        encaminhado: true,
        is_group: false,
        is_edited: false,
        message: `*Encaminhado*:\n${message.message ?? "[Mensagem sem texto]"}`,
        reference_message_id: message.message_id,
        created_at: createdAt.toISOString(),
        source: "chat" as const,
      } satisfies ChatMessage & { source: "chat" };
    });

    const { error } = await supabase.from("chat_messages").insert(recordsToInsert.map(({ source, ...record }) => record));

    if (error) {
      toast.error("Não foi possível encaminhar as mensagens.", { description: error.message });
      return;
    }

    setMessages((prev) => [...prev, ...recordsToInsert]);
    toast.success("Mensagens encaminhadas com sucesso.");
    clearSelection();
  };

  const handleArchiveChat = () => {
    if (!selectedChatData) return;

    const chatKey = `${selectedChatData.source}:${selectedChatData.id}`;
    const isCurrentlyArchived = archivedChatKeys.includes(chatKey);

    setArchivedChatKeys((prev) => {
      const next = prev.includes(chatKey) ? prev.filter((key) => key !== chatKey) : [...prev, chatKey];
      localStorage.setItem("whatsapp-archived-chats", JSON.stringify(next));
      return next;
    });

    toast.success(isCurrentlyArchived ? "Chat desarquivado." : "Chat arquivado.");
  };

  return (
    <>
      <audio
        ref={audioRef}
        className="hidden"
        onTimeUpdate={handleAudioTimeUpdate}
        onLoadedMetadata={handleAudioMetadata}
        onEnded={handleAudioEnded}
        onPause={() => {
          if (activeAudioId) handleAudioStateUpdate(activeAudioId, { isPlaying: false });
        }}
      />
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
                          {chat.archived && <Badge variant="outline">Arquivado</Badge>}
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
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{selectedChatData?.name}</p>
                      {selectedChatData?.archived && <Badge variant="outline">Arquivado</Badge>}
                    </div>
                    {selectedChatData?.isGroup && (
                      <p className="text-xs text-muted-foreground">Grupo</p>
                    )}
                  </div>
                  <div className="ml-auto">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                          <MoreVertical className="h-5 w-5" />
                          <span className="sr-only">Abrir menu do chat</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuLabel>Ações do chat</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={handleDeleteConversation} className="gap-2">
                          <Trash2 className="h-4 w-4" />
                          <span>Excluir conversa</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={handleSelectMessages} className="gap-2">
                          <CheckSquare className="h-4 w-4" />
                          <span>Selecionar Mensagens</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={handleSelectMessages} className="gap-2">
                          <Forward className="h-4 w-4" />
                          <span>Encaminhar mensagens</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={handleArchiveChat} className="gap-2">
                          <Archive className="h-4 w-4" />
                          <span>{selectedChatData?.archived ? "Desarquivar chat" : "Arquivar chat"}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {isSelectingMessages && (
                  <div className="flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-3 text-sm">
                    <p className="font-semibold">
                      {selectedMessageIds.length} mensagem{selectedMessageIds.length === 1 ? "" : "s"} selecionada{selectedMessageIds.length === 1 ? "" : "s"}
                    </p>
                    <div className="ml-auto flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleForwardSelectedMessages} disabled={selectedMessageIds.length === 0}>
                        <Forward className="mr-2 h-4 w-4" /> Encaminhar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={handleDeleteSelectedMessages} disabled={selectedMessageIds.length === 0}>
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </Button>
                      <Button variant="ghost" size="sm" onClick={clearSelection}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Mensagens */}
                <ScrollArea className="flex-1 bg-muted/20 p-4">
                  <div className="space-y-3">
                    {currentMessages.map((message, index) => {
                      const attachments = renderAttachments(message);
                      const previousMessage = currentMessages[index - 1];
                      const currentDateLabel = formatDateLabel(message.created_at);
                      const previousDateLabel = formatDateLabel(previousMessage?.created_at);
                      const showDateSeparator = index === 0 || currentDateLabel !== previousDateLabel;
                      const isSelected = selectedMessageIds.includes(message.message_id);

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
                            onClick={() => isSelectingMessages && toggleMessageSelection(message.message_id)}
                          >
                            {isSelectingMessages && (
                              <div className="mr-2 flex items-start pt-1">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleMessageSelection(message.message_id)}
                                  aria-label={`Selecionar mensagem ${index + 1}`}
                                />
                              </div>
                            )}
                            <div
                              className={`max-w-[65%] rounded-lg px-3 py-2 shadow-sm ${
                                message.direcao === "SENT"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-background border border-border"
                              } ${isSelected ? "ring-2 ring-primary" : ""}`}
                            >
                              {message.source === "group" && "nome_wpp" in message && message.nome_wpp && (
                                <p className="mb-1 text-[11px] font-semibold opacity-80">{message.nome_wpp}</p>
                              )}
                              {message.message && (
                                <p className="whitespace-pre-wrap text-sm">{message.message}</p>
                              )}
                              {attachments.length > 0 && (
                                <div className="space-y-2">{attachments}</div>
                              )}
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
                  {/* Selected file preview */}
                  {selectedFile && (
                    <div className="mb-2 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-2">
                      {selectedFile.type === "image" && selectedFile.preview && (
                        <img src={selectedFile.preview} alt="Preview" className="h-16 w-16 rounded object-cover" />
                      )}
                      {selectedFile.type === "video" && selectedFile.preview && (
                        <video src={selectedFile.preview} className="h-16 w-16 rounded object-cover" />
                      )}
                      {selectedFile.type === "audio" && (
                        <div className="flex h-16 w-16 items-center justify-center rounded bg-muted">
                          <Mic className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      {selectedFile.type === "document" && (
                        <div className="flex h-16 w-16 items-center justify-center rounded bg-muted">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{selectedFile.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.file.size / 1024).toFixed(1)} KB • {getContentTypeLabel(selectedFile.type)}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={clearSelectedFile}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {/* Hidden file inputs */}
                    <input
                      type="file"
                      ref={imageInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file, "image");
                        e.target.value = "";
                      }}
                    />
                    <input
                      type="file"
                      ref={videoInputRef}
                      className="hidden"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file, "video");
                        e.target.value = "";
                      }}
                    />
                    <input
                      type="file"
                      ref={audioInputRef}
                      className="hidden"
                      accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file, "audio");
                        e.target.value = "";
                      }}
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file, "document");
                        e.target.value = "";
                      }}
                    />

                    {/* Attachment popover */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <Paperclip className="h-5 w-5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2" align="start">
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            className="justify-start gap-2"
                            onClick={() => imageInputRef.current?.click()}
                          >
                            <Image className="h-4 w-4" />
                            Foto
                          </Button>
                          <Button
                            variant="ghost"
                            className="justify-start gap-2"
                            onClick={() => videoInputRef.current?.click()}
                          >
                            <Video className="h-4 w-4" />
                            Vídeo
                          </Button>
                          <Button
                            variant="ghost"
                            className="justify-start gap-2"
                            onClick={() => audioInputRef.current?.click()}
                          >
                            <Mic className="h-4 w-4" />
                            Áudio
                          </Button>
                          <Button
                            variant="ghost"
                            className="justify-start gap-2"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <FileText className="h-4 w-4" />
                            Documento
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>

                    <Input
                      placeholder="Digite uma mensagem"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (selectedFile) {
                            handleSendFile();
                          } else {
                            handleSend();
                          }
                        }
                      }}
                      className="flex-1"
                      disabled={uploadingFile}
                    />
                    <Button 
                      onClick={selectedFile ? handleSendFile : handleSend} 
                      size="icon" 
                      className="shrink-0"
                      disabled={uploadingFile}
                    >
                      {uploadingFile ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
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
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      </Layout>

      {expandedMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setExpandedMedia(null)}
        >
          <div
            className="relative h-full w-full max-h-[90vh] max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="absolute right-3 top-3 flex gap-2">
              <a
                href={expandedMedia.url}
                download
                target="_blank"
                rel="noreferrer"
                className="rounded-md bg-white/90 px-3 py-2 text-sm font-semibold text-gray-900 shadow hover:bg-white"
              >
                Baixar
              </a>
              <button
                type="button"
                className="rounded-md bg-white/90 px-3 py-2 text-sm font-semibold text-gray-900 shadow hover:bg-white"
                onClick={() => setExpandedMedia(null)}
              >
                ✕
              </button>
            </div>

            {expandedMedia.type === "image" ? (
              <img
                src={expandedMedia.url}
                alt="Imagem"
                className="h-full w-full object-contain"
              />
            ) : (
              <video
                src={expandedMedia.url}
                controls
                autoPlay
                className="h-full w-full object-contain"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
