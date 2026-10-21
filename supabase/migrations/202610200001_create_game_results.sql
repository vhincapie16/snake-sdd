-- KAN-5 / T059: resultados inmutables; acceso exclusivo desde el servidor.
CREATE TABLE public.game_results (
  game_id uuid NOT NULL PRIMARY KEY,
  alias varchar(20) NOT NULL CHECK (char_length(alias) BETWEEN 1 AND 20),
  score integer NOT NULL CHECK (score >= 0 AND score % 10 = 0),
  achieved_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX game_results_ranking_idx
  ON public.game_results (score DESC, achieved_at ASC, game_id ASC);

ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.game_results FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT ON TABLE public.game_results TO service_role;
