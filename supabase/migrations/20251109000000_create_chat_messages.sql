-- Tabela para mensagens do WhatsApp
create table public.chat_messages (
  chat_id text not null,
  message_id text primary key,
  numero_wpp text,
  chat_name text,
  direcao text,
  foto_contato text,
  encaminhado boolean default false,
  is_group boolean default false,
  is_edited boolean default false,
  message text,
  reference_message_id text,
  created_at timestamptz default now()
);

create index idx_chat_messages_chat_id on public.chat_messages (chat_id);
create index idx_chat_messages_created_at on public.chat_messages (created_at desc);
