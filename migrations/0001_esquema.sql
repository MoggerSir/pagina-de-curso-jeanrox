-- Esquema de la plataforma. Normalizado hasta 3FN: cada atributo depende de la
-- clave, de toda la clave y de nada más que la clave.
--
-- Decisiones que explican la forma:
--   · El correo no es un campo del cliente sino una entidad aparte, porque una
--     persona puede cambiarlo o tener varios y el histórico de compras no debe
--     romperse por eso.
--   · El pago y el acceso son tablas distintas: un acceso puede concederse a
--     mano (regalo, reposición) sin inventar un pago falso.
--   · El producto es catálogo, no un literal repetido en cada fila.

PRAGMA foreign_keys = ON;

-- ── Identidad ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customers (
	id TEXT PRIMARY KEY,
	display_name TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- La dirección se guarda ya normalizada en minúsculas para que la unicidad sea
-- real: Correo@X.com y correo@x.com son la misma persona.
CREATE TABLE IF NOT EXISTS customer_emails (
	id TEXT PRIMARY KEY,
	customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
	address TEXT NOT NULL UNIQUE,
	is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
	verified_at TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_emails_customer ON customer_emails (customer_id);

-- ── Catálogo y contenido ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
	sku TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	-- 0: basta con verificar el correo. 1: además exige compra.
	requires_purchase INTEGER NOT NULL DEFAULT 1 CHECK (requires_purchase IN (0, 1))
);

CREATE TABLE IF NOT EXISTS chapters (
	slug TEXT PRIMARY KEY,
	product_sku TEXT NOT NULL REFERENCES products(sku) ON DELETE CASCADE,
	position INTEGER NOT NULL,
	title TEXT NOT NULL,
	UNIQUE (product_sku, position)
);

CREATE TABLE IF NOT EXISTS chapter_blocks (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	chapter_slug TEXT NOT NULL REFERENCES chapters(slug) ON DELETE CASCADE,
	position INTEGER NOT NULL,
	kind TEXT NOT NULL CHECK (kind IN ('heading', 'paragraph', 'list')),
	text TEXT NOT NULL,
	UNIQUE (chapter_slug, position)
);

-- ── Dinero y acceso ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payments (
	id TEXT PRIMARY KEY,
	customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
	product_sku TEXT NOT NULL REFERENCES products(sku) ON DELETE RESTRICT,
	provider TEXT NOT NULL,
	provider_ref TEXT NOT NULL,
	amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
	currency TEXT NOT NULL,
	status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'refunded', 'denied')),
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	-- El webhook puede repetirse: la misma referencia no debe cobrar dos veces.
	UNIQUE (provider, provider_ref)
);

CREATE TABLE IF NOT EXISTS access_grants (
	id TEXT PRIMARY KEY,
	customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
	product_sku TEXT NOT NULL REFERENCES products(sku) ON DELETE CASCADE,
	payment_id TEXT REFERENCES payments(id) ON DELETE SET NULL,
	source TEXT NOT NULL CHECK (source IN ('payment', 'manual', 'free')),
	granted_at TEXT NOT NULL DEFAULT (datetime('now')),
	revoked_at TEXT,
	UNIQUE (customer_id, product_sku)
);

CREATE INDEX IF NOT EXISTS idx_grants_customer ON access_grants (customer_id);

-- ── Inicio de sesión por correo ──────────────────────────────────────────────

-- El token nunca se guarda en claro: si alguien lee la base, no puede entrar
-- con lo que encuentre. Se almacena su SHA-256 y se compara el hash.
CREATE TABLE IF NOT EXISTS login_tokens (
	id TEXT PRIMARY KEY,
	email_id TEXT NOT NULL REFERENCES customer_emails(id) ON DELETE CASCADE,
	token_hash TEXT NOT NULL UNIQUE,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	expires_at TEXT NOT NULL,
	consumed_at TEXT,
	attempts INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_tokens_email ON login_tokens (email_id, created_at);

-- Peticiones de enlace, guardadas por hash de dirección: sirve para frenar el
-- envío masivo sin conservar en claro correos de gente que quizá ni existe.
CREATE TABLE IF NOT EXISTS login_requests (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	address_hash TEXT NOT NULL,
	requested_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_requests_hash_time ON login_requests (address_hash, requested_at);

CREATE TABLE IF NOT EXISTS sessions (
	id TEXT PRIMARY KEY,
	customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	expires_at TEXT NOT NULL,
	last_seen_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_customer ON sessions (customer_id);

-- ── Auditoría de lectura ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reading_log (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
	chapter_slug TEXT NOT NULL,
	read_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reading_customer_time ON reading_log (customer_id, read_at);

-- ── Catálogo inicial ─────────────────────────────────────────────────────────

INSERT INTO products (sku, name, requires_purchase) VALUES
	('guia-gratuita', 'Guía inicial gratuita', 0),
	('guia-premium', 'Guía completa', 1)
ON CONFLICT (sku) DO NOTHING;
