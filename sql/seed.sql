-- ============================================================
-- HiveFive — Seed Data (v2: Demo-Quality Dataset)
-- 1000 users · 2000 services · 5000 orders · 27 colleges
-- Target: MySQL 8.0+ / MariaDB 11+
--
-- SERVICE IMAGES: Each service gets 1 cover image from the stock
-- photo pool at public/services/webp/<Category>_<NN>.webp
-- e.g. Tutoring_01.webp, PetCare_15.webp
-- Photos are distributed round-robin with CRC32 scatter.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
SET time_zone = '+00:00';

-- ------------------------------------------------------------
-- 0) WIPE ALL DATA (TRUNCATEs are DDL — implicit commit)
-- ------------------------------------------------------------
TRUNCATE TABLE review_votes;
TRUNCATE TABLE client_reviews;
TRUNCATE TABLE reviews;
TRUNCATE TABLE notifications;
TRUNCATE TABLE messages;
TRUNCATE TABLE conversations;
TRUNCATE TABLE transactions;
TRUNCATE TABLE orders;
TRUNCATE TABLE proposals;
TRUNCATE TABLE requests;
TRUNCATE TABLE service_images;
TRUNCATE TABLE services;
TRUNCATE TABLE tokens;
TRUNCATE TABLE shop_purchases;
TRUNCATE TABLE reports;
DELETE FROM users WHERE role != 'admin';
TRUNCATE TABLE shop_items;

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- 1) Helper sequence table 1..20000
-- ------------------------------------------------------------
DROP TABLE IF EXISTS seq;
DROP TABLE IF EXISTS fn_pool;
DROP TABLE IF EXISTS ln_pool;
DROP TABLE IF EXISTS uni_pool;
DROP TABLE IF EXISTS major_pool;
DROP TABLE IF EXISTS svc_title_pool;
DROP TABLE IF EXISTS conv_map;

CREATE TABLE seq (n INT PRIMARY KEY);
INSERT INTO seq (n)
SELECT (d5.n*10000 + d4.n*1000 + d3.n*100 + d2.n*10 + d1.n + 1) AS n
FROM (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) d1,
     (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) d2,
     (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) d3,
     (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) d4,
     (SELECT 0 AS n UNION ALL SELECT 1) d5;

START TRANSACTION;

-- ------------------------------------------------------------
-- 2) Temp tables: name pools, universities, majors
-- ------------------------------------------------------------
CREATE TABLE fn_pool (i INT PRIMARY KEY, first_name VARCHAR(30));
INSERT INTO fn_pool VALUES
(1,'Ada'),
(2,'Ahsoka'),
(3,'Alex'),
(4,'Alphonse'),
(5,'Anakin'),
(6,'Anna'),
(7,'Anuel'),
(8,'Aragorn'),
(9,'Ariana'),
(10,'Baby'),
(11,'Bad'),
(12,'Bakugo'),
(13,'Balvin'),
(14,'Barnacle'),
(15,'Beyonce'),
(16,'Bill'),
(17,'Billie'),
(18,'Boy'),
(19,'Brady'),
(20,'Brian'),
(21,'Bruce'),
(22,'Bucky'),
(23,'Bunny'),
(24,'Camila'),
(25,'Cardi'),
(26,'Carlos'),
(27,'Carti'),
(28,'Chad'),
(29,'Charles'),
(30,'Cheems'),
(31,'Chungus'),
(32,'Clint'),
(33,'Cole'),
(34,'Daddy'),
(35,'Dan'),
(36,'Daniel'),
(37,'Dara'),
(38,'Deku'),
(39,'Demi'),
(40,'Destroy'),
(41,'Dirty'),
(42,'Doge'),
(43,'Doja'),
(44,'Drake'),
(45,'Dua'),
(46,'Durk'),
(47,'Dutchman'),
(48,'Edward'),
(49,'Elmo'),
(50,'Elon'),
(51,'Elsa'),
(52,'Eren'),
(53,'Erik'),
(54,'Esteban'),
(55,'Evan'),
(56,'Felipe'),
(57,'Fernando'),
(58,'Flying'),
(59,'Frank'),
(60,'Frodo'),
(61,'Future'),
(62,'Gandalf'),
(63,'Gary'),
(64,'Genos'),
(65,'George'),
(66,'Giga'),
(67,'Gojo'),
(68,'Goku'),
(69,'Grace'),
(70,'Grogu'),
(71,'Gru'),
(72,'Grumpy'),
(73,'Gunna'),
(74,'Gwen'),
(75,'Han'),
(76,'Hank'),
(77,'Harambe'),
(78,'Harry'),
(79,'Herbo'),
(80,'Hermione'),
(81,'J'),
(82,'Jack'),
(83,'Jager'),
(84,'Jam'),
(85,'Jean'),
(86,'Jeff'),
(87,'Jensen'),
(88,'Jubilee'),
(89,'Juice'),
(90,'Justin'),
(91,'Kanye'),
(92,'Karen'),
(93,'Karol'),
(94,'Keef'),
(95,'Ken'),
(96,'Kendrick'),
(97,'Kermit'),
(98,'Kevin'),
(99,'Kimi'),
(100,'Kobe'),
(101,'Kurt'),
(102,'L'),
(103,'Lance'),
(104,'Lando'),
(105,'Larry'),
(106,'LeBron'),
(107,'Leia'),
(108,'Lewis'),
(109,'Light'),
(110,'Lil'),
(111,'Linus'),
(112,'Lisa'),
(113,'Lizzo'),
(114,'Logan'),
(115,'Loki'),
(116,'Lonely'),
(117,'Luffy'),
(118,'Luke'),
(119,'Lunay'),
(120,'Maluma'),
(121,'Man'),
(122,'Mando'),
(123,'Marcus'),
(124,'Marissa'),
(125,'Mark'),
(126,'Masayoshi'),
(127,'Maui'),
(128,'Max'),
(129,'Megan'),
(130,'Mems'),
(131,'Mermaid'),
(132,'Messi'),
(133,'Michael'),
(134,'Mick'),
(135,'Mikasa'),
(136,'Miles'),
(137,'Miley'),
(138,'Minion'),
(139,'Misa'),
(140,'Moana'),
(141,'Morbius'),
(142,'Morty'),
(143,'MrKrabs'),
(144,'MrsPuff'),
(145,'Myke'),
(146,'Naomi'),
(147,'Naruto'),
(148,'Nasr'),
(149,'Natasha'),
(150,'Nicki'),
(151,'Nicky'),
(152,'Nico'),
(153,'Nyan'),
(154,'Nyck'),
(155,'Obi'),
(156,'Ororo'),
(157,'Oscar'),
(158,'Ozuna'),
(159,'Patrick'),
(160,'Pearl'),
(161,'Pepe'),
(162,'Perro'),
(163,'Peter'),
(164,'Pickle'),
(165,'Pierre'),
(166,'Pinhead'),
(167,'Plankton'),
(168,'Polo'),
(169,'Pop'),
(170,'Post'),
(171,'Queres'),
(172,'Rauw'),
(173,'Raven'),
(174,'Raya'),
(175,'Reed'),
(176,'Reid'),
(177,'Remy'),
(178,'Rick'),
(179,'Rihanna'),
(180,'Riza'),
(181,'Ron'),
(182,'Ronaldo'),
(183,'Rosalia'),
(184,'Roy'),
(185,'Ryuk'),
(186,'SZA'),
(187,'Saitama'),
(188,'Sam'),
(189,'Sandy'),
(190,'Satya'),
(191,'Scott'),
(192,'Sebastian'),
(193,'Sech'),
(194,'Selena'),
(195,'Serena'),
(196,'Sergey'),
(197,'Shakira'),
(198,'Shaq'),
(199,'Shawn'),
(200,'Sheryl'),
(201,'Shiba'),
(202,'Shohei'),
(203,'Shrek'),
(204,'Simone'),
(205,'Smitty'),
(206,'SpongeBob'),
(207,'Squidward'),
(208,'Steph'),
(209,'Steve'),
(210,'Stonks'),
(211,'Sundar'),
(212,'Tanjiro'),
(213,'Taylor'),
(214,'Thor'),
(215,'Thug'),
(216,'Tiger'),
(217,'Tim'),
(218,'Tobi'),
(219,'Todoroki'),
(220,'Tony'),
(221,'Travis'),
(222,'Tyler'),
(223,'Usain'),
(224,'Uzi'),
(225,'Vader'),
(226,'Valtteri'),
(227,'Vision'),
(228,'Vitalik'),
(229,'Von'),
(230,'Wade'),
(231,'Walter'),
(232,'Wan'),
(233,'Wanda'),
(234,'Weeknd'),
(235,'Werben'),
(236,'Winry'),
(237,'Wojak'),
(238,'Yankee'),
(239,'Yeat'),
(240,'Yoda'),
(241,'Yuki'),
(242,'Zhou'),
(243,'Zucc');
CREATE TABLE ln_pool (j INT PRIMARY KEY, last_name VARCHAR(30));
INSERT INTO ln_pool VALUES
(1,'Ackerman'),
(2,'Albon'),
(3,'Alonso'),
(4,'Altman'),
(5,'Amane'),
(6,'Astley'),
(7,'Baby'),
(8,'Baggins'),
(9,'Bakugo'),
(10,'Banner'),
(11,'Barnes'),
(12,'Barton'),
(13,'Bezos'),
(14,'Bieber'),
(15,'Biles'),
(16,'Bolt'),
(17,'Bond'),
(18,'Bottas'),
(19,'Brady'),
(20,'Bryant'),
(21,'Bunny'),
(22,'Cabello'),
(23,'Cage'),
(24,'Cat'),
(25,'Cena'),
(26,'Chesky'),
(27,'Cipher'),
(28,'Coin'),
(29,'Cook'),
(30,'Creator'),
(31,'Curry'),
(32,'Cyrus'),
(33,'DaBaby'),
(34,'Darkholme'),
(35,'De Vries'),
(36,'Deckard'),
(37,'Diesel'),
(38,'Dorsey'),
(39,'Durk'),
(40,'Eilish'),
(41,'Ek'),
(42,'Elric'),
(43,'Ericsson'),
(44,'Fenty'),
(45,'Ferg'),
(46,'Freeman'),
(47,'G'),
(48,'Gasly'),
(49,'Gates'),
(50,'Gisele'),
(51,'Gomez'),
(52,'Graham'),
(53,'Grande'),
(54,'Grey'),
(55,'Guanyu'),
(56,'Gucci'),
(57,'Gump'),
(58,'Gunna'),
(59,'Hamilton'),
(60,'Han'),
(61,'Harlow'),
(62,'Hastings'),
(63,'Hattie'),
(64,'Hawkeye'),
(65,'Hobbs'),
(66,'Hoffman'),
(67,'Howlett'),
(68,'Huang'),
(69,'Hulkenberg'),
(70,'Inu'),
(71,'Jackson'),
(72,'Jakob'),
(73,'James'),
(74,'Jobs'),
(75,'Johnson'),
(76,'Jordan'),
(77,'Kalanick'),
(78,'Kenobi'),
(79,'Kent'),
(80,'Khosrowshahi'),
(81,'Knowles'),
(82,'Lamar'),
(83,'Laroi'),
(84,'Laufeyson'),
(85,'Lawliet'),
(86,'LeBeau'),
(87,'Leclerc'),
(88,'Lee'),
(89,'Lehnsherr'),
(90,'Letty'),
(91,'Lipa'),
(92,'Little'),
(93,'Lovato'),
(94,'Lue'),
(95,'Lutke'),
(96,'Magnussen'),
(97,'Malone'),
(98,'Mane'),
(99,'Massa'),
(100,'Maximoff'),
(101,'Mayer'),
(102,'McCoy'),
(103,'Mendes'),
(104,'Mia'),
(105,'Midoriya'),
(106,'Minaj'),
(107,'Monkey'),
(108,'Morales'),
(109,'Mosey'),
(110,'Munroe'),
(111,'Musk'),
(112,'Mustang'),
(113,'Nas'),
(114,'Nav'),
(115,'Nobody'),
(116,'Norris'),
(117,'O''Conner'),
(118,'O''Neal'),
(119,'Ocean'),
(120,'Ocon'),
(121,'Odinson'),
(122,'Ohtani'),
(123,'Ortiz'),
(124,'Osaka'),
(125,'Owen'),
(126,'Parker'),
(127,'Paul'),
(128,'Pearce'),
(129,'Peep'),
(130,'Piastri'),
(131,'Pichai'),
(132,'Potter'),
(133,'Pump'),
(134,'Queenie'),
(135,'Raikkonen'),
(136,'Ramsey'),
(137,'Reeves'),
(138,'Ricch'),
(139,'Ricciardo'),
(140,'Rock'),
(141,'Rockbell'),
(142,'Rocky'),
(143,'Rogers'),
(144,'Roll'),
(145,'Roman'),
(146,'Romanoff'),
(147,'Russell'),
(148,'Sainz'),
(149,'Sandberg'),
(150,'Sargeant'),
(151,'Satoru'),
(152,'Schumacher'),
(153,'Scott'),
(154,'Shaw'),
(155,'Shrek'),
(156,'Skies'),
(157,'Skywalker'),
(158,'Smoke'),
(159,'Son'),
(160,'Spiegel'),
(161,'Stacy'),
(162,'Stallion'),
(163,'Stark'),
(164,'Stonks'),
(165,'Strange'),
(166,'Stroll'),
(167,'Styles'),
(168,'Su'),
(169,'Summers'),
(170,'Swift'),
(171,'Tecca'),
(172,'Tej'),
(173,'Tesfaye'),
(174,'Thiel'),
(175,'Tjay'),
(176,'Todoroki'),
(177,'Toretto'),
(178,'Torvalds'),
(179,'Tsunoda'),
(180,'Uzumaki'),
(181,'Verstappen'),
(182,'Vert'),
(183,'Vettel'),
(184,'Vin'),
(185,'Vision'),
(186,'WRLD'),
(187,'Wagner'),
(188,'Walker'),
(189,'Wayne'),
(190,'West'),
(191,'Wick'),
(192,'Williams'),
(193,'Wilson'),
(194,'Wong'),
(195,'Woods'),
(196,'X'),
(197,'Xan'),
(198,'Xavier'),
(199,'Yagami'),
(200,'Yashar'),
(201,'Yeager'),
(202,'Zuckerberg');

CREATE TABLE uni_pool (bucket INT PRIMARY KEY, domain VARCHAR(50), name VARCHAR(100));
INSERT INTO uni_pool VALUES
(0,'buffalo.edu','University at Buffalo'),(1,'buffalo.edu','University at Buffalo'),
(2,'buffalo.edu','University at Buffalo'),(3,'buffalo.edu','University at Buffalo'),
(4,'stanford.edu','Stanford University'),(5,'mit.edu','Massachusetts Institute of Technology'),
(6,'harvard.edu','Harvard University'),(7,'berkeley.edu','University of California, Berkeley'),
(8,'caltech.edu','California Institute of Technology'),(9,'princeton.edu','Princeton University'),
(10,'yale.edu','Yale University'),(11,'columbia.edu','Columbia University'),
(12,'uchicago.edu','University of Chicago'),(13,'cornell.edu','Cornell University'),
(14,'upenn.edu','University of Pennsylvania'),(15,'umich.edu','University of Michigan'),
(16,'uw.edu','University of Washington'),(17,'utexas.edu','University of Texas at Austin'),
(18,'gatech.edu','Georgia Institute of Technology'),(19,'cmu.edu','Carnegie Mellon University'),
(20,'duke.edu','Duke University'),(21,'nyu.edu','New York University'),
(22,'ucla.edu','University of California, Los Angeles'),(23,'illinois.edu','University of Illinois Urbana-Champaign'),
(24,'ufl.edu','University of Florida'),(25,'osu.edu','Ohio State University'),
(26,'bu.edu','Boston University'),(27,'virginia.edu','University of Virginia'),
(28,'purdue.edu','Purdue University'),(29,'umd.edu','University of Maryland');

CREATE TABLE major_pool (k INT PRIMARY KEY, major VARCHAR(50));
INSERT INTO major_pool VALUES
(0,'Computer Science'),(1,'Electrical Engineering'),(2,'Mechanical Engineering'),
(3,'Business'),(4,'Economics'),(5,'Biology'),
(6,'Psychology'),(7,'Design'),(8,'Mathematics'),
(9,'English'),(10,'Music'),(11,'Media Studies');

-- ------------------------------------------------------------
-- 3) SHOP ITEMS — 30 items (10 frames, 10 badges, 10 themes)
-- Unchanged from v1 cosmetics format
-- ------------------------------------------------------------
INSERT INTO shop_items (type, name, description, price, metadata) VALUES
('frame','Honeycomb Edge','Subtle golden hexagonal border',15.00,
 '{"gradient":"conic-gradient(from 0deg, #F5B540, #E8A317, #D4882A, #E8A317, #F5B540)","glow":"0 0 15px rgba(245,181,64,.35), 0 0 30px rgba(245,181,64,.12)","css_animation":null,"ring_size":4}'),
('frame','Ember Ring','Warm orange-red gradient with deep glow',25.00,
 '{"gradient":"conic-gradient(from 0deg, #E85D3A, #FF7849, #FFA064, #FF7849, #E85D3A)","glow":"0 0 18px rgba(232,93,58,.4), 0 0 38px rgba(255,120,73,.15)","css_animation":null,"ring_size":4}'),
('frame','Ocean Pulse','Animated teal-blue breathing ring',30.00,
 '{"gradient":"conic-gradient(from 180deg, #0EA5E9, #38BDF8, #7DD3FC, #38BDF8, #0EA5E9)","glow":"0 0 18px rgba(14,165,233,.4), 0 0 40px rgba(56,189,248,.18)","css_animation":"frame-pulse","ring_size":4}'),
('frame','Midnight Chrome','Metallic silver with chrome reflections',35.00,
 '{"gradient":"conic-gradient(from 0deg, #64748B, #CBD5E1, #94A3B8, #E2E8F0, #64748B)","glow":"0 0 12px rgba(148,163,184,.3), 0 0 28px rgba(100,116,139,.12)","css_animation":null,"ring_size":4}'),
('frame','Cherry Blossom','Soft pink gradient with breathing glow',40.00,
 '{"gradient":"conic-gradient(from 90deg, #F9A8D4, #FBCFE8, #F472B6, #FBCFE8, #F9A8D4)","glow":"0 0 20px rgba(244,114,182,.35), 0 0 45px rgba(249,168,212,.18)","css_animation":"frame-breathe","ring_size":4}'),
('frame','Electric Volt','Neon green with flickering energy',50.00,
 '{"gradient":"conic-gradient(from 0deg, #84CC16, #A3E635, #D9F99D, #A3E635, #84CC16)","glow":"0 0 18px rgba(132,204,22,.5), 0 0 40px rgba(163,230,53,.2)","css_animation":"frame-flicker","ring_size":5}'),
('frame','Frost Crystal','Ice-blue with shimmering highlights',60.00,
 '{"gradient":"conic-gradient(from 0deg, #BAE6FD, #E0F2FE, #7DD3FC, #BFDBFE, #BAE6FD)","glow":"0 0 20px rgba(125,211,252,.4), 0 0 50px rgba(186,230,253,.2)","css_animation":"frame-shimmer","ring_size":5}'),
('frame','Solar Flare','Fiery rotating gradient with intense glow',75.00,
 '{"gradient":"conic-gradient(from 0deg, #F97316, #FBBF24, #EF4444, #FB923C, #FBBF24, #F97316)","glow":"0 0 22px rgba(249,115,22,.45), 0 0 55px rgba(251,191,36,.2)","css_animation":"frame-spin","ring_size":5}'),
('frame','Void Eclipse','Dark purple aurora with color-shifting glow',90.00,
 '{"gradient":"conic-gradient(from 0deg, #8B5CF6, #A78BFA, #34D399, #2DD4BF, #8B5CF6, #6D28D9)","glow":"0 0 22px rgba(139,92,246,.4), 0 0 50px rgba(52,211,153,.18)","css_animation":"frame-aurora","ring_size":5}'),
('frame','Prismatic Crown','Full rainbow holographic rotating ring',120.00,
 '{"gradient":"conic-gradient(from 0deg, #EF4444, #F97316, #EAB308, #22C55E, #3B82F6, #8B5CF6, #EC4899, #EF4444)","glow":"0 0 20px rgba(139,92,246,.25), 0 0 45px rgba(239,68,68,.18), 0 0 65px rgba(59,130,246,.12)","css_animation":"frame-spin-slow","ring_size":6}'),
('badge','Busy Bee','Show everyone you''re always hustling',10.00,
 '{"tag":"#BusyBee","bg_color":"#F5B540","text_color":"#131210","bg_gradient":null,"css_animation":null}'),
('badge','Night Owl','For the late-night grinders',15.00,
 '{"tag":"#NightOwl","bg_color":"#7C3AED","text_color":"#FFFFFF","bg_gradient":null,"css_animation":null}'),
('badge','Trailblazer','Leading the way for others',20.00,
 '{"tag":"#Trailblazer","bg_color":"#C2410C","text_color":"#FFFFFF","bg_gradient":null,"css_animation":null}'),
('badge','Brainiac','The intellectual powerhouse',25.00,
 '{"tag":"#Brainiac","bg_color":"#0D9488","text_color":"#FFFFFF","bg_gradient":null,"css_animation":null}'),
('badge','MVP','Most Valuable Provider',35.00,
 '{"tag":"#MVP","bg_color":"#C93B3B","text_color":"#FFFFFF","bg_gradient":null,"css_animation":null}'),
('badge','Hustler','Non-stop grind mentality',40.00,
 '{"tag":"#Hustler","bg_color":"#059669","text_color":"#FFFFFF","bg_gradient":null,"css_animation":null}'),
('badge','Sensei','Master of your craft',50.00,
 '{"tag":"#Sensei","bg_color":"#1E40AF","text_color":"#FFFFFF","bg_gradient":"linear-gradient(135deg, #1E3A8A, #3B82F6)","css_animation":null}'),
('badge','Legend','Legendary status achieved',65.00,
 '{"tag":"#Legend","bg_color":"#B45309","text_color":"#FFFFFF","bg_gradient":"linear-gradient(135deg, #92400E, #F59E0B)","css_animation":null}'),
('badge','Visionary','Seeing the future before it happens',80.00,
 '{"tag":"#Visionary","bg_color":"#9333EA","text_color":"#FFFFFF","bg_gradient":"linear-gradient(135deg, #7C3AED, #EC4899)","css_animation":null}'),
('badge','Apex','The absolute pinnacle',100.00,
 '{"tag":"#Apex","bg_color":"#EF4444","text_color":"#FFFFFF","bg_gradient":null,"css_animation":"badge-apex-holo"}'),
('theme','Sahara Sand','Warm tan desert tones',15.00,
 '{"banner_gradient":"linear-gradient(135deg, #92702E 0%, #C4A35A 50%, #92702E 100%)","accent_color":"#C4A35A","text_color":"#FFFFFF","css_animation":null}'),
('theme','Forest Moss','Deep earthy greens',20.00,
 '{"banner_gradient":"linear-gradient(135deg, #2D5016 0%, #4A7C25 50%, #2D5016 100%)","accent_color":"#4A7C25","text_color":"#FFFFFF","css_animation":null}'),
('theme','Arctic Blue','Cool ice-blue tones',25.00,
 '{"banner_gradient":"linear-gradient(135deg, #1E3A5F 0%, #3B82F6 50%, #1E3A5F 100%)","accent_color":"#3B82F6","text_color":"#FFFFFF","css_animation":null}'),
('theme','Lavender Fields','Soft purple and lilac',30.00,
 '{"banner_gradient":"linear-gradient(135deg, #5B21B6 0%, #A78BFA 50%, #5B21B6 100%)","accent_color":"#A78BFA","text_color":"#FFFFFF","css_animation":null}'),
('theme','Sunset Blaze','Orange-red sunset gradient',35.00,
 '{"banner_gradient":"linear-gradient(135deg, #9A3412 0%, #F97316 50%, #9A3412 100%)","accent_color":"#F97316","text_color":"#FFFFFF","css_animation":"theme-drift"}'),
('theme','Midnight Navy','Dark navy and indigo',40.00,
 '{"banner_gradient":"linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #1E1B4B 100%)","accent_color":"#4F46E5","text_color":"#FFFFFF","css_animation":null}'),
('theme','Rose Quartz','Pink and rose gold',50.00,
 '{"banner_gradient":"linear-gradient(135deg, #9F1239 0%, #F43F5E 50%, #9F1239 100%)","accent_color":"#FB7185","text_color":"#FFFFFF","css_animation":"theme-pulse"}'),
('theme','Emerald Luxe','Rich jade green',65.00,
 '{"banner_gradient":"linear-gradient(135deg, #064E3B 0%, #10B981 50%, #064E3B 100%)","accent_color":"#10B981","text_color":"#FFFFFF","css_animation":"theme-wander"}'),
('theme','Obsidian','Dark volcanic glass with ember accents',80.00,
 '{"banner_gradient":"linear-gradient(135deg, #1A1A2E 0%, #16213E 30%, #0F3460 60%, #1A1A2E 100%)","accent_color":"#E94560","text_color":"#FFFFFF","css_animation":"theme-drift"}'),
('theme','Aurora Borealis','Animated shifting gradient',120.00,
 '{"banner_gradient":"linear-gradient(135deg, #1E3A5F 0%, #10B981 25%, #8B5CF6 50%, #F43F5E 75%, #1E3A5F 100%)","accent_color":"#8B5CF6","text_color":"#FFFFFF","css_animation":"theme-aurora"}');

-- ------------------------------------------------------------
-- 4) USERS — 1000 users with deterministic full-pool name variety
-- First names use a stable 50-name subset; last names are shuffled across
-- the entire 202-name pool to avoid frontloaded alphabet bias.
-- Accelerating signups Mar 2025 → Feb 2026
-- ------------------------------------------------------------
ALTER TABLE users AUTO_INCREMENT = 2;

INSERT INTO users
(email, username, password_hash, first_name, last_name, bio, major, year, university,
 profile_image, hivecoin_balance, verified, onboarding_done, wants_to_offer, wants_to_find,
 notify_orders, notify_messages, notify_proposals,
 active_frame_id, active_badge_id, active_theme_id,
 last_seen_at, created_at, updated_at)
SELECT
  CONCAT(LOWER(CONCAT(fn.first_name, ln.last_name)), '@', uni.domain) AS email,
  LOWER(CONCAT(fn.first_name, ln.last_name)) AS username,
  -- Password for all seeded users: team.random()
  '$2y$12$ion6q0vmWURwMQJGoAIlSey6cXxGg6FzS5o931V8h8z6yn0RMimqS' AS password_hash,
  fn.first_name,
  ln.last_name,
  -- Bio: major-specific base + universal suffix (8 groups × 15 suffixes = 120 combos)
  CONCAT(
    CASE
      WHEN mj.major = 'Music' THEN
        'Music lessons, practice plans, and production tips. Guitar, piano, rhythm, ear training — no gatekeeping.'
      WHEN mj.major = 'Media Studies' THEN
        'Photography and editing. Portraits, events, clean color grading. Consistent tones, natural skin, fast turnaround.'
      WHEN mj.major = 'Design' THEN
        'Design and UX. Wireframes, UI polish, actionable feedback. Clarity, hierarchy, and making things feel effortless.'
      WHEN mj.major = 'Mathematics' THEN
        'Tutoring: calculus, linear algebra, probability, and intuition-first explanations. Whiteboard-first, then practice.'
      WHEN mj.major = 'English' THEN
        'Writing and editing: structure, clarity, and tone. I keep your voice — just make it sharper and easier to read.'
      WHEN mj.major IN ('Business','Economics') THEN
        'Consulting: budgeting, planning, and making decisions less chaotic. Templates, clear tradeoffs, actionable plans.'
      WHEN mj.major IN ('Biology','Psychology') THEN
        'Study coaching and writing support. Good notes, good recall, good routines — no gimmicks.'
      ELSE
        'Coding help: debugging, clean refactors, tests, and project structure. SQL, web dev, and beyond.'
    END,
    ' ',
    CASE (s.n % 15)
      WHEN 0 THEN 'Consistency beats panic every time.'
      WHEN 1 THEN 'Small wins stack up faster than you think.'
      WHEN 2 THEN 'I have been there — it gets clearer faster with the right approach.'
      WHEN 3 THEN 'Bring your questions. The weirder, the better.'
      WHEN 4 THEN 'If it sounds impossible, it usually just needs a better angle.'
      WHEN 5 THEN 'We will keep it fun, structured, and actionable.'
      WHEN 6 THEN 'My goal: you walk away confident, not confused.'
      WHEN 7 THEN 'Think of this as a side quest with guaranteed loot.'
      WHEN 8 THEN 'No pressure, just progress at your pace.'
      WHEN 9 THEN 'We will debug the confusion and ship clarity.'
      WHEN 10 THEN 'I keep it simple, honest, and effective.'
      WHEN 11 THEN 'Your success is my XP. Let us level up.'
      WHEN 12 THEN 'If Plan A does not work, we have 25 more letters.'
      WHEN 13 THEN 'I genuinely enjoy helping people figure things out.'
      ELSE 'Structured, not stiff. Focused, not frantic.'
    END
  ) AS bio,
  mj.major,
  CASE (s.n % 5) WHEN 0 THEN 'Freshman' WHEN 1 THEN 'Sophomore' WHEN 2 THEN 'Junior' WHEN 3 THEN 'Senior' ELSE 'Graduate' END AS year,
  uni.name AS university,
  '' AS profile_image,
  0.00 AS hivecoin_balance,
  CASE WHEN s.n % 25 = 0 THEN 0 ELSE 1 END AS verified,
  1 AS onboarding_done,
  CASE WHEN s.n % 3 = 0 THEN 1 ELSE 0 END AS wants_to_offer,
  1 AS wants_to_find,
  1 AS notify_orders,
  1 AS notify_messages,
  CASE WHEN s.n % 6 = 0 THEN 1 ELSE 0 END AS notify_proposals,
  NULL AS active_frame_id,
  NULL AS active_badge_id,
  NULL AS active_theme_id,
  -- last_seen_at: 60% within 3 days, 25% within 4 weeks, 15% months ago
  CASE
    WHEN s.n % 20 = 0 THEN TIMESTAMP('2026-02-14 12:00:00') - INTERVAL (90 + (s.n * 137 % 150)) DAY - INTERVAL (s.n * 251 % 1440) MINUTE - INTERVAL (s.n * 67 % 60) SECOND
    WHEN s.n % 4 = 0  THEN TIMESTAMP('2026-02-14 12:00:00') - INTERVAL (4 + (s.n * 137 % 25)) DAY - INTERVAL (s.n * 251 % 1440) MINUTE - INTERVAL (s.n * 67 % 60) SECOND
    ELSE                    TIMESTAMP('2026-02-14 12:00:00') - INTERVAL (s.n * 137 % 3) DAY - INTERVAL (s.n * 251 % 1440) MINUTE - INTERVAL (s.n * 67 % 60) SECOND
  END AS last_seen_at,
  -- created_at: accelerating signups Mar 2025 → Feb 2026 (~350 days)
  ( TIMESTAMP('2025-03-01 09:00:00')
    + INTERVAL FLOOR(350 * POW((s.n - 1) / 999.0, 1.7)) DAY
    + INTERVAL (s.n * 73 % 1440) MINUTE
    + INTERVAL (s.n * 137 % 60) SECOND
  ) AS created_at,
  ( TIMESTAMP('2025-03-01 09:00:00')
    + INTERVAL FLOOR(350 * POW((s.n - 1) / 999.0, 1.7)) DAY
    + INTERVAL (s.n * 73 % 1440) MINUTE
    + INTERVAL (s.n * 137 % 60) SECOND
    + INTERVAL (s.n % 46) DAY
  ) AS updated_at
FROM seq s
JOIN fn_pool fn ON fn.i = ((s.n - 1) % 50) + 1
JOIN ln_pool ln ON ln.j = ((s.n * 137) % 202) + 1
JOIN uni_pool uni ON uni.bucket = (s.n % 30)
JOIN major_pool mj ON mj.k = (s.n % 12)
WHERE s.n BETWEEN 1 AND 1000;

-- ------------------------------------------------------------
-- 5) Service title pool (21 categories × 5 base titles each)
-- Combined with suffix variants for 40 unique titles per category
-- ------------------------------------------------------------
CREATE TABLE svc_title_pool (
  category VARCHAR(20) NOT NULL,
  k INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  PRIMARY KEY (category, k)
);
INSERT INTO svc_title_pool (category, k, title) VALUES
('Tutoring',0,'Calculus II Crash Course'),('Tutoring',1,'Organic Chem Study Sessions'),('Tutoring',2,'Physics Problem-Solving Workshop'),
('Tutoring',3,'Data Structures Deep Dive'),('Tutoring',4,'Statistics & Probability Bootcamp'),
('Coding',0,'Python Debugging & Clean Code'),('Coding',1,'Full-Stack Web Dev Help'),('Coding',2,'React Component Workshop'),
('Coding',3,'SQL & Database Optimization'),('Coding',4,'Technical Interview Prep'),
('Writing',0,'Essay Editing & Structure'),('Writing',1,'Research Paper Polishing'),('Writing',2,'Creative Writing Workshop'),
('Writing',3,'Cover Letter & Personal Statement'),('Writing',4,'College Application Essays'),
('Career',0,'Resume & LinkedIn Makeover'),('Career',1,'Mock Interview Bootcamp'),('Career',2,'Career Path Strategy'),
('Career',3,'Portfolio Review & Feedback'),('Career',4,'Internship Search Sprint'),
('Design',0,'UI/UX Audit & Redesign'),('Design',1,'Logo & Brand Identity'),('Design',2,'Figma Prototyping Workshop'),
('Design',3,'Social Media Graphics Pack'),('Design',4,'Mobile App UI Design'),
('Fitness',0,'Custom Workout Plan'),('Fitness',1,'Strength Training Basics'),('Fitness',2,'Yoga & Flexibility Sessions'),
('Fitness',3,'HIIT Workout Design'),('Fitness',4,'Nutrition & Meal Planning'),
('Photography',0,'Portrait Photography Session'),('Photography',1,'Event & Party Coverage'),('Photography',2,'Headshot Photography'),
('Photography',3,'Food Photography Styling'),('Photography',4,'Brand & Content Photography'),
('Music',0,'Guitar Lessons for Beginners'),('Music',1,'Piano Fundamentals'),('Music',2,'Music Production Basics'),
('Music',3,'Vocal Coaching Sessions'),('Music',4,'Beat Making Workshop'),
('Consulting',0,'Business Plan Review'),('Consulting',1,'Financial Planning Basics'),('Consulting',2,'Startup Strategy Session'),
('Consulting',3,'Pitch Deck Feedback'),('Consulting',4,'Social Media Strategy'),
('Language',0,'Spanish Conversation Practice'),('Language',1,'French for Beginners'),('Language',2,'Mandarin Basics'),
('Language',3,'Japanese Study Sessions'),('Language',4,'TOEFL & IELTS Prep'),
('Coaching',0,'Valorant Rank-Up Coaching'),('Coaching',1,'Chess Strategy Sessions'),('Coaching',2,'Public Speaking Workshop'),
('Coaching',3,'Study Habits & Productivity'),('Coaching',4,'Time Management Coaching'),
('Beauty',0,'Makeup for Events'),('Beauty',1,'Hair Styling & Braiding'),('Beauty',2,'Nail Art Session'),
('Beauty',3,'Skincare Routine Consultation'),('Beauty',4,'Haircut & Styling'),
('Cooking',0,'Meal Prep for the Week'),('Cooking',1,'Baking Basics Workshop'),('Cooking',2,'Budget-Friendly Recipes'),
('Cooking',3,'International Cuisine Night'),('Cooking',4,'Healthy Eating on Campus'),
('Video',0,'YouTube Video Editing'),('Video',1,'TikTok Content Creation'),('Video',2,'Vlog Editing & Storytelling'),
('Video',3,'Color Grading Workshop'),('Video',4,'Premiere Pro Bootcamp'),
('Tech Support',0,'Laptop Repair & Cleanup'),('Tech Support',1,'WiFi & Network Setup'),('Tech Support',2,'PC Build Consultation'),
('Tech Support',3,'Software Installation Help'),('Tech Support',4,'Computer Speed Optimization'),
('Events',0,'Campus Event Planning'),('Events',1,'Birthday Party Setup'),('Events',2,'Tailgate & Watch Party'),
('Events',3,'Graduation Party Planning'),('Events',4,'Networking Event Planning'),
('Errands',0,'Grocery Shopping Run'),('Errands',1,'Package Pickup & Delivery'),('Errands',2,'Campus Supply Run'),
('Errands',3,'Gift Shopping Helper'),('Errands',4,'General Campus Errands'),
('Moving',0,'Apartment Move-In Help'),('Moving',1,'Move-Out Cleaning & Haul'),('Moving',2,'Furniture Assembly'),
('Moving',3,'Dorm Room Setup'),('Moving',4,'IKEA Furniture Build'),
('Pet Care',0,'Dog Walking Service'),('Pet Care',1,'Pet Sitting Overnight'),('Pet Care',2,'Cat Feeding Visits'),
('Pet Care',3,'Puppy Training Sessions'),('Pet Care',4,'Weekend Pet Watching'),
('Rides',0,'Airport Shuttle Service'),('Rides',1,'Campus-to-City Rides'),('Rides',2,'Late Night Safe Rides'),
('Rides',3,'Concert & Event Rides'),('Rides',4,'Holiday Travel Help'),
('Other',0,'Custom Project Help'),('Other',1,'Research Assistant'),('Other',2,'Data Entry & Organization'),
('Other',3,'Study Accountability Partner'),('Other',4,'Personal Organizing Session');

-- ------------------------------------------------------------
-- 6) SERVICES — 2000 services with realistic skewed category distribution
-- Uses CRC32 % 1000 for granular weighting:
--   Tutoring ~18%, Coding ~15%, Writing ~10%, Career ~9%, Design ~8%
--   Fitness ~7%, Music ~5%, Photography ~5%, then long tail
-- Title = base title + suffix for variety
-- Description = category-specific base + universal suffix
-- ------------------------------------------------------------
INSERT INTO services
(provider_id, title, category, description, included, pricing_type, price,
 avg_rating, review_count, is_active, created_at, updated_at)
SELECT
  svc.provider_id,
  CONCAT(
    tp.title,
    CASE (svc.n % 8)
      WHEN 0 THEN ''
      WHEN 1 THEN ' (Beginner Friendly)'
      WHEN 2 THEN ' (Advanced)'
      WHEN 3 THEN ' (Express)'
      WHEN 4 THEN ' (1-on-1)'
      WHEN 5 THEN ' (Group Session)'
      WHEN 6 THEN ' (Weekend)'
      ELSE ' (Online)'
    END
  ) AS title,
  svc.category_name AS category,
  CONCAT(
    CASE svc.category_name
      WHEN 'Tutoring' THEN 'Step-by-step tutoring with practice problems, shortcuts, and exam strategy.'
      WHEN 'Coding' THEN 'Debugging and implementation help with clean fixes and maintainable code.'
      WHEN 'Writing' THEN 'Editing for clarity, tone, structure, and flow — plus actionable rewrite suggestions.'
      WHEN 'Career' THEN 'Career prep: resume polishing, mock interviews, LinkedIn audits, and job search strategy.'
      WHEN 'Design' THEN 'Design feedback: hierarchy, spacing, typography, and making screens feel consistent.'
      WHEN 'Fitness' THEN 'Fitness coaching: strength basics, mobility, and sustainable routines you can stick to.'
      WHEN 'Photography' THEN 'Photo session planning and delivery with clean edits and consistent color.'
      WHEN 'Music' THEN 'Music lessons: technique, rhythm, practice plans, and optional production tips.'
      WHEN 'Consulting' THEN 'Consulting: templates, planning, and practical decision-making with clear next steps.'
      WHEN 'Language' THEN 'Language practice: conversation drills, grammar review, and pronunciation coaching.'
      WHEN 'Coaching' THEN 'Coaching: structured sessions, progress tracking, and personalized feedback.'
      WHEN 'Beauty' THEN 'Beauty services: styling, grooming, and looks for events or everyday confidence.'
      WHEN 'Cooking' THEN 'Cooking help: meal prep, recipe coaching, kitchen basics, and budget-friendly eating.'
      WHEN 'Video' THEN 'Video editing: cuts, color grading, captions, and export-ready delivery for any platform.'
      WHEN 'Tech Support' THEN 'Tech support: troubleshooting, setup, installation, and network fixes.'
      WHEN 'Events' THEN 'Event planning: logistics, setup, decorations, and day-of coordination.'
      WHEN 'Errands' THEN 'Quick errands and setup help — fast communication and reliable completion.'
      WHEN 'Moving' THEN 'Moving help: packing, hauling, furniture assembly, and stress-free transitions.'
      WHEN 'Pet Care' THEN 'Pet care: walking, sitting, feeding visits, and reliable check-ins.'
      WHEN 'Rides' THEN 'Rides: airport lifts, campus-to-city trips, and reliable pickups.'
      ELSE 'Custom help for whatever is blocking you — define the goal, pick a plan, ship it.'
    END,
    ' ',
    CASE ((svc.n * 3) % 8)
      WHEN 0 THEN 'First session includes a free needs assessment.'
      WHEN 1 THEN 'Flexible scheduling with fast turnaround on deliverables.'
      WHEN 2 THEN 'I tailor every session to your specific goals and level.'
      WHEN 3 THEN 'Includes written summary and action items after each session.'
      WHEN 4 THEN 'Available for both in-person and virtual sessions.'
      WHEN 5 THEN 'Real-world examples and hands-on practice every time.'
      WHEN 6 THEN 'Patient, thorough, and focused on building long-term skills.'
      ELSE 'Satisfaction guaranteed — no questions asked.'
    END
  ) AS description,
  CASE (svc.n % 6)
    WHEN 0 THEN JSON_ARRAY('Session plan','Actionable notes','Follow-up checklist')
    WHEN 1 THEN JSON_ARRAY('1-on-1 session','Written summary','Resource links')
    WHEN 2 THEN JSON_ARRAY('Consultation call','Custom template','Revision round')
    WHEN 3 THEN JSON_ARRAY('Live walkthrough','Screen recording','Q&A follow-up')
    WHEN 4 THEN JSON_ARRAY('Progress report','Practice exercises','Email support')
    ELSE JSON_ARRAY('Deliverable file','Feedback notes','30-min check-in')
  END AS included,
  CASE (svc.n % 3) WHEN 0 THEN 'hourly' WHEN 1 THEN 'flat' ELSE 'custom' END AS pricing_type,
  ROUND(CASE (svc.n % 3) WHEN 0 THEN 15 + (svc.n % 35) WHEN 1 THEN 35 + (svc.n % 180) ELSE 25 + (svc.n % 140) END, 2) AS price,
  0.00 AS avg_rating,
  0 AS review_count,
  1 AS is_active,
  -- created_at: spread independently across Apr 2025 → Feb 2026 (not tied to user signup)
  -- Using GREATEST to ensure service is always created after user signup
  GREATEST(
    u.created_at + INTERVAL 1 DAY,
    TIMESTAMP('2025-04-01 09:00:00')
      + INTERVAL FLOOR((320 * (svc.n - 1)) / 1999) DAY
      + INTERVAL ((svc.n * 19) % 1440) MINUTE
      + INTERVAL (svc.n * 251 % 60) SECOND
  ) AS created_at,
  GREATEST(
    u.created_at + INTERVAL 1 DAY + INTERVAL (svc.n % 60) DAY,
    TIMESTAMP('2025-04-01 09:00:00')
      + INTERVAL FLOOR((320 * (svc.n - 1)) / 1999) DAY
      + INTERVAL ((svc.n * 19) % 1440) MINUTE
      + INTERVAL (svc.n * 251 % 60) SECOND
      + INTERVAL (svc.n % 60) DAY
  ) AS updated_at
FROM (
  SELECT
    s.n,
    ((s.n * 407 + (s.n DIV 50) * 17) % 1000) + 2 AS provider_id,
    -- Skewed but every category gets 51+. First 1050 services rotate evenly
    -- (50 each × 21 categories), remaining 950 skew toward popular categories.
    CASE
      WHEN s.n <= 1050 THEN ELT(((s.n - 1) % 21) + 1,
        'Tutoring','Coding','Writing','Career','Design','Fitness','Music',
        'Photography','Consulting','Language','Coaching','Beauty','Video',
        'Cooking','Tech Support','Events','Errands','Moving','Pet Care','Rides','Other')
      WHEN (CRC32(CONCAT('svc-', s.n)) % 1000) < 155 THEN 'Tutoring'
      WHEN (CRC32(CONCAT('svc-', s.n)) % 1000) < 290 THEN 'Coding'
      WHEN (CRC32(CONCAT('svc-', s.n)) % 1000) < 395 THEN 'Writing'
      WHEN (CRC32(CONCAT('svc-', s.n)) % 1000) < 490 THEN 'Career'
      WHEN (CRC32(CONCAT('svc-', s.n)) % 1000) < 575 THEN 'Design'
      WHEN (CRC32(CONCAT('svc-', s.n)) % 1000) < 650 THEN 'Fitness'
      WHEN (CRC32(CONCAT('svc-', s.n)) % 1000) < 710 THEN 'Music'
      WHEN (CRC32(CONCAT('svc-', s.n)) % 1000) < 765 THEN 'Photography'
      WHEN (CRC32(CONCAT('svc-', s.n)) % 1000) < 810 THEN 'Consulting'
      WHEN (CRC32(CONCAT('svc-', s.n)) % 1000) < 845 THEN 'Language'
      WHEN (CRC32(CONCAT('svc-', s.n)) % 1000) < 875 THEN 'Coaching'
      WHEN (CRC32(CONCAT('svc-', s.n)) % 1000) < 900 THEN 'Beauty'
      WHEN (CRC32(CONCAT('svc-', s.n)) % 1000) < 920 THEN 'Video'
      WHEN (CRC32(CONCAT('svc-', s.n)) % 1000) < 940 THEN 'Cooking'
      WHEN (CRC32(CONCAT('svc-', s.n)) % 1000) < 955 THEN 'Tech Support'
      WHEN (CRC32(CONCAT('svc-', s.n)) % 1000) < 968 THEN 'Events'
      WHEN (CRC32(CONCAT('svc-', s.n)) % 1000) < 978 THEN 'Errands'
      WHEN (CRC32(CONCAT('svc-', s.n)) % 1000) < 986 THEN 'Moving'
      WHEN (CRC32(CONCAT('svc-', s.n)) % 1000) < 993 THEN 'Pet Care'
      WHEN (CRC32(CONCAT('svc-', s.n)) % 1000) < 998 THEN 'Rides'
      ELSE 'Other'
    END AS category_name
  FROM seq s
  WHERE s.n BETWEEN 1 AND 2000
) svc
JOIN svc_title_pool tp ON tp.category = svc.category_name AND tp.k = ((svc.n * 7) % 5)
JOIN users u ON u.id = svc.provider_id;

-- ------------------------------------------------------------
-- ------------------------------------------------------------
-- 7) SERVICE IMAGES — Stock photos from public/services/webp/
-- Files: <Prefix>_01.webp .. <Prefix>_NN.webp
-- Distributed round-robin so every photo in a category gets used
-- roughly the same number of times before any photo repeats.
-- ------------------------------------------------------------
DROP TABLE IF EXISTS img_pool;
CREATE TABLE img_pool (category VARCHAR(30), file_prefix VARCHAR(30), img_num INT);

-- Each row = one photo file.  Category matches the DB column value,
-- file_prefix matches the filename prefix (PascalCase, no spaces).
INSERT INTO img_pool (category, file_prefix, img_num)
WITH RECURSIVE nums AS (
  SELECT 1 AS n UNION ALL SELECT n+1 FROM nums WHERE n < 30
), cat_info(cat, prefix, cnt) AS (
  VALUES
    ROW('Beauty',       'Beauty',       15),
    ROW('Career',       'Career',       19),
    ROW('Coaching',     'Coaching',     16),
    ROW('Coding',       'Coding',       23),
    ROW('Consulting',   'Consulting',   16),
    ROW('Cooking',      'Cooking',      15),
    ROW('Design',       'Design',       18),
    ROW('Errands',      'Errands',      15),
    ROW('Events',       'Events',       15),
    ROW('Fitness',      'Fitness',      17),
    ROW('Language',     'Language',     16),
    ROW('Moving',       'Moving',       15),
    ROW('Music',        'Music',        17),
    ROW('Other',        'Other',        15),
    ROW('Pet Care',     'PetCare',      15),
    ROW('Photography',  'Photography',  17),
    ROW('Rides',        'Rides',        15),
    ROW('Tech Support', 'TechSupport',  15),
    ROW('Tutoring',     'Tutoring',     25),
    ROW('Video',        'Video',        15),
    ROW('Writing',      'Writing',      20)
)
SELECT ci.cat, ci.prefix, nums.n
FROM cat_info ci
JOIN nums ON nums.n <= ci.cnt;

-- Distribute pool images to services round-robin within each category.
-- Uses CRC32 hash so adjacent service IDs don't get sequential photos,
-- giving an organic feel.  Every photo in the pool gets roughly equal use.
INSERT INTO service_images (service_id, image_url, sort_order)
SELECT
  s.id,
  CONCAT('/services/webp/',
    pool.file_prefix, '_',
    LPAD(pool.img_num, 2, '0'),
    '.webp'),
  0
FROM services s
JOIN (
  SELECT category, file_prefix, img_num,
         ROW_NUMBER() OVER (PARTITION BY category ORDER BY img_num) AS rn,
         COUNT(*)      OVER (PARTITION BY category)                 AS cnt
  FROM img_pool
) pool ON pool.category = s.category
      AND pool.rn = ((CRC32(CONCAT(s.id, '-img')) % pool.cnt) + 1);

DROP TABLE IF EXISTS img_pool;

-- 8) REQUESTS — 800 requests, skewed categories (30+ each, academic-heavy)
-- Spread across 2025-05 → 2026-02
-- ------------------------------------------------------------
INSERT INTO requests
(requester_id, title, category, description, budget_range, deadline, status, created_at, updated_at)
SELECT
  ((s.n * 409 + (s.n DIV 30) * 13) % 1000) + 2 AS requester_id,
  CONCAT(
    CASE (s.n % 10)
      WHEN 0 THEN 'Need help with '
      WHEN 1 THEN 'Looking for '
      WHEN 2 THEN 'Request: '
      WHEN 3 THEN 'Urgent: '
      WHEN 4 THEN 'Quick help with '
      WHEN 5 THEN 'Seeking '
      WHEN 6 THEN 'Help wanted: '
      WHEN 7 THEN 'Who can help with '
      WHEN 8 THEN 'Can someone tackle '
      ELSE 'ISO: '
    END,
    CASE (s.n % 30)
      WHEN 0 THEN 'calculus homework that is defeating me'
      WHEN 1 THEN 'a chemistry lab report due Friday'
      WHEN 2 THEN 'debugging a React component'
      WHEN 3 THEN 'my resume before career fair'
      WHEN 4 THEN 'a portfolio that actually impresses'
      WHEN 5 THEN 'a workout routine I can stick to'
      WHEN 6 THEN 'professional headshot photos'
      WHEN 7 THEN 'event photos for our club'
      WHEN 8 THEN 'a tricky SQL query'
      WHEN 9 THEN 'an essay that needs serious editing'
      WHEN 10 THEN 'a study plan for finals week'
      WHEN 11 THEN 'a last-minute assignment'
      WHEN 12 THEN 'interview prep for tech companies'
      WHEN 13 THEN 'a budgeting spreadsheet'
      WHEN 14 THEN 'learning guitar in 4 weeks'
      WHEN 15 THEN 'Spanish conversation partner'
      WHEN 16 THEN 'a video edit for my YouTube channel'
      WHEN 17 THEN 'a fresh haircut before formal'
      WHEN 18 THEN 'moving to a new apartment this weekend'
      WHEN 19 THEN 'a reliable pet sitter for spring break'
      WHEN 20 THEN 'meal prep ideas on a budget'
      WHEN 21 THEN 'setting up my new laptop'
      WHEN 22 THEN 'planning our end-of-semester party'
      WHEN 23 THEN 'a Valorant coaching session'
      WHEN 24 THEN 'a ride to the airport on Sunday'
      WHEN 25 THEN 'a logo design for my startup'
      WHEN 26 THEN 'someone to review my thesis draft'
      WHEN 27 THEN 'a French tutor for conversation'
      WHEN 28 THEN 'a piano teacher for beginners'
      ELSE 'help organizing my closet and room'
    END
  ) AS title,
  -- First 630 rotate evenly (30 each × 21), remaining 170 skew toward popular
  CASE
    WHEN s.n <= 630 THEN ELT(((s.n - 1) % 21) + 1,
      'Tutoring','Coding','Writing','Career','Design','Fitness','Music',
      'Photography','Consulting','Language','Coaching','Beauty','Video',
      'Cooking','Tech Support','Events','Errands','Moving','Pet Care','Rides','Other')
    WHEN (CRC32(CONCAT('req-', s.n)) % 1000) < 175 THEN 'Tutoring'
    WHEN (CRC32(CONCAT('req-', s.n)) % 1000) < 330 THEN 'Coding'
    WHEN (CRC32(CONCAT('req-', s.n)) % 1000) < 450 THEN 'Writing'
    WHEN (CRC32(CONCAT('req-', s.n)) % 1000) < 555 THEN 'Career'
    WHEN (CRC32(CONCAT('req-', s.n)) % 1000) < 645 THEN 'Design'
    WHEN (CRC32(CONCAT('req-', s.n)) % 1000) < 720 THEN 'Fitness'
    WHEN (CRC32(CONCAT('req-', s.n)) % 1000) < 780 THEN 'Music'
    WHEN (CRC32(CONCAT('req-', s.n)) % 1000) < 830 THEN 'Photography'
    WHEN (CRC32(CONCAT('req-', s.n)) % 1000) < 870 THEN 'Consulting'
    WHEN (CRC32(CONCAT('req-', s.n)) % 1000) < 900 THEN 'Language'
    WHEN (CRC32(CONCAT('req-', s.n)) % 1000) < 925 THEN 'Coaching'
    WHEN (CRC32(CONCAT('req-', s.n)) % 1000) < 945 THEN 'Beauty'
    WHEN (CRC32(CONCAT('req-', s.n)) % 1000) < 960 THEN 'Video'
    WHEN (CRC32(CONCAT('req-', s.n)) % 1000) < 972 THEN 'Cooking'
    WHEN (CRC32(CONCAT('req-', s.n)) % 1000) < 980 THEN 'Tech Support'
    WHEN (CRC32(CONCAT('req-', s.n)) % 1000) < 986 THEN 'Events'
    WHEN (CRC32(CONCAT('req-', s.n)) % 1000) < 990 THEN 'Errands'
    WHEN (CRC32(CONCAT('req-', s.n)) % 1000) < 994 THEN 'Moving'
    WHEN (CRC32(CONCAT('req-', s.n)) % 1000) < 997 THEN 'Pet Care'
    WHEN (CRC32(CONCAT('req-', s.n)) % 1000) < 999 THEN 'Rides'
    ELSE 'Other'
  END AS category,
  CONCAT(
    'Goal: ',
    CASE (s.n % 10)
      WHEN 0 THEN 'finish a milestone and unblock progress'
      WHEN 1 THEN 'prepare efficiently and reduce stress'
      WHEN 2 THEN 'improve quality and clarity'
      WHEN 3 THEN 'get honest feedback and a plan'
      WHEN 4 THEN 'fix the thing that is breaking everything'
      WHEN 5 THEN 'ship something presentable quickly'
      WHEN 6 THEN 'learn a new skill and build confidence'
      WHEN 7 THEN 'get professional-level results on a student budget'
      WHEN 8 THEN 'save time on something I cannot do myself'
      ELSE 'make it make sense'
    END,
    '. ',
    CASE (s.n % 12)
      WHEN 0 THEN 'I can share links and files beforehand.'
      WHEN 1 THEN 'I prefer a short call plus written notes.'
      WHEN 2 THEN 'I am flexible if the plan is solid.'
      WHEN 3 THEN 'I would like a checklist I can follow later.'
      WHEN 4 THEN 'I am fine with iterative delivery.'
      WHEN 5 THEN 'If you see a better approach, suggest it.'
      WHEN 6 THEN 'Please be direct — no fluff.'
      WHEN 7 THEN 'Happy to do a video call or in-person.'
      WHEN 8 THEN 'Deadline is real; help.'
      WHEN 9 THEN 'Budget is flexible for the right person.'
      WHEN 10 THEN 'I have tried doing this myself and got stuck.'
      ELSE 'Open to creative approaches.'
    END
  ) AS description,
  CASE (s.n % 6)
    WHEN 0 THEN 'under-50' WHEN 1 THEN '50-100' WHEN 2 THEN '100-200'
    WHEN 3 THEN '200-500' WHEN 4 THEN 'over-500' ELSE 'flexible'
  END AS budget_range,
  DATE('2026-03-01') + INTERVAL (s.n % 365) DAY AS deadline,
  CASE (s.n % 12)
    WHEN 0 THEN 'open' WHEN 1 THEN 'open' WHEN 2 THEN 'open'
    WHEN 3 THEN 'in_progress' WHEN 4 THEN 'in_progress'
    WHEN 5 THEN 'completed' WHEN 6 THEN 'open' WHEN 7 THEN 'cancelled'
    WHEN 8 THEN 'completed' WHEN 9 THEN 'open' WHEN 10 THEN 'in_progress'
    ELSE 'open'
  END AS status,
  (TIMESTAMP('2025-05-01 10:00:00') + INTERVAL FLOOR((289 * (s.n - 1)) / 799) DAY + INTERVAL ((s.n * 31) % 1440) MINUTE + INTERVAL (s.n * 179 % 60) SECOND) AS created_at,
  (TIMESTAMP('2025-05-01 10:00:00') + INTERVAL FLOOR((289 * (s.n - 1)) / 799) DAY + INTERVAL ((s.n * 31) % 1440) MINUTE + INTERVAL (s.n * 179 % 60) SECOND + INTERVAL (s.n % 21) DAY) AS updated_at
FROM seq s
WHERE s.n BETWEEN 1 AND 800;

-- ------------------------------------------------------------
-- 9) PROPOSALS — ~2500 (INSERT IGNORE for unique constraint)
-- ------------------------------------------------------------
INSERT IGNORE INTO proposals
(request_id, provider_id, price, message, estimated_delivery, status, created_at, responded_at)
SELECT
  ((s.n - 1) % 800) + 1 AS request_id,
  ((s.n * 13 - 1) % 1000) + 2 AS provider_id,
  ROUND(18 + (s.n % 240), 2) AS price,
  CASE (s.n % 10)
    WHEN 0 THEN 'I can help — here is a clear plan and timeline. Share any context and I will tailor the approach.'
    WHEN 1 THEN 'I have done similar work before and can keep this simple. Let me know your preferred schedule.'
    WHEN 2 THEN 'Happy to jump on a call and unblock this quickly. I am available most evenings this week.'
    WHEN 3 THEN 'I will deliver in checkpoints so you always know where things stand. First milestone in 48 hours.'
    WHEN 4 THEN 'We will define success criteria first, then execute. That way there are no surprises.'
    WHEN 5 THEN 'Fast, clean, and communicative. I pride myself on response times and quality.'
    WHEN 6 THEN 'This is right in my wheelhouse. I can start as soon as tomorrow if you are ready.'
    WHEN 7 THEN 'Let me know if you have any preferences on approach. I am flexible and thorough.'
    WHEN 8 THEN 'I have great reviews for similar work. Happy to share examples if that would help.'
    ELSE 'I am excited about this project. Let us turn it into a quick win together.'
  END AS message,
  DATE('2026-03-01') + INTERVAL (s.n % 60) DAY AS estimated_delivery,
  CASE (s.n % 6)
    WHEN 0 THEN 'pending' WHEN 1 THEN 'accepted' WHEN 2 THEN 'rejected'
    WHEN 3 THEN 'pending' WHEN 4 THEN 'expired' ELSE 'pending'
  END AS status,
  (TIMESTAMP('2025-05-01 12:00:00') + INTERVAL FLOOR((289 * (s.n - 1)) / 2499) DAY + INTERVAL ((s.n * 17) % 1440) MINUTE + INTERVAL (s.n * 211 % 60) SECOND) AS created_at,
  CASE WHEN (s.n % 6) IN (1,2,4)
    THEN (TIMESTAMP('2025-05-02 12:00:00') + INTERVAL FLOOR((289 * (s.n - 1)) / 2499) DAY + INTERVAL (2 + (s.n % 6)) HOUR)
    ELSE NULL
  END AS responded_at
FROM seq s
WHERE s.n BETWEEN 1 AND 2500;

-- ------------------------------------------------------------
-- 10) ORDERS — 5000 orders
-- Status distribution: ~17% pending, ~25% in_progress, ~42% completed, ~8% cancelled, ~8% disputed
-- Service demand is intentionally heavy-tail: a few listings are very busy,
-- many are mid-volume, and a long tail gets little/no traffic.
-- created_at spread May 2025 → Feb 2026
-- ------------------------------------------------------------
INSERT INTO orders
(service_id, provider_id, client_id, request_id, price, service_fee, total,
 status, payment_status, scheduled_date, scheduled_time, notes,
 created_at, started_at, completed_at)
SELECT
  svc.id AS service_id,
  svc.provider_id AS provider_id,
  CASE
    WHEN (((ord.n * 7 - 1) % 1000) + 2) = svc.provider_id THEN ((svc.provider_id % 1000) + 2)
    ELSE (((ord.n * 7 - 1) % 1000) + 2)
  END AS client_id,
  CASE WHEN ord.n % 3 = 0 THEN (((ord.n * 5 - 1) % 800) + 1) ELSE NULL END AS request_id,
  svc.price,
  ROUND(svc.price * 0.05, 2) AS service_fee,
  ROUND(svc.price * 1.05, 2) AS total,
  CASE (ord.n % 12)
    WHEN 0 THEN 'pending' WHEN 1 THEN 'pending'
    WHEN 2 THEN 'in_progress' WHEN 3 THEN 'completed' WHEN 4 THEN 'completed' WHEN 5 THEN 'completed'
    WHEN 6 THEN 'cancelled' WHEN 7 THEN 'in_progress'
    WHEN 8 THEN 'completed' WHEN 9 THEN 'disputed' WHEN 10 THEN 'completed'
    ELSE 'in_progress'
  END AS status,
  CASE (ord.n % 12)
    WHEN 3 THEN 'released' WHEN 4 THEN 'released' WHEN 5 THEN 'released'
    WHEN 8 THEN 'released' WHEN 10 THEN 'released'
    WHEN 6 THEN 'refunded'
    ELSE 'held_in_escrow'
  END AS payment_status,
  CASE
    WHEN (ord.n % 12) IN (0,1) THEN DATE('2026-02-15') + INTERVAL (ord.n % 198) DAY
    ELSE DATE('2025-05-01') + INTERVAL (ord.n % 289) DAY
  END AS scheduled_date,
  CASE (ord.n % 6)
    WHEN 0 THEN '09:00' WHEN 1 THEN '11:30' WHEN 2 THEN '14:00'
    WHEN 3 THEN '16:30' WHEN 4 THEN '19:00' ELSE NULL
  END AS scheduled_time,
  CASE (ord.n % 15)
    WHEN 0 THEN 'Please focus on fundamentals and next steps.'
    WHEN 1 THEN 'Prefer a concise plan and clear deliverables.'
    WHEN 2 THEN 'Deadline is close — prioritize impact.'
    WHEN 3 THEN 'I can share files and screenshots ahead of time.'
    WHEN 4 THEN 'Please include a short guide for what to do next.'
    WHEN 5 THEN 'If possible, add a quick sanity-check or tests.'
    WHEN 6 THEN 'Keep it clean and well-documented.'
    WHEN 7 THEN 'If anything seems off, flag it early.'
    WHEN 8 THEN 'Good enough to ship is the goal.'
    WHEN 9 THEN 'Make it readable and maintainable.'
    WHEN 10 THEN 'I learn best with examples and visuals.'
    WHEN 11 THEN 'Feel free to suggest alternatives if you see a better approach.'
    WHEN 12 THEN 'I appreciate detailed explanations, not just the fix.'
    WHEN 13 THEN 'Please send a message when you start working on it.'
    ELSE 'Happy to do a quick call if that is faster.'
  END AS notes,
  (TIMESTAMP('2025-05-01 08:30:00') + INTERVAL FLOOR((289 * (ord.n - 1)) / 4999) DAY + INTERVAL ((ord.n * 11) % 1440) MINUTE + INTERVAL (ord.n * 313 % 60) SECOND) AS created_at,
  CASE
    WHEN (ord.n % 12) IN (2,3,4,5,7,8,9,10,11) THEN
      (TIMESTAMP('2025-05-01 08:30:00') + INTERVAL FLOOR((289 * (ord.n - 1)) / 4999) DAY + INTERVAL ((ord.n * 11) % 1440) MINUTE + INTERVAL (ord.n * 313 % 60) SECOND + INTERVAL (1 + (ord.n % 72)) HOUR)
    ELSE NULL
  END AS started_at,
  CASE
    WHEN (ord.n % 12) IN (3,4,5,8,10) THEN
      (TIMESTAMP('2025-05-01 08:30:00') + INTERVAL FLOOR((289 * (ord.n - 1)) / 4999) DAY + INTERVAL ((ord.n * 11) % 1440) MINUTE + INTERVAL (ord.n * 313 % 60) SECOND + INTERVAL (1 + (ord.n % 72)) HOUR + INTERVAL (2 + (ord.n % 120)) HOUR + INTERVAL (ord.n % 6) DAY)
    ELSE NULL
  END AS completed_at
FROM (
  SELECT
    s.n,
    CASE
      -- 18% concentrated into 8 "viral" listings
      WHEN (CRC32(CONCAT('ord-tier-', s.n)) % 1000) < 180 THEN ((CRC32(CONCAT('ord-svc-v-', s.n)) % 8) + 1)
      -- 17% into 40 popular listings
      WHEN (CRC32(CONCAT('ord-tier-', s.n)) % 1000) < 350 THEN ((CRC32(CONCAT('ord-svc-p-', s.n)) % 40) + 9)
      -- 22% into 180 established listings
      WHEN (CRC32(CONCAT('ord-tier-', s.n)) % 1000) < 570 THEN ((CRC32(CONCAT('ord-svc-e-', s.n)) % 180) + 49)
      -- 21% into 500 regular listings
      WHEN (CRC32(CONCAT('ord-tier-', s.n)) % 1000) < 780 THEN ((CRC32(CONCAT('ord-svc-r-', s.n)) % 500) + 229)
      -- 12% into 500 long-tail listings
      WHEN (CRC32(CONCAT('ord-tier-', s.n)) % 1000) < 900 THEN ((CRC32(CONCAT('ord-svc-l-', s.n)) % 500) + 729)
      -- 10% spread across 400 emerging listings
      ELSE ((CRC32(CONCAT('ord-svc-x-', s.n)) % 400) + 1229)
    END AS service_id
  FROM seq s
  WHERE s.n BETWEEN 1 AND 5000
) ord
JOIN services svc ON svc.id = ord.service_id;

-- ------------------------------------------------------------
-- 11) REVIEWS — up to 2500 (from completed orders)
-- Ratings are service-quality weighted:
--   some struggling providers trend in 2-3 stars,
--   many mixed providers land in the 3-4 range,
--   strong providers skew 4-5.
-- ------------------------------------------------------------
INSERT INTO reviews
(order_id, service_id, reviewer_id, provider_id, rating, comment, helpful_count, created_at)
SELECT
  o.id AS order_id,
  o.service_id,
  o.client_id AS reviewer_id,
  o.provider_id,
  o.seeded_rating AS rating,
  CASE
    WHEN o.seeded_rating <= 2 THEN
      CASE (o.id % 8)
        WHEN 0 THEN 'Missed the deadline and the quality was below what was promised.'
        WHEN 1 THEN 'Communication was slow and I had to repeat key details several times.'
        WHEN 2 THEN 'Did not really match the service description. Needed major corrections.'
        WHEN 3 THEN 'I expected stronger expertise for this price point.'
        WHEN 4 THEN 'Ended up redoing a lot myself after delivery.'
        WHEN 5 THEN 'Polite, but the output was not usable in its current form.'
        WHEN 6 THEN 'Too many avoidable mistakes and not enough attention to detail.'
        ELSE 'Experience felt rushed and inconsistent from start to finish.'
      END
    WHEN o.seeded_rating = 3 THEN
      CASE (o.id % 8)
        WHEN 0 THEN 'Decent outcome, but execution was uneven in a few places.'
        WHEN 1 THEN 'Average experience overall. Some parts were strong, some were not.'
        WHEN 2 THEN 'Good intent and effort, but the final result needed refinement.'
        WHEN 3 THEN 'Not bad, not great. It got the job done with a few compromises.'
        WHEN 4 THEN 'Reasonable quality for the cost, though there is room to improve.'
        WHEN 5 THEN 'Communication was fine, but I expected more depth.'
        WHEN 6 THEN 'Okay session. Useful, but I would not call it outstanding.'
        ELSE 'Mixed results. A solid baseline, but not quite what I hoped for.'
      END
    WHEN o.seeded_rating = 4 THEN
      CASE (o.id % 10)
        WHEN 0 THEN 'Helpful session. Left with a plan and concrete next steps.'
        WHEN 1 THEN 'Good value for the price. Solid work overall.'
        WHEN 2 THEN 'Great eye for detail. Just needed a bit more time to polish.'
        WHEN 3 THEN 'Really strong session. Minor communication delay but quality was there.'
        WHEN 4 THEN 'Delivered on time and did solid work. Would recommend.'
        WHEN 5 THEN 'Professional and effective. A small revision was needed but handled quickly.'
        WHEN 6 THEN 'Great at explaining concepts. Would have liked more practice examples.'
        WHEN 7 THEN 'Solid experience overall. Good work with room to grow.'
        WHEN 8 THEN 'Friendly, patient, and effective. Slight scheduling hiccup but no big deal.'
        ELSE 'Good results. Would use this provider again for sure.'
      END
    ELSE
      CASE (o.id % 12)
        WHEN 0 THEN 'Clear communication and solid results. Would book again.'
        WHEN 1 THEN 'Absolutely phenomenal work. Exceeded all expectations.'
        WHEN 2 THEN 'Fast turnaround and high quality. Could not ask for more.'
        WHEN 3 THEN 'Exactly what I needed. Efficient, friendly, and professional.'
        WHEN 4 THEN 'Strong explanations. Things finally clicked after this session.'
        WHEN 5 THEN 'If I could give 6 stars I would. Incredible experience.'
        WHEN 6 THEN 'Best provider on the platform. Hands down.'
        WHEN 7 THEN 'Came in stressed, left with a plan. Genuinely life-changing.'
        WHEN 8 THEN 'This felt like working with a friend who happens to be an expert.'
        WHEN 9 THEN 'Clean handoff, great notes, and a follow-up checklist. Perfect.'
        WHEN 10 THEN 'I have already recommended them to three friends.'
        ELSE 'Reliable, clear, and genuinely cares about quality. Will hire again.'
      END
  END AS comment,
  CASE
    WHEN o.seeded_rating = 5 THEN 2 + (o.id % 23)
    WHEN o.seeded_rating = 4 THEN 1 + (o.id % 15)
    WHEN o.seeded_rating = 3 THEN (o.id % 8)
    ELSE (o.id % 4)
  END AS helpful_count,
  (o.completed_at + INTERVAL (2 + (o.id % 72)) HOUR + INTERVAL (o.id % 3) DAY) AS created_at
FROM (
  SELECT
    ord.id,
    ord.service_id,
    ord.client_id,
    ord.provider_id,
    ord.completed_at,
    CASE
      -- 10% struggling services: ratings cluster around 2-3
      WHEN ((ord.service_id * 37) % 100) < 10 THEN
        CASE
          WHEN ((ord.id * 53 + ord.service_id * 17) % 100) < 10 THEN 1
          WHEN ((ord.id * 53 + ord.service_id * 17) % 100) < 30 THEN 2
          WHEN ((ord.id * 53 + ord.service_id * 17) % 100) < 68 THEN 3
          WHEN ((ord.id * 53 + ord.service_id * 17) % 100) < 92 THEN 4
          ELSE 5
        END
      -- 25% mixed services: mostly 3-4 with some 2s and 5s
      WHEN ((ord.service_id * 37) % 100) < 35 THEN
        CASE
          WHEN ((ord.id * 53 + ord.service_id * 17) % 100) < 3 THEN 1
          WHEN ((ord.id * 53 + ord.service_id * 17) % 100) < 10 THEN 2
          WHEN ((ord.id * 53 + ord.service_id * 17) % 100) < 36 THEN 3
          WHEN ((ord.id * 53 + ord.service_id * 17) % 100) < 76 THEN 4
          ELSE 5
        END
      -- 45% solid services: skewed to 4-5 with occasional 3
      WHEN ((ord.service_id * 37) % 100) < 80 THEN
        CASE
          WHEN ((ord.id * 53 + ord.service_id * 17) % 100) < 1 THEN 1
          WHEN ((ord.id * 53 + ord.service_id * 17) % 100) < 4 THEN 2
          WHEN ((ord.id * 53 + ord.service_id * 17) % 100) < 16 THEN 3
          WHEN ((ord.id * 53 + ord.service_id * 17) % 100) < 58 THEN 4
          ELSE 5
        END
      -- 20% elite services: mostly 5-star with some 4s and rare 3s
      ELSE
        CASE
          WHEN ((ord.id * 53 + ord.service_id * 17) % 100) < 1 THEN 2
          WHEN ((ord.id * 53 + ord.service_id * 17) % 100) < 6 THEN 3
          WHEN ((ord.id * 53 + ord.service_id * 17) % 100) < 30 THEN 4
          ELSE 5
        END
    END AS seeded_rating
  FROM orders ord
  WHERE ord.status = 'completed'
) o
ORDER BY o.id
LIMIT 2500;

-- ------------------------------------------------------------
-- 12) CLIENT REVIEWS — ~1500 (provider rates client)
-- Only for completed orders, slightly higher ratings
-- ------------------------------------------------------------
INSERT INTO client_reviews
(order_id, service_id, reviewer_id, client_id, rating, comment, created_at)
SELECT
  o.id AS order_id,
  o.service_id,
  o.provider_id AS reviewer_id,
  o.client_id,
  CASE (o.id % 10)
    WHEN 0 THEN 5 WHEN 1 THEN 5 WHEN 2 THEN 4 WHEN 3 THEN 5 WHEN 4 THEN 5
    WHEN 5 THEN 4 WHEN 6 THEN 5 WHEN 7 THEN 5 WHEN 8 THEN 4 ELSE 3
  END AS rating,
  CASE (o.id % 17)
    WHEN 0 THEN 'Great to work with. Clear about what they needed, responsive, and appreciative.'
    WHEN 1 THEN 'Perfect client. Prepared, on time, and gave helpful feedback.'
    WHEN 2 THEN 'Wonderful experience. Knew exactly what they wanted.'
    WHEN 3 THEN 'Easy collaboration. Would work with them again anytime.'
    WHEN 4 THEN 'Super respectful of my time. Came prepared and communicated well.'
    WHEN 5 THEN 'One of the best clients I have had. Clear expectations and great communication.'
    WHEN 6 THEN 'Pleasure to work with. Left a thoughtful review too.'
    WHEN 7 THEN 'Awesome client. Brought all the materials I needed upfront.'
    WHEN 8 THEN 'Good client overall. Responsive and clear about expectations.'
    WHEN 9 THEN 'Nice to work with. A few changes mid-session but nothing major.'
    WHEN 10 THEN 'Solid experience. Could have been a bit more prepared but was respectful.'
    WHEN 11 THEN 'Good communication. Would work with them again.'
    WHEN 12 THEN 'Pleasant interaction. Flexible and understanding.'
    WHEN 13 THEN 'Easy-going client. Minor scheduling change but handled it well.'
    WHEN 14 THEN 'Okay experience. Changed requirements a few times.'
    WHEN 15 THEN 'Average client. Needed more direction but was cooperative.'
    ELSE 'Decent to work with. Could improve on being more prepared.'
  END AS comment,
  (o.completed_at + INTERVAL (4 + (o.id % 96)) HOUR + INTERVAL (o.id % 5) DAY) AS created_at
FROM orders o
WHERE o.status = 'completed'
ORDER BY o.id
LIMIT 1500;

-- ------------------------------------------------------------
-- 13) REVIEW VOTES — 8000
-- ------------------------------------------------------------
INSERT IGNORE INTO review_votes (review_id, user_id, created_at)
SELECT
  ((s.n - 1) % (SELECT COUNT(*) FROM reviews)) + 1 AS review_id,
  ((s.n * 17 - 1) % 1000) + 2 AS user_id,
  (TIMESTAMP('2025-06-01 12:00:00') + INTERVAL (s.n % 260) DAY + INTERVAL ((s.n * 7) % 1440) MINUTE + INTERVAL (s.n * 151 % 60) SECOND) AS created_at
FROM seq s
WHERE s.n BETWEEN 1 AND 8000;

-- ------------------------------------------------------------
-- 14) CONVERSATIONS — ~2000 with context fields
-- 60% linked to a service, 20% order, 10% request, 10% general
-- ------------------------------------------------------------
INSERT IGNORE INTO conversations
(user_one_id, user_two_id, last_message, last_message_at, context_type, context_id, context_title, created_at)
SELECT
  LEAST(u1, u2) AS user_one_id,
  GREATEST(u1, u2) AS user_two_id,
  CASE (x.n % 12)
    WHEN 0 THEN 'Thanks — what are the next steps?'
    WHEN 1 THEN 'I can start tonight if that works.'
    WHEN 2 THEN 'Do you have a sample or reference?'
    WHEN 3 THEN 'Got it. I will send an update shortly.'
    WHEN 4 THEN 'Can we adjust scope slightly?'
    WHEN 5 THEN 'Confirming schedule and deliverables.'
    WHEN 6 THEN 'That works — let us do it.'
    WHEN 7 THEN 'I think we can get this done quickly.'
    WHEN 8 THEN 'Perfect. Sending details now.'
    WHEN 9 THEN 'All done! Let me know if you need anything else.'
    WHEN 10 THEN 'Sure, I can adjust the approach. No problem.'
    ELSE 'Sounds good. Talk soon.'
  END AS last_message,
  LEAST(
    TIMESTAMP('2026-02-14 12:00:00'),
    (TIMESTAMP('2025-04-01 10:00:00') + INTERVAL FLOOR((319 * (x.n - 1)) / 1999) DAY + INTERVAL ((x.n * 13) % 1440) MINUTE + INTERVAL (x.n % 120) DAY)
  ) AS last_message_at,
  CASE WHEN x.n % 10 < 6 THEN 'service' WHEN x.n % 10 < 8 THEN 'order' WHEN x.n % 10 < 9 THEN 'request' ELSE NULL END AS context_type,
  CASE WHEN x.n % 10 < 6 THEN ((x.n * 3 - 1) % 2000) + 1 WHEN x.n % 10 < 8 THEN ((x.n * 7 - 1) % 5000) + 1 WHEN x.n % 10 < 9 THEN ((x.n * 11 - 1) % 800) + 1 ELSE NULL END AS context_id,
  CASE WHEN x.n % 10 < 6 THEN (SELECT s.title FROM services s WHERE s.id = ((x.n * 3 - 1) % 2000) + 1 LIMIT 1) WHEN x.n % 10 < 8 THEN CONCAT('Order #', ((x.n * 7 - 1) % 5000) + 1) WHEN x.n % 10 < 9 THEN (SELECT r.title FROM requests r WHERE r.id = ((x.n * 11 - 1) % 800) + 1 LIMIT 1) ELSE NULL END AS context_title,
  (TIMESTAMP('2025-04-01 10:00:00') + INTERVAL FLOOR((319 * (x.n - 1)) / 1999) DAY + INTERVAL ((x.n * 13) % 1440) MINUTE + INTERVAL (x.n * 89 % 60) SECOND) AS created_at
FROM (
  SELECT s.n,
    ((s.n * 3 - 1) % 1000) + 2 AS u1,
    ((s.n * 3 + (s.n % 97) + 5 - 1) % 1000) + 2 AS u2
  FROM seq s
  WHERE s.n BETWEEN 1 AND 2000
) x
WHERE x.u1 <> x.u2;

-- ------------------------------------------------------------
-- 15) MESSAGES — ~20000 with proper two-way conversations
-- Each conversation gets 10 messages alternating between users.
-- Messages follow a natural arc:
--   msg 0: opener (user_one initiates)
--   msg 1: reply (user_two responds)
--   msg 2-3: scheduling/negotiation
--   msg 4-6: progress updates
--   msg 7-9: wrap-up / thanks
-- Body varies by conversation ID to avoid repetition.
-- Timestamps are monotonically increasing within each conversation.
-- ------------------------------------------------------------
DROP TABLE IF EXISTS conv_map;
CREATE TABLE conv_map AS
SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn FROM conversations;

SET @ccount = (SELECT COUNT(*) FROM conv_map);

INSERT INTO messages (conversation_id, sender_id, body, read_at, created_at)
SELECT
  c.id AS conversation_id,
  -- Alternate sender: even msg_seq = user_one (initiator), odd = user_two (responder)
  CASE WHEN sub.msg_seq % 2 = 0 THEN c.user_one_id ELSE c.user_two_id END AS sender_id,
  -- Body depends on msg_seq (stage) AND c.id (variety)
  CASE sub.msg_seq
    WHEN 0 THEN -- OPENER (user_one initiates)
      CASE (c.id % 12)
        WHEN 0 THEN 'Hey, I saw your listing — are you available this week?'
        WHEN 1 THEN 'Hi! I am interested in booking a session. What does your availability look like?'
        WHEN 2 THEN 'Quick question about your service — is it still offered?'
        WHEN 3 THEN 'Hey there! A friend recommended you. Taking new clients?'
        WHEN 4 THEN 'Hi, I have a project that could use your skills. Mind if I share some details?'
        WHEN 5 THEN 'I need help with something and your profile looks like a great fit.'
        WHEN 6 THEN 'Hey! Came across your listing and I am super interested.'
        WHEN 7 THEN 'Hi — I saw your reviews and would love to work together.'
        WHEN 8 THEN 'Quick question before I book: do you offer a trial or intro session?'
        WHEN 9 THEN 'Hey, do you have any openings this month? I need help soon.'
        WHEN 10 THEN 'Hi! I have been looking for someone with your exact skill set.'
        ELSE 'Hey — your listing caught my eye. Are you free to chat about it?'
      END
    WHEN 1 THEN -- REPLY (user_two responds)
      CASE (c.id % 12)
        WHEN 0 THEN 'Hey! Yes, I am available. What do you need help with?'
        WHEN 1 THEN 'Hi! Thanks for reaching out. I have got some slots open this week.'
        WHEN 2 THEN 'Absolutely! Happy to help. Can you tell me more about what you need?'
        WHEN 3 THEN 'Hey, thanks for the message! I am definitely taking new clients right now.'
        WHEN 4 THEN 'Sure thing — share the details and I will let you know if it is a good fit.'
        WHEN 5 THEN 'Hey! I would love to help. What is the timeline looking like?'
        WHEN 6 THEN 'Thanks for reaching out! Let me know more about the scope.'
        WHEN 7 THEN 'Appreciate the kind words! Happy to set something up.'
        WHEN 8 THEN 'Yes, I can do a short intro session. When works for you?'
        WHEN 9 THEN 'I have some openings! Depends on the scope though — what are you working on?'
        WHEN 10 THEN 'Great to hear that! Tell me a bit about the project.'
        ELSE 'Hey — glad my profile stood out! Let me know the details and we can go from there.'
      END
    WHEN 2 THEN -- SCHEDULING (user_one)
      CASE (c.id % 10)
        WHEN 0 THEN 'Would Tuesday afternoon or Thursday morning work for you?'
        WHEN 1 THEN 'I am free most evenings. Can we do a 1-hour session this week?'
        WHEN 2 THEN 'I am flexible — what is your best day and time?'
        WHEN 3 THEN 'Could we meet on campus or do you prefer virtual?'
        WHEN 4 THEN 'How about we start with a 30-minute session to see how it goes?'
        WHEN 5 THEN 'I am thinking Wednesday around 3pm. Does that work?'
        WHEN 6 THEN 'Would you be open to a weekend session? Weekdays are packed for me.'
        WHEN 7 THEN 'I can do any day except Monday. What is best for you?'
        WHEN 8 THEN 'Let me check my schedule... how about Friday at 2?'
        ELSE 'I would prefer evenings if possible. Is 7pm too late?'
      END
    WHEN 3 THEN -- SCHEDULING REPLY (user_two)
      CASE (c.id % 10)
        WHEN 0 THEN 'Thursday morning works perfectly. I will block off 10am.'
        WHEN 1 THEN 'Evenings are great for me. How about Wednesday at 7?'
        WHEN 2 THEN 'I am most free on Tuesdays and Fridays. Pick whichever.'
        WHEN 3 THEN 'Virtual is easier for me. I will send a Zoom link before we start.'
        WHEN 4 THEN 'A 30-minute intro sounds smart. Let us do it and go from there.'
        WHEN 5 THEN 'Wednesday at 3 is perfect. I will add it to my calendar.'
        WHEN 6 THEN 'Saturday afternoon works for me! How about 1pm?'
        WHEN 7 THEN 'Tuesday at 4 works great. See you then!'
        WHEN 8 THEN 'Friday at 2 is good. I will send a reminder the day before.'
        ELSE 'No worries — 7pm is fine. I am a night owl anyway.'
      END
    WHEN 4 THEN -- PROGRESS 1 (user_one)
      CASE (c.id % 10)
        WHEN 0 THEN 'Just shared the files you asked for. Let me know if anything is missing.'
        WHEN 1 THEN 'I started working on the prep you suggested. Making progress!'
        WHEN 2 THEN 'Quick question — should I focus more on the first section or second?'
        WHEN 3 THEN 'Here is what I have so far. Let me know your thoughts.'
        WHEN 4 THEN 'Thanks for the session yesterday — already seeing improvement.'
        WHEN 5 THEN 'I ran into a small issue. Can I send you a screenshot?'
        WHEN 6 THEN 'The approach you suggested is working really well so far.'
        WHEN 7 THEN 'I finished the exercises you recommended. Ready for the next step.'
        WHEN 8 THEN 'Following up from our last session — I have a couple of questions.'
        ELSE 'Things are clicking now. Feeling way more confident than before.'
      END
    WHEN 5 THEN -- PROGRESS 2 (user_two)
      CASE (c.id % 10)
        WHEN 0 THEN 'Got the files — looking through them now. I will have feedback by tonight.'
        WHEN 1 THEN 'Great to hear! Keep at it and we will review progress next session.'
        WHEN 2 THEN 'Focus on the first section for now. We will tackle the second part next time.'
        WHEN 3 THEN 'Looks solid so far! I left some notes for you to review.'
        WHEN 4 THEN 'Glad to hear it! That is exactly the kind of progress I was hoping for.'
        WHEN 5 THEN 'Sure, send it over. I will take a look and get back to you.'
        WHEN 6 THEN 'Awesome — I knew that approach would work well for your situation.'
        WHEN 7 THEN 'Nice work! Here is the next set of exercises to try before we meet again.'
        WHEN 8 THEN 'Of course — shoot your questions and I will answer them before our session.'
        ELSE 'That is really great progress. You are picking this up faster than most people.'
      END
    WHEN 6 THEN -- PROGRESS 3 (user_one)
      CASE (c.id % 10)
        WHEN 0 THEN 'Your feedback was super helpful. I made the changes you suggested.'
        WHEN 1 THEN 'Quick update — I finished the assignment we discussed. Feels good!'
        WHEN 2 THEN 'Can we schedule one more session before the deadline?'
        WHEN 3 THEN 'Just wanted to confirm we are still on for the next session.'
        WHEN 4 THEN 'I sent over the updated version. Let me know what you think.'
        WHEN 5 THEN 'Thanks for the quick reply! That fixed the issue.'
        WHEN 6 THEN 'Making great progress. Should be ready to wrap up soon.'
        WHEN 7 THEN 'Almost done with everything. Just a few small things left.'
        WHEN 8 THEN 'Do you think we need another session or are we in good shape?'
        ELSE 'Everything is coming together nicely. Really appreciate your help.'
      END
    WHEN 7 THEN -- WRAP-UP 1 (user_two)
      CASE (c.id % 10)
        WHEN 0 THEN 'Looking great! I think we can wrap up after one final review.'
        WHEN 1 THEN 'Congrats on finishing! Let me know if you need anything else.'
        WHEN 2 THEN 'Sure, let us do one more. I will find a time that works.'
        WHEN 3 THEN 'Yes, still on! See you at the usual time.'
        WHEN 4 THEN 'The updated version looks much better. Nice work!'
        WHEN 5 THEN 'Happy to help! Glad that sorted it out.'
        WHEN 6 THEN 'Sounds like you are in great shape. Proud of the progress!'
        WHEN 7 THEN 'You are almost there! Let me know when you want to do a final check.'
        WHEN 8 THEN 'I think we are in good shape. But happy to do a quick check-in if you want.'
        ELSE 'Same here — it has been really fun working together on this.'
      END
    WHEN 8 THEN -- WRAP-UP 2 (user_one)
      CASE (c.id % 10)
        WHEN 0 THEN 'Everything looks great, thank you so much for everything!'
        WHEN 1 THEN 'Seriously, this was incredible. Best experience I have had.'
        WHEN 2 THEN 'Left you a review — you totally deserve it. Thanks again!'
        WHEN 3 THEN 'Thanks for all the help. I feel so much more prepared now.'
        WHEN 4 THEN 'This was exactly what I needed. Will definitely book again.'
        WHEN 5 THEN 'You made this so much less stressful. Genuinely appreciate it.'
        WHEN 6 THEN 'Already recommended you to a couple friends. You are amazing!'
        WHEN 7 THEN 'Cannot believe how much I learned. Thank you!'
        WHEN 8 THEN 'All done on my end. Thank you for being so thorough!'
        ELSE 'Perfect outcome. You went above and beyond — thank you.'
      END
    WHEN 9 THEN -- WRAP-UP 3 (user_two)
      CASE (c.id % 10)
        WHEN 0 THEN 'You are very welcome! It was great working with you.'
        WHEN 1 THEN 'Thank you for the kind words! Reach out anytime you need help.'
        WHEN 2 THEN 'Appreciate the review! Wishing you the best going forward.'
        WHEN 3 THEN 'Glad I could help! You are going to do great.'
        WHEN 4 THEN 'Would love to work together again. Good luck with everything!'
        WHEN 5 THEN 'That means a lot! Always here if you need anything.'
        WHEN 6 THEN 'Wow, thank you! That really makes my day.'
        WHEN 7 THEN 'It was a pleasure! You put in the work and it shows.'
        WHEN 8 THEN 'Happy to help! Do not hesitate to reach out in the future.'
        ELSE 'Thank you! Great working with you. Take care!'
      END
    ELSE 'Thanks for everything!'
  END AS body,
  -- read_at: last 1-2 messages in ~30% of conversations are unread
  CASE
    WHEN sub.msg_seq >= 9 AND c.id % 3 = 0 THEN NULL
    WHEN sub.msg_seq >= 8 AND c.id % 5 = 0 THEN NULL
    ELSE CURRENT_TIMESTAMP
  END AS read_at,
  -- Timestamps: monotonically increasing within each conversation
  -- Space messages hours to days apart
  (c.created_at
    + INTERVAL (sub.msg_seq * (3 + (c.id % 5))) HOUR
    + INTERVAL (sub.msg_seq * (c.id % 48)) HOUR
    + INTERVAL ((c.id * 7 + sub.msg_seq * 41) % 60) MINUTE
    + INTERVAL ((c.id * 13 + sub.msg_seq * 67) % 60) SECOND
  ) AS created_at
FROM (
  SELECT
    s.n,
    (((s.n - 1) % @ccount) + 1) AS conv_rn,
    FLOOR((s.n - 1) / @ccount) AS msg_seq
  FROM seq s
  WHERE s.n BETWEEN 1 AND (@ccount * 10)
) sub
JOIN conv_map cm ON cm.rn = sub.conv_rn
JOIN conversations c ON c.id = cm.id;

-- Update conversations.last_message and last_message_at from actual messages
UPDATE conversations c
SET
  c.last_message = (SELECT m.body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1),
  c.last_message_at = (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1);

-- ------------------------------------------------------------
-- 16) SHOP PURCHASES — ~5000
-- Five rounds: each user gets a different item per round.
-- Uses coprime multipliers to spread across all 30 items.
-- INSERT IGNORE handles any duplicate (user_id, item_id) pairs.
-- ------------------------------------------------------------
INSERT IGNORE INTO shop_purchases (user_id, item_id, price_paid, created_at)
SELECT
  sub.u_id,
  sub.i_id,
  (SELECT si.price FROM shop_items si WHERE si.id = sub.i_id),
  (TIMESTAMP('2025-04-15 12:00:00')
    + INTERVAL FLOOR((320 * (sub.src_n - 1)) / 4999) DAY
    + INTERVAL ((sub.src_n * 9) % 1440) MINUTE
    + INTERVAL (sub.src_n * 197 % 60) SECOND) AS created_at
FROM (
  -- Round 1: each user buys item based on (id*7+1) % 30
  SELECT s.n AS src_n, s.n AS u_id, ((s.n * 7 + 1) % 30) + 1 AS i_id
  FROM seq s WHERE s.n BETWEEN 2 AND 1001
  UNION ALL
  -- Round 2: each user buys item based on (id*13+5) % 30
  SELECT s.n + 1000 AS src_n, s.n AS u_id, ((s.n * 13 + 5) % 30) + 1 AS i_id
  FROM seq s WHERE s.n BETWEEN 2 AND 1001
  UNION ALL
  -- Round 3: each user buys item based on (id*19+11) % 30
  SELECT s.n + 2000 AS src_n, s.n AS u_id, ((s.n * 19 + 11) % 30) + 1 AS i_id
  FROM seq s WHERE s.n BETWEEN 2 AND 1001
  UNION ALL
  -- Round 4: each user buys item based on (id*23+17) % 30
  SELECT s.n + 3000 AS src_n, s.n AS u_id, ((s.n * 23 + 17) % 30) + 1 AS i_id
  FROM seq s WHERE s.n BETWEEN 2 AND 1001
  UNION ALL
  -- Round 5: each user buys item based on (id*29+23) % 30
  SELECT s.n + 4000 AS src_n, s.n AS u_id, ((s.n * 29 + 23) % 30) + 1 AS i_id
  FROM seq s WHERE s.n BETWEEN 2 AND 1001
) sub;

-- ------------------------------------------------------------
-- 17) EQUIP COSMETICS — based on actual purchases
-- Uses CRC32 hash for eligibility to avoid correlation with purchase multipliers.
-- Rates: ~50% frame, ~40% badge, ~20% theme
-- Item selection uses CRC32(CONCAT(...)) for uniform variety across all variants.
-- ------------------------------------------------------------
UPDATE users u
SET u.active_frame_id = (
  SELECT sp.item_id FROM shop_purchases sp
  JOIN shop_items si ON si.id = sp.item_id AND si.type = 'frame'
  WHERE sp.user_id = u.id
  ORDER BY CRC32(CONCAT(u.id, '-frame-', sp.item_id)) DESC LIMIT 1
)
WHERE CRC32(CONCAT('frame-equip-', u.id)) % 10 < 5
AND EXISTS (
  SELECT 1 FROM shop_purchases sp
  JOIN shop_items si ON si.id = sp.item_id AND si.type = 'frame'
  WHERE sp.user_id = u.id
);

UPDATE users u
SET u.active_badge_id = (
  SELECT sp.item_id FROM shop_purchases sp
  JOIN shop_items si ON si.id = sp.item_id AND si.type = 'badge'
  WHERE sp.user_id = u.id
  ORDER BY CRC32(CONCAT(u.id, '-badge-', sp.item_id)) DESC LIMIT 1
)
WHERE CRC32(CONCAT('badge-equip-', u.id)) % 10 < 4
AND EXISTS (
  SELECT 1 FROM shop_purchases sp
  JOIN shop_items si ON si.id = sp.item_id AND si.type = 'badge'
  WHERE sp.user_id = u.id
);

UPDATE users u
SET u.active_theme_id = (
  SELECT sp.item_id FROM shop_purchases sp
  JOIN shop_items si ON si.id = sp.item_id AND si.type = 'theme'
  WHERE sp.user_id = u.id
  ORDER BY CRC32(CONCAT(u.id, '-theme-', sp.item_id)) DESC LIMIT 1
)
WHERE CRC32(CONCAT('theme-equip-', u.id)) % 10 < 2
AND EXISTS (
  SELECT 1 FROM shop_purchases sp
  JOIN shop_items si ON si.id = sp.item_id AND si.type = 'theme'
  WHERE sp.user_id = u.id
);

-- ------------------------------------------------------------
-- 18) TRANSACTIONS
-- Welcome bonus → order spending → earnings → refunds → shop purchases
-- Then deposit top-ups to ensure no negative balances
-- ------------------------------------------------------------

-- Welcome bonus (10 HiveCoins per user on signup)
INSERT INTO transactions (user_id, type, amount, description, order_id, created_at)
SELECT u.id, 'bonus', 10.00, 'Welcome bonus', NULL, u.created_at
FROM users u WHERE u.role != 'admin';

-- Order spending (client pays total)
INSERT INTO transactions (user_id, type, amount, description, order_id, created_at)
SELECT o.client_id, 'spending', o.total, CONCAT('Order payment for service #', o.service_id), o.id, o.created_at
FROM orders o;

-- Earnings (provider gets price on completion)
INSERT INTO transactions (user_id, type, amount, description, order_id, created_at)
SELECT o.provider_id, 'earning', o.price, CONCAT('Earnings for order #', o.id), o.id, o.completed_at
FROM orders o WHERE o.status = 'completed';

-- Refunds (client gets total back on cancellation)
INSERT INTO transactions (user_id, type, amount, description, order_id, created_at)
SELECT o.client_id, 'refund', o.total, CONCAT('Refund for cancelled order #', o.id), o.id, (o.created_at + INTERVAL (6 + (o.id % 48)) HOUR)
FROM orders o WHERE o.status = 'cancelled';

-- Shop purchase transactions
INSERT INTO transactions (user_id, type, amount, description, order_id, created_at)
SELECT sp.user_id, 'purchase', sp.price_paid, CONCAT('Shop purchase: ', si.name), NULL, sp.created_at
FROM shop_purchases sp
JOIN shop_items si ON si.id = sp.item_id;

-- Deposit top-ups: ensure no user has negative balance
-- Add a proportional deposit (just enough + small buffer) tied to a realistic promo date
INSERT INTO transactions (user_id, type, amount, description, order_id, created_at)
SELECT
  neg.user_id,
  'bonus',
  ROUND(ABS(neg.bal) + (neg.user_id * 17 % 15) + 1, 2),
  'HiveCoin campus promotion',
  NULL,
  (SELECT u.created_at + INTERVAL (30 + (u.id % 60)) DAY FROM users u WHERE u.id = neg.user_id)
FROM (
  SELECT t.user_id,
    SUM(CASE WHEN t.type IN ('earning','refund','bonus') THEN t.amount ELSE -t.amount END) AS bal
  FROM transactions t
  GROUP BY t.user_id
  HAVING bal < 0
) neg;

-- ------------------------------------------------------------
-- 19) NOTIFICATIONS — ~3000 across all types
-- order_status, payment, review, proposal, message
-- ~30% unread, rest read
-- ------------------------------------------------------------

-- Order status notifications (for completed orders → client)
INSERT INTO notifications (user_id, type, title, body, link, actor_id, is_read, created_at)
SELECT
  o.client_id,
  'order_status',
  'Order Completed',
  CONCAT('Your order #', o.id, ' has been completed'),
  CONCAT('/orders/', o.id),
  o.provider_id,
  CASE WHEN o.id % 3 = 0 THEN 0 ELSE 1 END,
  o.completed_at + INTERVAL 1 MINUTE
FROM orders o
WHERE o.status = 'completed'
ORDER BY o.id
LIMIT 800;

-- Payment notifications (for completed orders → provider)
INSERT INTO notifications (user_id, type, title, body, link, actor_id, is_read, created_at)
SELECT
  o.provider_id,
  'payment',
  'Payment Released',
  CONCAT('$', o.price, ' released for order #', o.id),
  CONCAT('/orders/', o.id),
  NULL,
  CASE WHEN o.id % 4 = 0 THEN 0 ELSE 1 END,
  o.completed_at + INTERVAL 5 MINUTE
FROM orders o
WHERE o.status = 'completed' AND o.payment_status = 'released'
ORDER BY o.id
LIMIT 500;

-- Review notifications (→ provider)
INSERT INTO notifications (user_id, type, title, body, link, actor_id, is_read, created_at)
SELECT
  r.provider_id,
  'review',
  'New Review',
  CONCAT('You received a ', r.rating, '-star review'),
  CONCAT('/services/', r.service_id),
  r.reviewer_id,
  CASE WHEN r.id % 3 = 0 THEN 0 ELSE 1 END,
  r.created_at + INTERVAL 1 MINUTE
FROM reviews r
ORDER BY r.id
LIMIT 500;

-- Proposal notifications (→ requester)
INSERT INTO notifications (user_id, type, title, body, link, actor_id, is_read, created_at)
SELECT
  req.requester_id,
  'proposal',
  'New Proposal',
  CONCAT('You received a new proposal for "', LEFT(req.title, 60), '"'),
  CONCAT('/requests/', req.id),
  p.provider_id,
  CASE WHEN p.id % 3 = 0 THEN 0 ELSE 1 END,
  p.created_at + INTERVAL 2 MINUTE
FROM proposals p
JOIN requests req ON req.id = p.request_id
ORDER BY p.id
LIMIT 700;

-- Message notifications (sampling from messages → recipient)
INSERT INTO notifications (user_id, type, title, body, link, actor_id, is_read, created_at)
SELECT
  CASE WHEN m.sender_id = c.user_one_id THEN c.user_two_id ELSE c.user_one_id END AS user_id,
  'message',
  'New Message',
  LEFT(m.body, 80),
  CONCAT('/messages/', c.id),
  m.sender_id,
  CASE WHEN m.id % 4 = 0 THEN 0 ELSE 1 END,
  m.created_at + INTERVAL 30 SECOND
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE m.id % 40 = 0
ORDER BY m.id
LIMIT 500;

-- ------------------------------------------------------------
-- 20) TOKENS
-- Email verification for all users, password reset for ~20%
-- ------------------------------------------------------------
INSERT INTO tokens (user_id, type, token, expires_at, used, created_at)
SELECT
  u.id,
  'email_verification',
  SHA2(CONCAT('seed_token_', u.id, '_email_verification'), 256),
  (u.created_at + INTERVAL 7 DAY),
  CASE WHEN u.verified = 1 THEN 1 ELSE 0 END,
  (u.created_at + INTERVAL (10 + (u.id % 180)) MINUTE)
FROM users u;

INSERT INTO tokens (user_id, type, token, expires_at, used, created_at)
SELECT
  u.id,
  'password_reset',
  SHA2(CONCAT('seed_token_', u.id, '_password_reset'), 256),
  (TIMESTAMP('2026-02-14 12:00:00') + INTERVAL (u.id % 10) DAY),
  CASE WHEN u.id % 17 = 0 THEN 1 ELSE 0 END,
  (TIMESTAMP('2026-02-14 12:00:00') - INTERVAL (u.id % 120) DAY - INTERVAL (u.id % 1440) MINUTE)
FROM users u
WHERE u.id % 5 = 0;

-- ------------------------------------------------------------
-- 21) POST-SEED FIXES
-- Recompute hivecoin_balance from transactions (guaranteed >= 0)
-- Recompute services avg_rating + review_count from reviews
-- ------------------------------------------------------------
UPDATE users u
SET u.hivecoin_balance = (
  SELECT COALESCE(SUM(
    CASE WHEN t.type IN ('earning','refund','bonus') THEN t.amount ELSE -t.amount END
  ), 0)
  FROM transactions t WHERE t.user_id = u.id
);

UPDATE services s
SET
  s.avg_rating = COALESCE((SELECT ROUND(AVG(r.rating), 2) FROM reviews r WHERE r.service_id = s.id), 0.00),
  s.review_count = (SELECT COUNT(*) FROM reviews r WHERE r.service_id = s.id);

-- ------------------------------------------------------------
-- Cleanup
-- ------------------------------------------------------------
DROP TABLE IF EXISTS seq;
DROP TABLE IF EXISTS fn_pool;
DROP TABLE IF EXISTS ln_pool;
DROP TABLE IF EXISTS uni_pool;
DROP TABLE IF EXISTS major_pool;
DROP TABLE IF EXISTS svc_title_pool;
DROP TABLE IF EXISTS conv_map;

COMMIT;

-- ------------------------------------------------------------
-- Sanity counts
-- ------------------------------------------------------------
SELECT
  (SELECT COUNT(*) FROM users)          AS users_count,
  (SELECT SUM(verified) FROM users)     AS verified_users,
  (SELECT COUNT(*) FROM services)       AS services_count,
  (SELECT COUNT(*) FROM service_images) AS service_images_count,
  (SELECT COUNT(*) FROM requests)       AS requests_count,
  (SELECT COUNT(*) FROM proposals)      AS proposals_count,
  (SELECT COUNT(*) FROM orders)         AS orders_count,
  (SELECT COUNT(*) FROM reviews)        AS reviews_count,
  (SELECT COUNT(*) FROM client_reviews) AS client_reviews_count,
  (SELECT COUNT(*) FROM review_votes)   AS review_votes_count,
  (SELECT COUNT(*) FROM conversations)  AS conversations_count,
  (SELECT COUNT(*) FROM messages)       AS messages_count,
  (SELECT COUNT(*) FROM transactions)   AS transactions_count,
  (SELECT COUNT(*) FROM shop_items)     AS shop_items_count,
  (SELECT COUNT(*) FROM shop_purchases) AS shop_purchases_count,
  (SELECT COUNT(*) FROM notifications)  AS notifications_count,
  (SELECT COUNT(*) FROM tokens)         AS tokens_count,
  (SELECT MIN(hivecoin_balance) FROM users) AS min_balance,
  (SELECT ROUND(AVG(hivecoin_balance), 2) FROM users) AS avg_balance;
