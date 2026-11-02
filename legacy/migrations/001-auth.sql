CREATE SCHEMA IF NOT EXISTS block8_auth;
CREATE TABLE IF NOT EXISTS block8_auth.users(id serial PRIMARY KEY,email text UNIQUE NOT NULL,name text, password_hash text NOT NULL,role text NOT NULL DEFAULT 'viewer',status text NOT NULL DEFAULT 'pending',email_verified_at timestamptz,version integer NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS block8_auth.activation(user_id integer PRIMARY KEY REFERENCES block8_auth.users(id), hash text NOT NULL,expires_at timestamptz NOT NULL,attempts integer NOT NULL DEFAULT 0,locked_until timestamptz,last_sent_at timestamptz NOT NULL DEFAULT now(),used_at timestamptz);
CREATE TABLE IF NOT EXISTS block8_auth.resets(hash text PRIMARY KEY,user_id integer REFERENCES block8_auth.users(id),expires_at timestamptz NOT NULL,used_at timestamptz);
CREATE TABLE IF NOT EXISTS block8_auth.session(sid varchar PRIMARY KEY,sess json NOT NULL,expire timestamp NOT NULL);
CREATE INDEX IF NOT EXISTS session_expire ON block8_auth.session(expire);
CREATE TABLE IF NOT EXISTS block8_auth.limits(key text PRIMARY KEY,count integer NOT NULL DEFAULT 0,started_at timestamptz NOT NULL DEFAULT now(),locked_until timestamptz);
CREATE TABLE IF NOT EXISTS block8_auth.captcha(id text PRIMARY KEY,sid text NOT NULL,purpose text NOT NULL,hash text NOT NULL,image text NOT NULL,expires_at timestamptz NOT NULL,used_at timestamptz);

-- Safe to rerun against existing Block 8 databases.
ALTER TABLE block8_auth.activation ADD COLUMN IF NOT EXISTS purpose text NOT NULL DEFAULT 'activation';
CREATE TABLE IF NOT EXISTS block8_auth.mail_cooldowns(key text PRIMARY KEY,available_at timestamptz NOT NULL);
