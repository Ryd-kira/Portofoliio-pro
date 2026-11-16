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

-- Contenu modifiable depuis /admin.html
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  category text NOT NULL CHECK (char_length(category) BETWEEN 1 AND 80),
  status text NOT NULL CHECK (status IN ('realise','prototype','en_developpement','conception','concept')),
  summary text NOT NULL CHECK (char_length(summary) BETWEEN 1 AND 600),
  details text[] NOT NULL DEFAULT '{}' CHECK (cardinality(details) <= 6 AND char_length(array_to_string(details, '')) <= 3600),
  technologies text CHECK (technologies IS NULL OR char_length(technologies) <= 200),
  confirmed boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0 CHECK (position BETWEEN 0 AND 9999),
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.skills (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  group_name text NOT NULL CHECK (char_length(group_name) BETWEEN 1 AND 80),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  level text NOT NULL CHECK (char_length(level) BETWEEN 1 AND 80),
  to_clarify boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0 CHECK (position BETWEEN 0 AND 9999),
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.experiences (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  label text NOT NULL CHECK (char_length(label) BETWEEN 1 AND 80),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  description text CHECK (description IS NULL OR char_length(description) <= 600),
  note text CHECK (note IS NULL OR char_length(note) <= 60),
  position integer NOT NULL DEFAULT 0 CHECK (position BETWEEN 0 AND 9999),
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.settings (
  key text PRIMARY KEY CHECK (key IN ('hero_lead','signature','location','about','interests','motto','seeded')),
  value text NOT NULL CHECK (char_length(value) BETWEEN 1 AND 3000),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Rôle applicatif aux droits minimaux (créé via Neon, mot de passe uniquement dans Vercel)
-- portfolio_app : SELECT/INSERT/UPDATE sur messages ; SELECT/INSERT/UPDATE/DELETE sur le reste.
CREATE POLICY app_messages ON public.messages FOR ALL TO portfolio_app USING (true) WITH CHECK (true);
CREATE POLICY app_site_files ON public.site_files FOR ALL TO portfolio_app USING (true) WITH CHECK (true);
CREATE POLICY app_projects ON public.projects FOR ALL TO portfolio_app USING (true) WITH CHECK (true);
CREATE POLICY app_skills ON public.skills FOR ALL TO portfolio_app USING (true) WITH CHECK (true);
CREATE POLICY app_experiences ON public.experiences FOR ALL TO portfolio_app USING (true) WITH CHECK (true);
CREATE POLICY app_settings ON public.settings FOR ALL TO portfolio_app USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects, public.skills, public.experiences, public.settings TO portfolio_app;
REVOKE DELETE ON public.messages FROM portfolio_app;

-- Collaborateurs (photo dans une table séparée pour ne pas alourdir les listes)
CREATE TABLE public.collaborators (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  first_name text NOT NULL CHECK (char_length(first_name) BETWEEN 1 AND 60),
  last_name text NOT NULL CHECK (char_length(last_name) BETWEEN 1 AND 60),
  linkedin_url text CHECK (linkedin_url IS NULL OR (linkedin_url ~ '^https://[^[:space:]]+$' AND char_length(linkedin_url) <= 300)),
  portfolio_url text CHECK (portfolio_url IS NULL OR (portfolio_url ~ '^https://[^[:space:]]+$' AND char_length(portfolio_url) <= 300)),
  github_url text CHECK (github_url IS NULL OR (github_url ~ '^https://[^[:space:]]+$' AND char_length(github_url) <= 300)),
  position integer NOT NULL DEFAULT 0 CHECK (position BETWEEN 0 AND 9999),
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.collaborator_photos (
  collaborator_id uuid PRIMARY KEY REFERENCES public.collaborators(id) ON DELETE CASCADE,
  data bytea NOT NULL CHECK (octet_length(data) BETWEEN 1 AND 500000),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborator_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY app_collaborators ON public.collaborators FOR ALL TO portfolio_app USING (true) WITH CHECK (true);
CREATE POLICY app_collaborator_photos ON public.collaborator_photos FOR ALL TO portfolio_app USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collaborators, public.collaborator_photos TO portfolio_app;

-- Sécurité : sessions administrateur révocables et journal des événements suspects
CREATE TABLE public.admin_sessions (
  token_hash text PRIMARY KEY CHECK (char_length(token_hash) = 64),
  csrf text NOT NULL CHECK (char_length(csrf) BETWEEN 20 AND 64),
  ip_hash text CHECK (ip_hash IS NULL OR char_length(ip_hash) <= 64),
  user_agent text CHECK (user_agent IS NULL OR char_length(user_agent) <= 200),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX admin_sessions_expires_idx ON public.admin_sessions (expires_at);
CREATE TABLE public.security_events (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  at timestamptz NOT NULL DEFAULT now(),
  kind text NOT NULL CHECK (char_length(kind) BETWEEN 1 AND 40),
  ip_hash text CHECK (ip_hash IS NULL OR char_length(ip_hash) <= 64),
  path text CHECK (path IS NULL OR char_length(path) <= 120),
  detail text CHECK (detail IS NULL OR char_length(detail) <= 300)
);
CREATE INDEX security_events_kind_ip_at_idx ON public.security_events (kind, ip_hash, at DESC);
CREATE INDEX security_events_at_idx ON public.security_events (at DESC);
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY app_admin_sessions ON public.admin_sessions FOR ALL TO portfolio_app USING (true) WITH CHECK (true);
CREATE POLICY app_security_events ON public.security_events FOR ALL TO portfolio_app USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_sessions TO portfolio_app;
GRANT SELECT, INSERT, DELETE ON public.security_events TO portfolio_app;
