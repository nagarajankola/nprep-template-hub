-- NPrep Template Hub — Supabase schema
-- Run this once in your Supabase project: SQL Editor → New query → paste → Run.

create extension if not exists pgcrypto;

create table if not exists templates (
  id            uuid primary key default gen_random_uuid(),
  name          text        not null,
  slug          text        not null unique,
  description   text        not null default '',
  category      text        not null default 'Uncategorized',
  tags          text[]      not null default '{}',
  html          text        not null,                  -- full self-contained HTML (assets inlined)
  size_bytes    integer     not null default 0,
  source        text        not null default 'upload', -- 'upload' | 'import'
  source_path   text,                                  -- original file path if imported
  share_token   text        not null unique,           -- unguessable public link id
  share_enabled boolean     not null default true,     -- false = link revoked
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists templates_updated_idx    on templates (updated_at desc);
create index if not exists templates_share_token_idx on templates (share_token);

-- RLS stays ON. Only the app server (service_role key) touches this table,
-- which bypasses RLS. The browser never talks to Supabase directly.
alter table templates enable row level security;
