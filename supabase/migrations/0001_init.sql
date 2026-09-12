-- Schéma initial : cours, questions, tentatives, appels IA.
-- Accès anonyme par session (pas de compte en V1, cf. décision "session anonyme sans
-- compte pendant la phase de test"). RLS verrouillée par défaut : toute lecture/écriture
-- passera par le serveur avec la clé secrète (qui contourne RLS), jamais par la
-- publishable/anon key exposée au navigateur.

create extension if not exists "pgcrypto";

-- ---------- Cours ----------

create table courses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  matiere text not null,
  niveau text not null,
  texte_original text not null,
  texte_fige text not null, -- version figée (canonicalize + freeze) : référence pour les citations
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

create index courses_session_id_idx on courses (session_id);
create index courses_expires_at_idx on courses (expires_at); -- pour le nettoyage automatique

-- ---------- Questions ----------

create type question_type as enum ('ouverte', 'qcm', 'vrai_faux');
create type contenu_nature as enum ('vocabulaire', 'date', 'notion');

create table questions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses (id) on delete cascade,
  question text not null,
  reponse_attendue text not null,
  source text not null,        -- passage cité mot pour mot
  source_start int not null,   -- position dans texte_fige, en caractères (cf. lib/citations/locate.ts)
  source_end int not null,
  difficulte text not null,
  type question_type not null default 'ouverte',
  nature_contenu contenu_nature not null,
  created_at timestamptz not null default now(),
  -- Décision produit : QCM et vrai/faux réservés au vocabulaire et aux dates.
  constraint qcm_seulement_vocab_ou_date check (
    type = 'ouverte' or nature_contenu in ('vocabulaire', 'date')
  )
);

create index questions_course_id_idx on questions (course_id);

-- ---------- Tentatives ----------

create table attempts (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions (id) on delete cascade,
  session_id uuid not null,
  reponse_eleve text not null,
  verdict text not null check (verdict in ('su', 'approximatif', 'non_su')),
  explication text not null,
  attempt_number smallint not null default 1 check (attempt_number in (1, 2)),
  previous_attempt text,
  -- Décision : un 2e essai réussi compte "difficile" pour la répétition espacée FSRS,
  -- pas "bien" — l'élève a eu besoin d'une indication.
  fsrs_difficile boolean not null default false,
  prediction_avant_quiz text, -- ce que l'élève pensait savoir, avant de répondre
  created_at timestamptz not null default now()
);

create index attempts_question_id_idx on attempts (question_id);
create index attempts_session_id_idx on attempts (session_id);

-- ---------- Appels IA (coût réel) ----------

create table ai_calls (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses (id) on delete set null,
  attempt_id uuid references attempts (id) on delete set null,
  use text not null, -- extraction | generation | groundingJudge | grading (cf. lib/ai/models.ts)
  model text not null,
  input_tokens int not null,
  output_tokens int not null,
  cache_creation_input_tokens int not null default 0,
  cache_read_input_tokens int not null default 0,
  cost_usd numeric(10, 6), -- null si le modèle n'est pas dans la grille de prix (cf. lib/ai/usage.ts)
  duration_ms int not null,
  created_at timestamptz not null default now()
);

create index ai_calls_course_id_idx on ai_calls (course_id);

-- ---------- Sécurité ----------
-- RLS activée, aucune policy créée : personne ne peut rien lire ni écrire via la
-- publishable key. Tout passera par des routes serveur utilisant SUPABASE_SECRET_KEY.

alter table courses enable row level security;
alter table questions enable row level security;
alter table attempts enable row level security;
alter table ai_calls enable row level security;

-- Volontairement laissé pour plus tard, pas encore fait ici :
--   - table de suivi des questions rejetées par le juge d'ancrage (pour la règle des 5%)
--   - table de partage parent (token + date de coupure)
--   - vue de calcul du taux de rejet
-- On les ajoutera une fois qu'on aura du vrai usage à observer.
