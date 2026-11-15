-- Schéma appliqué sur Neon (projet « Portofolio-me.db »).
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 120 AND position('@' in email) > 1),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','read','archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_status_created_idx ON public.messages (status, created_at DESC);

CREATE TABLE public.site_files (
  kind text PRIMARY KEY CHECK (kind IN ('photo','cv')),
  content_type text NOT NULL,
  data bytea NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (kind = 'photo' AND content_type = 'image/jpeg' AND octet_length(data) BETWEEN 1 AND 1000000)
    OR (kind = 'cv' AND content_type = 'application/pdf' AND octet_length(data) BETWEEN 1 AND 5000000)
  )
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_files ENABLE ROW LEVEL SECURITY;
