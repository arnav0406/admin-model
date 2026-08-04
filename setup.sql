--
-- PostgreSQL database dump
--

-- Dumped from database version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_owner_id_fkey;
ALTER TABLE IF EXISTS ONLY public.documents DROP CONSTRAINT IF EXISTS documents_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.documents DROP CONSTRAINT IF EXISTS documents_reviewed_by_fkey;
ALTER TABLE IF EXISTS ONLY public.documents DROP CONSTRAINT IF EXISTS documents_owner_id_fkey;
DROP INDEX IF EXISTS public.idx_documents_user;
DROP INDEX IF EXISTS public.idx_documents_uploaded;
DROP INDEX IF EXISTS public.idx_documents_status;
DROP INDEX IF EXISTS public.idx_documents_owner;
DROP INDEX IF EXISTS public.idx_documents_fts;
DROP INDEX IF EXISTS public.idx_documents_category;
DROP INDEX IF EXISTS public.idx_audit_logs_created_at;
DROP INDEX IF EXISTS public.idx_audit_logs_actor;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.documents DROP CONSTRAINT IF EXISTS documents_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.admin_accounts DROP CONSTRAINT IF EXISTS admin_accounts_pkey;
ALTER TABLE IF EXISTS ONLY public.admin_accounts DROP CONSTRAINT IF EXISTS admin_accounts_email_key;
ALTER TABLE IF EXISTS ONLY public.accounts DROP CONSTRAINT IF EXISTS accounts_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts DROP CONSTRAINT IF EXISTS accounts_email_key;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.audit_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.admin_accounts ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.accounts ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.documents;
DROP SEQUENCE IF EXISTS public.audit_logs_id_seq;
DROP TABLE IF EXISTS public.audit_logs;
DROP SEQUENCE IF EXISTS public.admin_accounts_id_seq;
DROP TABLE IF EXISTS public.admin_accounts;
DROP SEQUENCE IF EXISTS public.accounts_id_seq;
DROP TABLE IF EXISTS public.accounts;
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: arnav
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO arnav;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: arnav
--

CREATE TABLE public.accounts (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    display_name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    is_active boolean DEFAULT true
);


ALTER TABLE public.accounts OWNER TO arnav;

--
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: arnav
--

CREATE SEQUENCE public.accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.accounts_id_seq OWNER TO arnav;

--
-- Name: accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: arnav
--

ALTER SEQUENCE public.accounts_id_seq OWNED BY public.accounts.id;


--
-- Name: admin_accounts; Type: TABLE; Schema: public; Owner: arnav
--

CREATE TABLE public.admin_accounts (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    display_name character varying(100) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.admin_accounts OWNER TO arnav;

--
-- Name: admin_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: arnav
--

CREATE SEQUENCE public.admin_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_accounts_id_seq OWNER TO arnav;

--
-- Name: admin_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: arnav
--

ALTER SEQUENCE public.admin_accounts_id_seq OWNED BY public.admin_accounts.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: arnav
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    actor_type character varying(20) NOT NULL,
    actor_id integer NOT NULL,
    action character varying(100) NOT NULL,
    target_type character varying(50),
    target_id integer,
    details text,
    ip_address character varying(45),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.audit_logs OWNER TO arnav;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: arnav
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO arnav;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: arnav
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: documents; Type: TABLE; Schema: public; Owner: arnav
--

CREATE TABLE public.documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id integer NOT NULL,
    user_id integer,
    title character varying(255) NOT NULL,
    description text,
    category character varying(100) DEFAULT 'general'::character varying,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size bigint NOT NULL,
    mime_type character varying(100) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    uploaded_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    reviewed_by integer,
    reviewed_at timestamp with time zone,
    review_note text,
    search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english'::regconfig, (((((COALESCE(title, ''::character varying))::text || ' '::text) || COALESCE(description, ''::text)) || ' '::text) || (COALESCE(category, ''::character varying))::text))) STORED,
    CONSTRAINT documents_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'archived'::character varying])::text[])))
);


ALTER TABLE public.documents OWNER TO arnav;

--
-- Name: users; Type: TABLE; Schema: public; Owner: arnav
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    role character varying(100) DEFAULT ''::character varying,
    department character varying(100) DEFAULT ''::character varying,
    location character varying(100) DEFAULT ''::character varying,
    status character varying(20) DEFAULT 'Active'::character varying,
    bio text DEFAULT ''::text,
    profile_image character varying(255) DEFAULT NULL::character varying,
    phone character varying(20) DEFAULT ''::character varying,
    gender character varying(10) DEFAULT ''::character varying,
    resume_pdf character varying(255) DEFAULT NULL::character varying,
    join_date date,
    linkedin character varying(255) DEFAULT ''::character varying,
    owner_id integer
);


ALTER TABLE public.users OWNER TO arnav;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: arnav
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO arnav;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: arnav
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: accounts id; Type: DEFAULT; Schema: public; Owner: arnav
--

ALTER TABLE ONLY public.accounts ALTER COLUMN id SET DEFAULT nextval('public.accounts_id_seq'::regclass);


--
-- Name: admin_accounts id; Type: DEFAULT; Schema: public; Owner: arnav
--

ALTER TABLE ONLY public.admin_accounts ALTER COLUMN id SET DEFAULT nextval('public.admin_accounts_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: arnav
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: arnav
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: arnav
--

COPY public.accounts (id, email, password_hash, display_name, created_at, is_active) FROM stdin;
1	arnav@test.com	$2b$12$fvWav9WDiY5nLT3j.IUz1uA7hPimNO9NV0F.w.r8qAeI/nTXY.zSq	Arnav	2026-06-04 10:37:51.071122	t
4	bob@test.com	$2b$12$PlodkWEjAhMYeO.dN0wAqus3d2aq79IQE5vMwUKam3U6jMVLwLt4G	Bob	2026-06-04 10:39:17.223377	t
7	admin@eoffice.gov.in	$2b$12$HdOOHNlJYZkFpEOdP7n.eeT22/CBpechCOWXSw4GIwenAINgKj1lK	asr	2026-07-21 20:12:21.205041	t
\.


--
-- Data for Name: admin_accounts; Type: TABLE DATA; Schema: public; Owner: arnav
--

COPY public.admin_accounts (id, email, password_hash, display_name, is_active, created_at) FROM stdin;
1	admin@eoffice.gov.in	$2b$12$6LUVGUF5JF5TRYQD3jgRGOOq0coQQCQ77kKVcDizNCXlabJXKAV1.	System Admin	t	2026-07-14 05:55:29.075204
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: arnav
--

COPY public.audit_logs (id, actor_type, actor_id, action, target_type, target_id, details, ip_address, created_at) FROM stdin;
1	admin	1	admin_login	\N	\N	Admin "System Admin" logged in	127.0.0.1	2026-07-14 05:58:21.394338
2	admin	1	admin_login	\N	\N	Admin "System Admin" logged in	127.0.0.1	2026-07-14 08:28:12.130517
3	admin	1	admin_login	\N	\N	Admin "System Admin" logged in	127.0.0.1	2026-07-22 10:04:16.763662
4	admin	1	admin_login	\N	\N	Admin "System Admin" logged in to Doc CMS	127.0.0.1	2026-07-28 20:33:48.894581
5	admin	1	admin_login	\N	\N	Admin "System Admin" logged in to Doc CMS	127.0.0.1	2026-07-28 20:34:05.386925
6	admin	1	admin_login	\N	\N	Admin "System Admin" logged in to Doc CMS	127.0.0.1	2026-07-28 20:34:45.739983
7	admin	1	admin_login	\N	\N	Admin "System Admin" logged in to Doc CMS	127.0.0.1	2026-07-28 20:34:50.900825
8	admin	1	admin_logout	\N	\N	\N	127.0.0.1	2026-07-28 21:10:44.034256
9	admin	1	admin_login	\N	\N	Admin "System Admin" logged in to Doc CMS	127.0.0.1	2026-07-28 21:12:15.541917
10	admin	1	admin_login	\N	\N	Admin "System Admin" logged in to Doc CMS	127.0.0.1	2026-08-04 04:04:49.106146
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: arnav
--

COPY public.documents (id, owner_id, user_id, title, description, category, file_name, file_path, file_size, mime_type, status, uploaded_at, updated_at, reviewed_by, reviewed_at, review_note) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: arnav
--

COPY public.users (id, name, email, role, department, location, status, bio, profile_image, phone, gender, resume_pdf, join_date, linkedin, owner_id) FROM stdin;
22	John Doe	john@example.com	Developer			Active		\N			\N	\N		1
1	Alice Johnson	alice@company.com	Frontend Developer	Engineering	New York	Active	React specialist with 5 years experience.	\N	555-101-0001	Female	\N	2022-03-15	https://linkedin.com/in/alicejohnson	\N
2	Bob Smith	bob@company.com	Backend Developer	Engineering	San Francisco	Active	Node.js and PostgreSQL expert.	\N	555-101-0002	Male	\N	2021-07-22	https://linkedin.com/in/bobsmith	\N
3	Carol White	carol@company.com	UI Designer	Design	Austin	Remote	Passionate about user experience.	\N	555-101-0003	Female	\N	2023-01-10	https://linkedin.com/in/carolwhite	\N
4	David Brown	david@company.com	Project Manager	Management	Chicago	Active	Agile certified PM.	\N	555-101-0004	Male	\N	2020-11-05	https://linkedin.com/in/davidbrown	\N
5	Eve Davis	eve@company.com	QA Engineer	Engineering	Seattle	On Leave	Automation testing lead.	\N	555-101-0005	Female	\N	2022-08-18	https://linkedin.com/in/evedavis	\N
6	Frank Miller	frank@company.com	DevOps Engineer	Engineering	Denver	Active	CI/CD pipeline specialist.	\N	555-101-0006	Male	\N	2021-04-30	https://linkedin.com/in/frankmiller	\N
7	Bruce Lee	grace@company.com	Data Analyst	Analytics	Boston	Active	Loves turning data into insights.	\N	555-101-0007	Male	\N	2019-06-12	https://linkedin.com/in/brucelee	\N
8	Hank Schrader	hank@company.com	Cop	APD	Albuquerque	Remote		\N	555-101-0008	Male	\N	2020-02-28	https://linkedin.com/in/hankschrader	\N
9	Ivy Martinez	ivy@company.com	HR Manager	Human Resources	Miami	Active	People operations specialist.	\N	555-101-0009	Female	\N	2023-05-14	https://linkedin.com/in/ivymartinez	\N
10	Jack Taylor	jack@company.com	Marketing Lead	Marketing	Los Angeles	Active	Growth hacking enthusiast.	\N	555-101-0010	Male	\N	2022-12-01	https://linkedin.com/in/jacktaylor	\N
11	Karen Thomas	karen@company.com	Content Writer	Marketing	Philadelphia	Active	SEO and blog strategy.	\N	555-101-0011	Female	\N	2021-09-20	https://linkedin.com/in/karenthomas	\N
13	Mona Clark	mona@company.com	Security Analyst	IT	Washington DC	Active	Cybersecurity and compliance.	\N	555-101-0013	Female	\N	2023-03-08	https://linkedin.com/in/monaclark	\N
14	Nick Hall	nick@company.com	Support Lead	Customer Support	Phoenix	On Leave	Customer satisfaction advocate.	\N	555-101-0014	Male	\N	2020-10-15	https://linkedin.com/in/nickhall	\N
15	Olivia 	olivia@company.com	Accountant	Finance	Atlanta	Active	Budget forecasting expert.	\N	555-101-0015	Female	\N	2022-06-25	https://linkedin.com/in/olivia	\N
17	Quinn Wright	quinn@company.com	Recruiter	Human Resources	Minneapolis	Active	Talent acquisition specialist.	\N	555-101-0017	Female	\N	2023-07-01	https://linkedin.com/in/quinnwright	\N
18	Travis Scott	rachel@company.com	CTO	Management	New York	Active	Technology vision and strategy.	\N	555-101-0018	Male	\N	2021-01-18	https://linkedin.com/in/travisscott	\N
19	Arnav Singh	arnavsingh.rathore.24cse@bmu.edu.in	Intern	Development	Delhi	Active		\N	555-101-0019	Male	\N	2024-01-10	https://linkedin.com/in/arnavsingh	\N
20	Jason Duval	jason.duval@gmail.com	Hero	GTA 6	Vice City	Active		\N	555-101-0020	Male	\N	2024-06-15	https://linkedin.com/in/jasonduval	\N
21	Lucia Caminos	lucia.caminos@gmail.com	Heroine	GTA 6	Vice City	Active		/uploads/1780313661053-bunimg.png	555-101-0021	Female	\N	2024-06-15	https://linkedin.com/in/luciacaminos	\N
29	sdsfa	fdfsf@gmail.com	sdfsdf	sdfsdfsd	fsdfsdfsdfdsf	Active		/uploads/1780994954509-ArnavSign (1).jpg	sdfsdf	Male	/uploads/1780997516560-All_Internships_With_Interview_Medium.pdf	\N		6
24	Arnav Singh Rathore	arnavsingh.rathore.24cse@gmail.com	Intern	NIC	Delhi	Active		\N	8542073055	Male	/uploads/1782274940932-Offer Letter (1).pdf	2026-06-01		5
30	Arnav	ashdda@gmail.com	Intern			Active		\N	984832492	Male	\N	\N		5
31	ffghcg	hgxhfgg@gmail.com				Active		\N	57576876	Female	/uploads/1784664791708-compressed-Arnav Singh Rathore_240401_Self Application Form.pdf	\N		7
\.


--
-- Name: accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: arnav
--

SELECT pg_catalog.setval('public.accounts_id_seq', 7, true);


--
-- Name: admin_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: arnav
--

SELECT pg_catalog.setval('public.admin_accounts_id_seq', 1, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: arnav
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 10, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: arnav
--

SELECT pg_catalog.setval('public.users_id_seq', 31, true);


--
-- Name: accounts accounts_email_key; Type: CONSTRAINT; Schema: public; Owner: arnav
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_email_key UNIQUE (email);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: arnav
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: admin_accounts admin_accounts_email_key; Type: CONSTRAINT; Schema: public; Owner: arnav
--

ALTER TABLE ONLY public.admin_accounts
    ADD CONSTRAINT admin_accounts_email_key UNIQUE (email);


--
-- Name: admin_accounts admin_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: arnav
--

ALTER TABLE ONLY public.admin_accounts
    ADD CONSTRAINT admin_accounts_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: arnav
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: arnav
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: arnav
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: arnav
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_logs_actor; Type: INDEX; Schema: public; Owner: arnav
--

CREATE INDEX idx_audit_logs_actor ON public.audit_logs USING btree (actor_type, actor_id);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: arnav
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_documents_category; Type: INDEX; Schema: public; Owner: arnav
--

CREATE INDEX idx_documents_category ON public.documents USING btree (category);


--
-- Name: idx_documents_fts; Type: INDEX; Schema: public; Owner: arnav
--

CREATE INDEX idx_documents_fts ON public.documents USING gin (search_vector);


--
-- Name: idx_documents_owner; Type: INDEX; Schema: public; Owner: arnav
--

CREATE INDEX idx_documents_owner ON public.documents USING btree (owner_id);


--
-- Name: idx_documents_status; Type: INDEX; Schema: public; Owner: arnav
--

CREATE INDEX idx_documents_status ON public.documents USING btree (status);


--
-- Name: idx_documents_uploaded; Type: INDEX; Schema: public; Owner: arnav
--

CREATE INDEX idx_documents_uploaded ON public.documents USING btree (uploaded_at DESC);


--
-- Name: idx_documents_user; Type: INDEX; Schema: public; Owner: arnav
--

CREATE INDEX idx_documents_user ON public.documents USING btree (user_id);


--
-- Name: documents documents_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arnav
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: documents documents_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arnav
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.admin_accounts(id);


--
-- Name: documents documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arnav
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users users_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arnav
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

