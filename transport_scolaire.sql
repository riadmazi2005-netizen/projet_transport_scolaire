-- ============================================
-- TRANSPORT SCOLAIRE - BASE DE DONNÃ‰ES COMPLÃˆTE
-- ============================================
-- Ce fichier contient :
-- 1. Le schÃ©ma complet de la base de donnÃ©es (SANS colonne role)
-- 2. Tables sÃ©parÃ©es : administrateurs, tuteurs, chauffeurs, responsables_bus
-- 3. Toutes les amÃ©liorations et migrations intÃ©grÃ©es
-- 4. Les donnÃ©es de test complÃ¨tes
-- 
-- MOT DE PASSE POUR TOUS LES COMPTES DE TEST : test123
-- Hash bcrypt pour "test123" : $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- ============================================

-- CrÃ©er la base de donnÃ©es
CREATE DATABASE IF NOT EXISTS transport_scolaire;
USE transport_scolaire;

-- ============================================
-- 1. SCHÃ‰MA DE LA BASE DE DONNÃ‰ES
-- ============================================

-- Table utilisateurs (table de base pour tous les types d'utilisateurs)
-- PAS de colonne role - le type est dÃ©terminÃ© par la prÃ©sence dans les tables spÃ©cifiques
CREATE TABLE utilisateurs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    mot_de_passe_plain VARCHAR(255) NULL COMMENT 'Mot de passe en clair (pour affichage admin uniquement - NON SÃ‰CURISÃ‰)',
    telephone VARCHAR(20) UNIQUE,
    statut ENUM('Actif', 'Inactif') DEFAULT 'Actif',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table administrateurs (accÃ¨s unique - un utilisateur ne peut Ãªtre que dans UNE table)
CREATE TABLE administrateurs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    utilisateur_id INT UNIQUE NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- Table tuteurs
CREATE TABLE tuteurs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    utilisateur_id INT UNIQUE NOT NULL,
    adresse TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- Table chauffeurs
CREATE TABLE chauffeurs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    utilisateur_id INT UNIQUE NOT NULL,
    numero_permis VARCHAR(50) UNIQUE NOT NULL,
    date_expiration_permis DATE,
    nombre_accidents INT DEFAULT 0,
    salaire DECIMAL(10,2) DEFAULT 0 NULL,
    statut ENUM('Actif', 'LicenciÃ©', 'Suspendu') DEFAULT 'Actif',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- Table responsables_bus
CREATE TABLE responsables_bus (
    id INT PRIMARY KEY AUTO_INCREMENT,
    utilisateur_id INT UNIQUE NOT NULL,
    zone_responsabilite VARCHAR(100),
    salaire DECIMAL(10,2) DEFAULT 0 NULL,
    statut ENUM('Actif', 'Inactif') DEFAULT 'Actif',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- Table eleves (rÃ©fÃ©rence maintenant tuteurs au lieu de utilisateurs)
CREATE TABLE eleves (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    date_naissance DATE,
    adresse TEXT,
    telephone_parent VARCHAR(20),
    email_parent VARCHAR(150),
    classe VARCHAR(50),
    tuteur_id INT,
    statut ENUM('Actif', 'Inactif') DEFAULT 'Actif',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tuteur_id) REFERENCES tuteurs(id) ON DELETE SET NULL
);

-- Table zones
CREATE TABLE IF NOT EXISTS zones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    ville VARCHAR(100) NOT NULL DEFAULT 'Rabat',
    description TEXT NULL,
    actif BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_zone_ville (nom, ville)
);

-- Table trajets
CREATE TABLE trajets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(255) NOT NULL,
    zones TEXT,
    heure_depart_matin_a TIME,
    heure_arrivee_matin_a TIME,
    heure_depart_soir_a TIME,
    heure_arrivee_soir_a TIME,
    heure_depart_matin_b TIME,
    heure_arrivee_matin_b TIME,
    heure_depart_soir_b TIME,
    heure_arrivee_soir_b TIME,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table bus
CREATE TABLE bus (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero VARCHAR(20) UNIQUE NOT NULL,
    marque VARCHAR(50),
    modele VARCHAR(50),
    annee_fabrication YEAR,
    capacite INT NOT NULL,
    chauffeur_id INT,
    responsable_id INT,
    trajet_id INT,
    statut ENUM('Actif', 'En maintenance', 'Hors service') DEFAULT 'Actif',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chauffeur_id) REFERENCES chauffeurs(id) ON DELETE SET NULL,
    FOREIGN KEY (responsable_id) REFERENCES responsables_bus(id) ON DELETE SET NULL,
    FOREIGN KEY (trajet_id) REFERENCES trajets(id) ON DELETE SET NULL
);

-- Table accidents (avec toutes les amÃ©liorations)
CREATE TABLE accidents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    heure TIME,
    bus_id INT,
    chauffeur_id INT,
    responsable_id INT NULL COMMENT 'ID du responsable qui a dÃ©clarÃ© l\'accident',
    description TEXT NOT NULL,
    degats TEXT,
    lieu VARCHAR(255),
    gravite ENUM('LÃ©gÃ¨re', 'Moyenne', 'Grave') NOT NULL,
    blesses BOOLEAN DEFAULT FALSE,
    nombre_eleves INT NULL,
    nombre_blesses INT NULL,
    photos TEXT NULL COMMENT 'JSON array of base64 encoded photos',
    eleves_concernees TEXT NULL COMMENT 'JSON array des IDs et noms des Ã©lÃ¨ves prÃ©sents dans le bus',
    statut ENUM('En attente', 'ValidÃ©') DEFAULT 'En attente' COMMENT 'Statut de validation du rapport par l\'administrateur',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES bus(id) ON DELETE SET NULL,
    FOREIGN KEY (chauffeur_id) REFERENCES chauffeurs(id) ON DELETE SET NULL,
    FOREIGN KEY (responsable_id) REFERENCES responsables_bus(id) ON DELETE SET NULL
);

-- Table notifications
-- destinataire_type est dÃ©terminÃ© par la prÃ©sence dans les tables spÃ©cifiques
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    destinataire_id INT NOT NULL,
    destinataire_type ENUM('chauffeur', 'responsable', 'tuteur', 'admin') NOT NULL,
    titre VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'alerte', 'avertissement', 'warning', 'success') DEFAULT 'info',
    lue BOOLEAN DEFAULT FALSE,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table demandes (rÃ©fÃ©rence maintenant tuteurs au lieu de utilisateurs)
-- Structure complÃ¨te avec toutes les amÃ©liorations (code de vÃ©rification, zone gÃ©ographique, etc.)
CREATE TABLE demandes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    eleve_id INT,
    tuteur_id INT NOT NULL,
    type_demande ENUM(
        'inscription', 
        'modification', 
        'desinscription',
        'Augmentation',
        'CongÃ©',
        'DÃ©mÃ©nagement',
        'Autre'
    ) NOT NULL,
    description TEXT,
    zone_geographique VARCHAR(50) NULL,
    code_verification VARCHAR(10) UNIQUE NULL,
    raison_refus TEXT NULL,
    montant_facture DECIMAL(10,2) NULL,
    statut ENUM(
        'En attente', 
        'En cours de traitement', 
        'En attente de paiement', 
        'PayÃ©e',
        'ValidÃ©e', 
        'Inscrit',
        'RefusÃ©e'
    ) DEFAULT 'En attente',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_traitement TIMESTAMP NULL,
    traite_par INT,
    FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE,
    FOREIGN KEY (tuteur_id) REFERENCES tuteurs(id) ON DELETE CASCADE,
    FOREIGN KEY (traite_par) REFERENCES administrateurs(id) ON DELETE SET NULL,
    INDEX idx_demandes_zone (zone_geographique),
    INDEX idx_demandes_statut (statut)
);

-- Table inscriptions
CREATE TABLE inscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    eleve_id INT NOT NULL,
    bus_id INT,
    date_inscription DATE NOT NULL,
    date_debut DATE,
    date_fin DATE,
    statut ENUM('Active', 'Suspendue', 'TerminÃ©e') DEFAULT 'Active',
    montant_mensuel DECIMAL(10,2),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE,
    FOREIGN KEY (bus_id) REFERENCES bus(id) ON DELETE SET NULL
);

-- Table paiements
CREATE TABLE paiements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    inscription_id INT NOT NULL,
    montant DECIMAL(10,2) NOT NULL,
    mois INT NOT NULL,
    annee YEAR NOT NULL,
    date_paiement DATE NOT NULL,
    mode_paiement ENUM('EspÃ¨ces', 'Virement', 'Carte bancaire', 'ChÃ¨que') DEFAULT 'EspÃ¨ces',
    statut ENUM('PayÃ©', 'En attente', 'Ã‰chouÃ©') DEFAULT 'PayÃ©',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inscription_id) REFERENCES inscriptions(id) ON DELETE CASCADE
);

-- Table presences (pour suivre les prÃ©sences et absences des Ã©lÃ¨ves)
CREATE TABLE presences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    eleve_id INT NOT NULL,
    date DATE NOT NULL,
    present_matin BOOLEAN DEFAULT FALSE,
    present_soir BOOLEAN DEFAULT FALSE,
    bus_id INT,
    responsable_id INT,
    chauffeur_id INT,
    remarque TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE,
    FOREIGN KEY (bus_id) REFERENCES bus(id) ON DELETE SET NULL,
    FOREIGN KEY (responsable_id) REFERENCES responsables_bus(id) ON DELETE SET NULL,
    FOREIGN KEY (chauffeur_id) REFERENCES chauffeurs(id) ON DELETE SET NULL,
    UNIQUE KEY unique_presence (eleve_id, date)
);

-- Table conduire (table de liaison entre chauffeurs et trajets)
CREATE TABLE conduire (
    id INT PRIMARY KEY AUTO_INCREMENT,
    chauffeur_id INT NOT NULL,
    trajet_id INT NOT NULL,
    bus_id INT,
    date_debut DATE NOT NULL,
    date_fin DATE,
    statut ENUM('Actif', 'TerminÃ©', 'Suspendu') DEFAULT 'Actif',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chauffeur_id) REFERENCES chauffeurs(id) ON DELETE CASCADE,
    FOREIGN KEY (trajet_id) REFERENCES trajets(id) ON DELETE CASCADE,
    FOREIGN KEY (bus_id) REFERENCES bus(id) ON DELETE SET NULL
);

-- Table prise_essence (pour les fonctionnalitÃ©s chauffeur)
CREATE TABLE IF NOT EXISTS prise_essence (
    id INT PRIMARY KEY AUTO_INCREMENT,
    chauffeur_id INT NOT NULL,
    bus_id INT NOT NULL,
    date DATE NOT NULL,
    heure TIME NOT NULL,
    quantite_litres DECIMAL(10,2) NOT NULL,
    prix_total DECIMAL(10,2) NOT NULL,
    kilometrage_actuel INT,
    station_service VARCHAR(255),
    photo_ticket VARCHAR(255),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chauffeur_id) REFERENCES chauffeurs(id) ON DELETE CASCADE,
    FOREIGN KEY (bus_id) REFERENCES bus(id) ON DELETE CASCADE,
    INDEX idx_chauffeur_date (chauffeur_id, date),
    INDEX idx_bus_date (bus_id, date)
);

-- Table rapports_trajet (pour les fonctionnalitÃ©s chauffeur)
CREATE TABLE IF NOT EXISTS rapports_trajet (
    id INT PRIMARY KEY AUTO_INCREMENT,
    chauffeur_id INT NOT NULL,
    bus_id INT NOT NULL,
    date DATE NOT NULL,
    periode ENUM('matin', 'soir') NOT NULL,
    heure_depart_prevue TIME,
    heure_depart_reelle TIME,
    heure_arrivee_prevue TIME,
    heure_arrivee_reelle TIME,
    nombre_eleves INT DEFAULT 0,
    kilometres_parcourus INT,
    problemes TEXT,
    observations TEXT,
    statut ENUM('planifie', 'en_cours', 'termine', 'annule') DEFAULT 'planifie',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chauffeur_id) REFERENCES chauffeurs(id) ON DELETE CASCADE,
    FOREIGN KEY (bus_id) REFERENCES bus(id) ON DELETE CASCADE,
    INDEX idx_chauffeur_date (chauffeur_id, date),
    INDEX idx_date_periode (date, periode)
);

-- Table checklist_depart (pour les fonctionnalitÃ©s chauffeur)
CREATE TABLE IF NOT EXISTS checklist_depart (
    id INT PRIMARY KEY AUTO_INCREMENT,
    chauffeur_id INT NOT NULL,
    bus_id INT NOT NULL,
    date DATE NOT NULL,
    periode ENUM('matin', 'soir') NOT NULL,
    essence_verifiee BOOLEAN DEFAULT FALSE,
    pneus_ok BOOLEAN DEFAULT FALSE,
    portes_ok BOOLEAN DEFAULT FALSE,
    eclairage_ok BOOLEAN DEFAULT FALSE,
    nettoyage_fait BOOLEAN DEFAULT FALSE,
    trousse_secours BOOLEAN DEFAULT FALSE,
    autres_verifications TEXT,
    validee BOOLEAN DEFAULT FALSE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chauffeur_id) REFERENCES chauffeurs(id) ON DELETE CASCADE,
    FOREIGN KEY (bus_id) REFERENCES bus(id) ON DELETE CASCADE,
    INDEX idx_chauffeur_date (chauffeur_id, date)
);

-- Table signalements_maintenance (pour les fonctionnalitÃ©s chauffeur)
CREATE TABLE IF NOT EXISTS signalements_maintenance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    chauffeur_id INT NOT NULL,
    bus_id INT NOT NULL,
    type_probleme ENUM('mecanique', 'eclairage', 'portes', 'climatisation', 'pneus', 'autre') NOT NULL,
    description TEXT NOT NULL,
    urgence ENUM('faible', 'moyenne', 'haute') DEFAULT 'moyenne',
    photo VARCHAR(255),
    statut ENUM('en_attente', 'en_cours', 'resolu') DEFAULT 'en_attente',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_resolution TIMESTAMP NULL,
    FOREIGN KEY (chauffeur_id) REFERENCES chauffeurs(id) ON DELETE CASCADE,
    FOREIGN KEY (bus_id) REFERENCES bus(id) ON DELETE CASCADE,
    INDEX idx_chauffeur (chauffeur_id),
    INDEX idx_bus (bus_id),
    INDEX idx_statut (statut)
);

-- ============================================
-- 2. INDEX POUR AMÃ‰LIORER LES PERFORMANCES
-- ============================================

CREATE INDEX idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX idx_administrateurs_utilisateur ON administrateurs(utilisateur_id);
CREATE INDEX idx_tuteurs_utilisateur ON tuteurs(utilisateur_id);
CREATE INDEX idx_chauffeurs_utilisateur ON chauffeurs(utilisateur_id);
CREATE INDEX idx_responsables_utilisateur ON responsables_bus(utilisateur_id);
CREATE INDEX idx_eleves_tuteur ON eleves(tuteur_id);
CREATE INDEX idx_bus_chauffeur ON bus(chauffeur_id);
CREATE INDEX idx_bus_responsable ON bus(responsable_id);
CREATE INDEX idx_bus_trajet ON bus(trajet_id);
CREATE INDEX idx_accidents_bus ON accidents(bus_id);
CREATE INDEX idx_accidents_chauffeur ON accidents(chauffeur_id);
CREATE INDEX idx_accidents_responsable ON accidents(responsable_id);
CREATE INDEX idx_notifications_destinataire ON notifications(destinataire_id, destinataire_type);
CREATE INDEX idx_inscriptions_bus ON inscriptions(bus_id);
CREATE INDEX idx_paiements_inscription ON paiements(inscription_id);
CREATE INDEX idx_presences_eleve ON presences(eleve_id);
CREATE INDEX idx_presences_date ON presences(date);
CREATE INDEX idx_presences_bus ON presences(bus_id);
CREATE INDEX idx_conduire_chauffeur ON conduire(chauffeur_id);
CREATE INDEX idx_conduire_trajet ON conduire(trajet_id);

-- ============================================
-- 3. DONNÃ‰ES DE TEST
-- ============================================
-- IMPORTANT: Tous les comptes utilisent le mot de passe "test123"
-- Hash bcrypt valide pour "test123": $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

-- 3.1. CrÃ©er les utilisateurs de base
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, statut) VALUES
-- Admin de test
('Admin', 'SystÃ¨me', 'admin@transport.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0612345678', 'Actif'),

-- Chauffeurs de test (3 chauffeurs)
('Idrissi', 'Ahmed', 'ahmed.idrissi@transport.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0612345682', 'Actif'),
('Tazi', 'Youssef', 'youssef.tazi@transport.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0612345683', 'Actif'),
('El Fassi', 'Karim', 'karim.elfassi@transport.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0612345684', 'Actif'),

-- Responsables de test (2 responsables)
('Kettani', 'Nadia', 'nadia.kettani@transport.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0612345685', 'Actif'),
('Benjelloun', 'Omar', 'omar.benjelloun@transport.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0612345686', 'Actif'),

-- Tuteurs de test (pour tester les relations)
('Alami', 'Mohammed', 'mohammed.alami@email.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0612345679', 'Actif'),
('Benjelloun', 'Fatima', 'fatima.benjelloun@email.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0612345680', 'Actif');

-- 3.2. CrÃ©er l'administrateur (utilisateur_id = 1)
INSERT INTO administrateurs (utilisateur_id) VALUES (1);

-- 3.3. CrÃ©er les chauffeurs
INSERT INTO chauffeurs (utilisateur_id, numero_permis, date_expiration_permis, nombre_accidents, statut) VALUES
(2, 'CH-001956', DATE_ADD(CURDATE(), INTERVAL 2 YEAR), 0, 'Actif'),        -- Ahmed Idrissi
(3, 'CH-009789', DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 1, 'Actif'),        -- Youssef Tazi
(4, 'CH-000123', DATE_ADD(CURDATE(), INTERVAL 3 YEAR), 0, 'Actif');        -- Karim El Fassi

-- 3.4. CrÃ©er les responsables bus
INSERT INTO responsables_bus (utilisateur_id, zone_responsabilite, statut) VALUES
(5, 'Zone Centre - Maarif, Gauthier, 2 Mars', 'Actif'),      -- Nadia Kettani
(6, 'Zone Nord - Sidi Maarouf, Californie, Oasis', 'Actif'); -- Omar Benjelloun

-- 3.5. CrÃ©er les tuteurs
INSERT INTO tuteurs (utilisateur_id) VALUES
(7),  -- Mohammed Alami
(8);  -- Fatima Benjelloun

-- 3.6. InsÃ©rer les zones avec leurs villes
-- Rabat â€“ 8 zones
INSERT INTO zones (nom, ville, actif) VALUES
('Agdal', 'Rabat', TRUE),
('Hassan', 'Rabat', TRUE),
('Hay Riad', 'Rabat', TRUE),
('Yacoub El Mansour', 'Rabat', TRUE),
('Souissi', 'Rabat', TRUE),
('Nahda', 'Rabat', TRUE),
('Akkari', 'Rabat', TRUE),
('Takkadoum', 'Rabat', TRUE)
ON DUPLICATE KEY UPDATE ville=VALUES(ville), actif=VALUES(actif);

-- SalÃ© â€“ 8 zones
INSERT INTO zones (nom, ville, actif) VALUES
('Hay Amal', 'SalÃ©', TRUE),
('Hay Karima', 'SalÃ©', TRUE),
('Hay Nbi3at', 'SalÃ©', TRUE),
('Sidi Moussa', 'SalÃ©', TRUE),
('Boulknadel', 'SalÃ©', TRUE),
('Sale Jadida', 'SalÃ©', TRUE),
('Harhoura', 'SalÃ©', TRUE),
('Maamora', 'SalÃ©', TRUE)
ON DUPLICATE KEY UPDATE ville=VALUES(ville), actif=VALUES(actif);

-- Temara â€“ 3 zones
INSERT INTO zones (nom, ville, actif) VALUES
('Temara Centre', 'Temara', TRUE),
('Milano', 'Temara', TRUE),
('Harhoura', 'Temara', TRUE)
ON DUPLICATE KEY UPDATE ville=VALUES(ville), actif=VALUES(actif);

-- 3.7. CrÃ©er les trajets
INSERT INTO trajets (nom, zones, heure_depart_matin_a, heure_arrivee_matin_a, heure_depart_soir_a, heure_arrivee_soir_a, heure_depart_matin_b, heure_arrivee_matin_b, heure_depart_soir_b, heure_arrivee_soir_b) VALUES
('Trajet Centre', '["Maarif", "Gauthier", "2 Mars", "Ain Diab"]', '07:30:00', '08:00:00', '17:00:00', '17:30:00', '08:00:00', '08:30:00', '17:30:00', '18:00:00'),
('Trajet Nord', '["Sidi Maarouf", "Californie", "Oasis", "Ain Sebaa"]', '07:00:00', '08:00:00', '16:45:00', '17:30:00', '07:45:00', '08:30:00', '17:15:00', '18:00:00'),
('Trajet Sud', '["Hay Hassani", "Oulfa", "Sbata", "Hay Mohammadi"]', '07:15:00', '08:00:00', '16:50:00', '17:35:00', '08:00:00', '08:45:00', '17:20:00', '18:05:00');

-- 3.8. CrÃ©er les bus
INSERT INTO bus (numero, marque, modele, annee_fabrication, capacite, chauffeur_id, responsable_id, trajet_id, statut) VALUES
('BUS-001', 'Mercedes', 'Sprinter', 2020, 50, 1, 1, 1, 'Actif'),    -- Chauffeur: Ahmed (chauffeur_id=1), Responsable: Nadia (responsable_id=1)
('BUS-002', 'Volvo', '9700', 2019, 45, 2, 1, 1, 'Actif'),           -- Chauffeur: Youssef (chauffeur_id=2), Responsable: Nadia
('BUS-003', 'Iveco', 'Daily', 2021, 35, 3, 2, 2, 'Actif'),          -- Chauffeur: Karim (chauffeur_id=3), Responsable: Omar (responsable_id=2)
('BUS-004', 'Mercedes', 'Sprinter', 2022, 50, NULL, 2, 3, 'Actif'); -- Pas de chauffeur assignÃ©, Responsable: Omar

-- 3.9. CrÃ©er des Ã©lÃ¨ves (rÃ©fÃ©rence maintenant tuteurs au lieu de utilisateurs)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES
-- Ã‰lÃ¨ves de Mohammed Alami (tuteur_id = 1)
('Alami', 'Yasmine', '2012-03-15', '123 Rue Maarif, Casablanca', '0612345679', 'mohammed.alami@email.ma', 'CE2', 1, 'Actif'),
('Alami', 'Karim', '2014-09-22', '123 Rue Maarif, Casablanca', '0612345679', 'mohammed.alami@email.ma', 'CP', 1, 'Actif'),

-- Ã‰lÃ¨ves de Fatima Benjelloun (tuteur_id = 2)
('Benjelloun', 'Salma', '2011-06-10', '45 Boulevard Gauthier, Casablanca', '0612345680', 'fatima.benjelloun@email.ma', 'CM1', 2, 'Actif'),
('Benjelloun', 'Mehdi', '2013-01-20', '45 Boulevard Gauthier, Casablanca', '0612345680', 'fatima.benjelloun@email.ma', 'CE1', 2, 'Actif');

-- 3.10. CrÃ©er des inscriptions
INSERT INTO inscriptions (eleve_id, bus_id, date_inscription, date_debut, date_fin, statut, montant_mensuel) VALUES
(1, 1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 'Active', 400.00), -- Yasmine -> BUS-001
(2, 1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 'Active', 400.00), -- Karim -> BUS-001
(3, 2, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 'Active', 400.00), -- Salma -> BUS-002
(4, 3, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 'Active', 400.00); -- Mehdi -> BUS-003

-- 3.11. CrÃ©er des prÃ©sences (pour tester)
INSERT INTO presences (eleve_id, date, present_matin, present_soir, bus_id, responsable_id, chauffeur_id, remarque) VALUES
(1, CURDATE(), TRUE, TRUE, 1, 1, 1, 'PrÃ©sent'),
(2, CURDATE(), TRUE, TRUE, 1, 1, 1, 'PrÃ©sent'),
(3, CURDATE(), TRUE, FALSE, 2, 1, 2, 'Absent le soir'),
(4, CURDATE(), FALSE, TRUE, 3, 2, 3, 'Absent le matin'),
(1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), TRUE, TRUE, 1, 1, 1, NULL),
(2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), TRUE, TRUE, 1, 1, 1, NULL);

-- 3.12. CrÃ©er des demandes (rÃ©fÃ©rence maintenant tuteurs)
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, description, statut) VALUES
(4, 2, 'inscription', 'Demande d\'inscription pour Mehdi Benjelloun', 'En attente'),
(1, 1, 'modification', 'Changement de zone pour Yasmine Alami', 'En attente');

-- 3.13. CrÃ©er des notifications
INSERT INTO notifications (destinataire_id, destinataire_type, titre, message, type, lue) VALUES
-- Notifications pour Admin (destinataire_id = 1 = administrateur.id)
(1, 'admin', 'Nouvelle inscription', 'Nouvelle demande d\'inscription reÃ§ue pour Mehdi Benjelloun', 'info', FALSE),
(1, 'admin', 'Paiement en attente', '3 paiements en attente de validation', 'alerte', FALSE),
(1, 'admin', 'Bus en maintenance', 'Le bus BUS-004 nÃ©cessite une rÃ©vision', 'avertissement', FALSE),

-- Notifications pour Chauffeurs (destinataire_id = chauffeur.id)
(1, 'chauffeur', 'Nouveau trajet assignÃ©', 'Vous avez Ã©tÃ© assignÃ© au BUS-001 sur le trajet Centre', 'info', FALSE),
(1, 'chauffeur', 'Rappel: Inspection', 'Votre permis expire dans 2 ans. Pensez Ã  le renouveler.', 'info', TRUE),
(2, 'chauffeur', 'Trajet du jour', 'Votre trajet du jour: BUS-002 - Trajet Centre', 'info', FALSE),
(3, 'chauffeur', 'Bienvenue', 'Bienvenue dans le systÃ¨me de transport scolaire', 'info', FALSE),

-- Notifications pour Responsables (destinataire_id = responsable_bus.id)
(1, 'responsable', 'Nouveau bus assignÃ©', 'Le BUS-001 et BUS-002 sont sous votre responsabilitÃ©', 'info', FALSE),
(1, 'responsable', 'PrÃ©sences du jour', '2 Ã©lÃ¨ves absents aujourd\'hui sur votre zone', 'alerte', FALSE),
(2, 'responsable', 'Zone Nord', 'Vous Ãªtes responsable de la Zone Nord - 2 bus', 'info', FALSE),
(2, 'responsable', 'Nouvelle inscription', 'Nouvel Ã©lÃ¨ve inscrit sur votre zone: Mehdi Benjelloun', 'info', FALSE);

-- 3.14. CrÃ©er des paiements
INSERT INTO paiements (inscription_id, montant, mois, annee, date_paiement, mode_paiement, statut) VALUES
(1, 400.00, MONTH(CURDATE()), YEAR(CURDATE()), DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'Virement', 'PayÃ©'),
(1, 400.00, MONTH(DATE_ADD(CURDATE(), INTERVAL 1 MONTH)), YEAR(CURDATE()), NULL, NULL, 'En attente'),
(2, 400.00, MONTH(CURDATE()), YEAR(CURDATE()), DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'EspÃ¨ces', 'PayÃ©'),
(3, 400.00, MONTH(CURDATE()), YEAR(CURDATE()), DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'Carte bancaire', 'PayÃ©'),
(4, 400.00, MONTH(CURDATE()), YEAR(CURDATE()), NULL, NULL, 'En attente');

-- 3.15. CrÃ©er des accidents (pour tester)
INSERT INTO accidents (date, heure, bus_id, chauffeur_id, description, degats, lieu, gravite, blesses, date_creation) VALUES
(DATE_SUB(CURDATE(), INTERVAL 30 DAY), '08:15:00', 2, 2, 'Collision mineure avec un poteau', 'RÃ©troviseur cassÃ©', 'Boulevard Gauthier', 'LÃ©gÃ¨re', FALSE, DATE_SUB(CURDATE(), INTERVAL 30 DAY)),
(DATE_SUB(CURDATE(), INTERVAL 90 DAY), '17:20:00', 1, 1, 'Accrochage avec un vÃ©hicule', 'Rayure sur la portiÃ¨re arriÃ¨re', 'Avenue 2 Mars', 'LÃ©gÃ¨re', FALSE, DATE_SUB(CURDATE(), INTERVAL 90 DAY));

-- 3.16. CrÃ©er des relations CONDUIRE (chauffeurs-trajets)
INSERT INTO conduire (chauffeur_id, trajet_id, bus_id, date_debut, date_fin, statut) VALUES
(1, 1, 1, DATE_SUB(CURDATE(), INTERVAL 90 DAY), NULL, 'Actif'),  -- Ahmed conduit BUS-001 sur Trajet Centre
(2, 1, 2, DATE_SUB(CURDATE(), INTERVAL 60 DAY), NULL, 'Actif'),  -- Youssef conduit BUS-002 sur Trajet Centre
(3, 2, 3, DATE_SUB(CURDATE(), INTERVAL 30 DAY), NULL, 'Actif');  -- Karim conduit BUS-003 sur Trajet Nord

-- ============================================
-- 4. RÃ‰SUMÃ‰ DES DONNÃ‰ES CRÃ‰Ã‰ES
-- ============================================
SELECT '=== RÃ‰SUMÃ‰ DES DONNÃ‰ES DE TEST ===' as '';

SELECT 'Utilisateurs:' as '', COUNT(*) as total FROM utilisateurs;
SELECT 'Administrateurs:' as '', COUNT(*) as total FROM administrateurs;
SELECT 'Chauffeurs:' as '', COUNT(*) as total FROM chauffeurs;
SELECT 'Responsables:' as '', COUNT(*) as total FROM responsables_bus;
SELECT 'Tuteurs:' as '', COUNT(*) as total FROM tuteurs;
SELECT 'Bus:' as '', COUNT(*) as total FROM bus;
SELECT 'Trajets:' as '', COUNT(*) as total FROM trajets;
SELECT 'Ã‰lÃ¨ves:' as '', COUNT(*) as total FROM eleves;
SELECT 'Inscriptions:' as '', COUNT(*) as total FROM inscriptions;
SELECT 'Paiements:' as '', COUNT(*) as total FROM paiements;
SELECT 'Notifications:' as '', COUNT(*) as total FROM notifications;
SELECT 'Accidents:' as '', COUNT(*) as total FROM accidents;
SELECT 'Zones:' as '', COUNT(*) as total FROM zones;

-- ============================================
-- 5. IDENTIFIANTS DE CONNEXION
-- ============================================
SELECT '' as '';
SELECT '=== IDENTIFIANTS DE TEST ===' as '';
SELECT '' as '';
SELECT 
    CONCAT(u.prenom, ' ', u.nom) as 'Nom Complet',
    u.email as 'Email',
    'test123' as 'Mot de passe',
    CASE 
        WHEN a.id IS NOT NULL THEN 'admin'
        WHEN c.id IS NOT NULL THEN 'chauffeur'
        WHEN r.id IS NOT NULL THEN 'responsable'
        WHEN t.id IS NOT NULL THEN 'tuteur'
        ELSE 'inconnu'
    END as 'Type',
    u.statut as 'Statut'
FROM utilisateurs u
LEFT JOIN administrateurs a ON a.utilisateur_id = u.id
LEFT JOIN chauffeurs c ON c.utilisateur_id = u.id
LEFT JOIN responsables_bus r ON r.utilisateur_id = u.id
LEFT JOIN tuteurs t ON t.utilisateur_id = u.id
WHERE a.id IS NOT NULL OR c.id IS NOT NULL OR r.id IS NOT NULL OR t.id IS NOT NULL
ORDER BY 
    CASE 
        WHEN a.id IS NOT NULL THEN 1 
        WHEN r.id IS NOT NULL THEN 2 
        WHEN c.id IS NOT NULL THEN 3 
        WHEN t.id IS NOT NULL THEN 4
    END,
    u.nom;

-- ============================================
-- FIN DU SCRIPT
-- ============================================
-- Pour vÃ©rifier que tout fonctionne, testez la connexion avec :
-- Email: admin@transport.ma
-- Mot de passe: test123
-- Type: admin (dÃ©terminÃ© automatiquement par la prÃ©sence dans la table administrateurs)
-- ============================================
-- =================================================================
-- DONNÃ‰ES DE DÃ‰MONSTRATION Ã‰TENDUES - PRÃ‰SENTATION PROJET (MAROC)
-- =================================================================
-- Ce script gÃ©nÃ¨re un jeu de donnÃ©es complet pour tester TOUTES les fonctionnalitÃ©s.
-- Contexte : Octobre/Novembre 2025
-- Volume :
--   - 8 Tuteurs, 8 Chauffeurs, 8 Responsables
--   - 8 Bus, 8 Trajets
--   - 20 Ã‰lÃ¨ves (18 Inscrits, 2 RefusÃ©s)
--   - 5 Demandes en cours
--   - Historique complet (Paiements, Accidents, Essence, Signalements)
-- =================================================================

USE transport_scolaire;

-- DÃ©sactiver les vÃ©rifications de clÃ©s Ã©trangÃ¨res pour le nettoyage
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE accidents;
TRUNCATE TABLE signalements_maintenance;
TRUNCATE TABLE prise_essence;
TRUNCATE TABLE conduire;
TRUNCATE TABLE presences;
TRUNCATE TABLE paiements;
TRUNCATE TABLE inscriptions;
TRUNCATE TABLE demandes;
TRUNCATE TABLE notifications;
TRUNCATE TABLE eleves;
TRUNCATE TABLE bus;
TRUNCATE TABLE trajets;
TRUNCATE TABLE zones;
TRUNCATE TABLE responsables_bus;
TRUNCATE TABLE chauffeurs;
TRUNCATE TABLE tuteurs;
TRUNCATE TABLE administrateurs;
TRUNCATE TABLE utilisateurs;
SET FOREIGN_KEY_CHECKS = 1;


-- =================================================================
-- 1. UTILISATEURS & RÃ”LES
-- =================================================================

-- 1.1 ADMINISTRATEUR
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, statut) VALUES 
('Admin', 'Principal', 'admin@transport.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0600000000', 'Actif');
INSERT INTO administrateurs (utilisateur_id) VALUES (LAST_INSERT_ID());

-- 1.2 TUTEURS (8)
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, statut) VALUES 
('Bennani', 'Mohammed', 'mohammed.bennani@demo.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0661111111', 'Actif'), -- ID 2
('Alami', 'Fatima', 'fatima.alami@demo.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0661111112', 'Actif'), -- ID 3
('Tazi', 'Karim', 'karim.tazi@demo.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0661111113', 'Actif'), -- ID 4
('Berrada', 'Amine', 'amine.berrada@demo.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0661111114', 'Actif'), -- ID 5
('Chaoui', 'Khadija', 'khadija.chaoui@demo.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0661111115', 'Actif'), -- ID 6
('Fassi', 'Driss', 'driss.fassi@demo.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0661111116', 'Actif'), -- ID 7
('Naciri', 'Layla', 'layla.naciri@demo.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0661111117', 'Actif'), -- ID 8
('Benjelloun', 'Omar', 'omar.benjelloun@demo.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0661111118', 'Actif'); -- ID 9

INSERT INTO tuteurs (utilisateur_id, adresse) VALUES 
(2, '15 Av. Al Araar, Hay Riad, Rabat'),
(3, '22 Rue Oued Ziz, Agdal, Rabat'),
(4, 'Res. Lesiris, Harhoura, Temara'),
(5, 'Lot. Al Boustane, Souissi, Rabat'),
(6, 'Av. Mohamed V, Centre Ville, Rabat'),
(7, 'Rue Tanger, Hassan, Rabat'),
(8, 'Hay Nahda 2, Rabat'),
(9, 'Bettana, SalÃ©');

-- 1.3 CHAUFFEURS (8)
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, statut) VALUES 
('Idrissi', 'Ahmed', 'ahmed.idrissi@demo.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0662222221', 'Actif'), -- ID 10
('Mansouri', 'Youssef', 'youssef.mansouri@demo.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0662222222', 'Actif'), -- ID 11
('Chraibi', 'Hassan', 'hassan.chraibi@demo.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0662222223', 'Actif'), -- ID 12
('Daoudi', 'Said', 'said.daoudi@demo.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0662222224', 'Actif'), -- ID 13
('El Amrani', 'Rachid', 'rachid.elamrani@demo.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0662222225', 'Actif'), -- ID 14
('Mokhtari', 'Jamal', 'jamal.mokhtari@demo.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0662222226', 'Inactif'), -- ID 15 (Pour test inactif)
('Sefrioui', 'Khalid', 'khalid.sefrioui@demo.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0662222227', 'Actif'), -- ID 16
('Kadiri', 'Anas', 'anas.kadiri@demo.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0662222228', 'Actif'); -- ID 17

INSERT INTO chauffeurs (utilisateur_id, numero_permis, date_expiration_permis, salaire, statut) VALUES 
(10, 'RB-2020-001', '2028-01-01', 4500.00, 'Actif'),
(11, 'RB-2021-045', '2027-05-15', 4200.00, 'Actif'),
(12, 'SL-2019-880', '2026-11-20', 4800.00, 'Actif'),
(13, 'TM-2022-123', '2029-02-10', 4000.00, 'Actif'),
(14, 'RB-2018-999', '2025-12-30', 5000.00, 'Actif'),
(15, 'RB-2020-555', '2026-06-06', 0.00, 'LicenciÃ©'), -- Chauffeur licenciÃ©
(16, 'SL-2023-111', '2030-01-01', 3800.00, 'Actif'),
(17, 'TM-2021-777', '2028-08-08', 4300.00, 'Actif');

-- 1.4 RESPONSABLES (8)
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, statut) VALUES 
('El Fassi', 'Zineb', 'zineb.elfassi@demo.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0663333331', 'Actif'), -- ID 18
('Boukhari', 'Samir', 'samir.boukhari@demo.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0663333332', 'Actif'), -- ID 19
('Cherkaoui', 'Noura', 'noura.cherkaoui@demo.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0663333333', 'Actif'),
('Iraqi', 'Mehdi', 'mehdi.iraqi@demo.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0663333334', 'Actif'),
('Bennis', 'Saloua', 'saloua.bennis@demo.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0663333335', 'Actif'),
('Jettou', 'Adnane', 'adnane.jettou@demo.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0663333336', 'Inactif'),
('Kabbaj', 'Meryem', 'meryem.kabbaj@demo.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0663333337', 'Actif'),
('Filali', 'Yassine', 'yassine.filali@demo.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0663333338', 'Actif');

INSERT INTO responsables_bus (utilisateur_id, zone_responsabilite, salaire, statut) VALUES 
(18, 'Zone Hay Riad', 6000.00, 'Actif'), -- Zineb
(19, 'Zone Agdal', 5500.00, 'Actif'), -- Samir
(20, 'Zone Souissi', 5800.00, 'Actif'),
(21, 'Zone Hassan', 5400.00, 'Actif'),
(22, 'Zone Harhoura', 5600.00, 'Actif'),
(23, 'Zone SalÃ© Centre', 0.00, 'Inactif'),
(24, 'Zone SalÃ© Marina', 5300.00, 'Actif'),
(25, 'Zone Temara', 5200.00, 'Actif');


-- =================================================================
-- 2. ZONES & TRAJETS (8)
-- =================================================================

INSERT INTO zones (nom, ville, actif) VALUES 
('Hay Riad', 'Rabat', TRUE), ('Agdal', 'Rabat', TRUE), ('Souissi', 'Rabat', TRUE), ('Hassan', 'Rabat', TRUE),
('Harhoura', 'Temara', TRUE), ('Guich', 'Rabat', TRUE), ('Sala Al Jadida', 'SalÃ©', TRUE), ('Hay Karima', 'SalÃ©', TRUE);

INSERT INTO trajets (nom, zones, heure_depart_matin_a, heure_arrivee_matin_a) VALUES 
('Circuit A - Hay Riad', '["Hay Riad"]', '07:30', '08:00'),
('Circuit B - Agdal/Hassan', '["Agdal", "Hassan"]', '07:15', '08:00'),
('Circuit C - Souissi', '["Souissi"]', '07:45', '08:15'),
('Circuit D - Harhoura', '["Harhoura"]', '07:00', '08:00'),
('Circuit E - Guich/Cygnes', '["Guich"]', '07:30', '08:00'),
('Circuit F - SalÃ© Express', '["Sala Al Jadida"]', '06:45', '07:45'),
('Circuit G - SalÃ© Nord', '["Hay Karima"]', '06:30', '07:30'),
('Circuit H - VIP', '["Souissi", "Hay Riad"]', '08:00', '08:30');


-- =================================================================
-- 3. BUS (8)
-- =================================================================

INSERT INTO bus (numero, marque, modele, annee_fabrication, capacite, chauffeur_id, responsable_id, trajet_id, statut) VALUES 
('BUS-01', 'Mercedes', 'Sprinter', 2024, 25, 1, 1, 1, 'Actif'),
('BUS-02', 'Mercedes', 'Tourismo', 2023, 50, 2, 2, 2, 'Actif'),
('BUS-03', 'Iveco', 'Daily', 2022, 30, 3, 3, 3, 'Actif'),
('BUS-04', 'Volvo', '9700', 2021, 55, 4, 4, 4, 'Actif'),
('BUS-05', 'Ford', 'Transit', 2023, 18, 5, 5, 5, 'Actif'),
('BUS-06', 'Hyundai', 'County', 2020, 28, 7, 7, 7, 'En maintenance'), -- Bus en panne
('BUS-07', 'Mercedes', 'Sprinter', 2025, 25, 8, 8, 8, 'Actif'),
('BUS-08', 'Renault', 'Master', 2018, 15, NULL, NULL, NULL, 'Hors service'); -- Vieux bus


-- =================================================================
-- 4. Ã‰LÃˆVES (20 Total: 18 Inscrits, 2 RefusÃ©s)
-- =================================================================
-- Tuteur 1 (M. Bennani) - 3 enfants
INSERT INTO eleves (nom, prenom, date_naissance, classe, tuteur_id, statut) VALUES 
('Bennani', 'Adam', '2015-05-10', 'CM1', 1, 'Actif'), -- 1
('Bennani', 'Sofia', '2017-08-22', 'CE2', 1, 'Actif'), -- 2
('Bennani', 'Yanis', '2019-02-14', 'CP', 1, 'Actif');  -- 3

-- Tuteur 2 (Mme Alami) - 2 enfants
INSERT INTO eleves (nom, prenom, date_naissance, classe, tuteur_id, statut) VALUES 
('Alami', 'Nizar', '2014-11-30', 'CM2', 2, 'Actif'), -- 4
('Alami', 'Rita', '2016-04-05', 'CE1', 2, 'Actif');  -- 5

-- Tuteur 3 (M. Tazi) - 3 enfants (dont 1 RefusÃ©)
INSERT INTO eleves (nom, prenom, date_naissance, classe, tuteur_id, statut) VALUES 
('Tazi', 'Kenza', '2013-09-09', '6eme', 3, 'Actif'),   -- 6
('Tazi', 'Mehdi', '2015-01-01', 'CM1', 3, 'Actif'),    -- 7
('Tazi', 'Ali', '2020-05-05', 'GS', 3, 'Inactif');     -- 8 (RefusÃ©)

-- Tuteur 4 (M. Berrada) - 2 enfants
INSERT INTO eleves (nom, prenom, date_naissance, classe, tuteur_id, statut) VALUES 
('Berrada', 'Hiba', '2012-07-20', '5eme', 4, 'Actif'), -- 9
('Berrada', 'Sami', '2014-03-15', 'CM2', 4, 'Actif');  -- 10

-- Tuteur 5 (Mme Chaoui) - 3 enfants
INSERT INTO eleves (nom, prenom, date_naissance, classe, tuteur_id, statut) VALUES 
('Chaoui', 'Lina', '2011-12-12', '4eme', 5, 'Actif'),    -- 11
('Chaoui', 'Rayan', '2013-10-10', '6eme', 5, 'Actif'),   -- 12
('Chaoui', 'Ghita', '2016-06-06', 'CE1', 5, 'Actif');    -- 13

-- Tuteur 6 (M. Fassi) - 3 enfants
INSERT INTO eleves (nom, prenom, date_naissance, classe, tuteur_id, statut) VALUES 
('Fassi', 'Othmane', '2015-09-09', 'CM1', 6, 'Actif'),   -- 14
('Fassi', 'Salim', '2017-02-28', 'CE2', 6, 'Actif'),     -- 15
('Fassi', 'Nour', '2019-11-11', 'CP', 6, 'Actif');       -- 16

-- Tuteur 7 (Mme Naciri) - 2 enfants (dont 1 RefusÃ©)
INSERT INTO eleves (nom, prenom, date_naissance, classe, tuteur_id, statut) VALUES 
('Naciri', 'Yassir', '2014-08-08', 'CM2', 7, 'Inactif'), -- 17 (RefusÃ©)
('Naciri', 'Sara', '2016-01-20', 'CE1', 7, 'Actif');     -- 18

-- Tuteur 8 (M. Benjelloun) - 2 enfants
INSERT INTO eleves (nom, prenom, date_naissance, classe, tuteur_id, statut) VALUES 
('Benjelloun', 'Aya', '2013-05-05', '6eme', 8, 'Actif'), -- 19
('Benjelloun', 'Amir', '2015-03-30', 'CM1', 8, 'Actif'); -- 20


-- =================================================================
-- 5. INSCRIPTIONS (18 Actives, 2 RefusÃ©es)
-- =================================================================
-- Inscriptions Actives (RÃ©parties sur les bus)
INSERT INTO inscriptions (eleve_id, bus_id, date_inscription, statut, montant_mensuel) VALUES 
-- Bus 1
(1, 1, '2025-10-01', 'Active', 500), (2, 1, '2025-10-01', 'Active', 500), (3, 1, '2025-10-01', 'Active', 500),
-- Bus 2
(4, 2, '2025-10-01', 'Active', 600), (5, 2, '2025-10-01', 'Active', 600),
-- Bus 3
(6, 3, '2025-10-01', 'Active', 450), (7, 3, '2025-10-01', 'Active', 450),
-- Bus 4
(9, 4, '2025-10-02', 'Active', 550), (10, 4, '2025-10-02', 'Active', 550),
-- Bus 5
(11, 5, '2025-10-03', 'Active', 500), (12, 5, '2025-10-03', 'Active', 500), (13, 5, '2025-10-03', 'Active', 500),
-- Bus 7
(14, 7, '2025-10-04', 'Active', 400), (15, 7, '2025-10-04', 'Active', 400), (16, 7, '2025-10-04', 'Active', 400),
-- Bus 1 (Reste)
(18, 1, '2025-10-05', 'Active', 500), (19, 1, '2025-10-05', 'Active', 500), (20, 1, '2025-10-05', 'Active', 500);

-- Demandes refusÃ©es (2)
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, statut, raison_refus) VALUES
(8, 3, 'inscription', 'RefusÃ©e', 'Pas de bus disponible pour la maternelle (GS)'),
(17, 7, 'inscription', 'RefusÃ©e', 'Zone gÃ©ographique non couverte');


-- =================================================================
-- 6. DEMANDES (5 En cours pour test)
-- =================================================================
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, description, statut, date_creation) VALUES 
(1, 1, 'modification', 'Changement d\'adresse pour le mois prochain', 'En attente', NOW()),
(4, 2, 'CongÃ©', 'Absence prÃ©vue pour voyage familial fin novembre', 'En cours de traitement', NOW()),
(9, 4, 'Autre', 'Demande de changement de bus (conflit horaire)', 'En attente', NOW()),
(11, 5, 'inscription', 'Nouvelle inscription pour l''an prochain', 'En attente', NOW()),
(19, 8, 'desinscription', 'DÃ©mÃ©nagement prÃ©vu en DÃ©cembre', 'En attente', NOW());


-- =================================================================
-- 7. PAIEMENTS (Octobre & Novembre 2025)
-- =================================================================
-- Paiements d'Octobre (Tous payÃ©s)
INSERT INTO paiements (inscription_id, montant, mois, annee, date_paiement, mode_paiement, statut)
SELECT id, montant_mensuel, 10, 2025, '2025-10-05', 'Virement', 'PayÃ©' FROM inscriptions WHERE statut = 'Active';

-- Paiements de Novembre (Mix : PayÃ©, En attente)
INSERT INTO paiements (inscription_id, montant, mois, annee, date_paiement, mode_paiement, statut)
SELECT id, montant_mensuel, 11, 2025, 
CASE WHEN id % 2 = 0 THEN '2025-11-05' ELSE NULL END, 
CASE WHEN id % 2 = 0 THEN 'EspÃ¨ces' ELSE NULL END, 
CASE WHEN id % 2 = 0 THEN 'PayÃ©' ELSE 'En attente' END 
FROM inscriptions WHERE statut = 'Active';


-- =================================================================
-- 8. ABSENCES & ACCIDENTS
-- =================================================================
-- Absences du 2 Novembre 2025 (Dimanche ? Disons Lundi 3 Nov pour cohÃ©rence, ou on garde le scÃ©nario user)
-- Gardons 2 Nov comme demandÃ©.

-- 5 Ã‰lÃ¨ves absents le 2 Novembre SOIR
INSERT INTO presences (eleve_id, date, present_matin, present_soir, bus_id, responsable_id, remarque) VALUES 
(1, '2025-11-02', 1, 0, 1, 1, 'RDV MÃ©dical'),
(5, '2025-11-02', 1, 0, 2, 2, 'Fatigue'),
(10, '2025-11-02', 1, 0, 4, 4, NULL),
(15, '2025-11-02', 0, 0, 7, 7, 'Maladnie toute la journÃ©e'),
(20, '2025-11-02', 1, 0, 1, 1, 'Parti avec ses parents');

-- Accidents / Incidents (2)
INSERT INTO accidents (date, bus_id, chauffeur_id, responsable_id, description, gravite, statut) VALUES 
('2025-10-20', 1, 1, 1, 'Petit accrochage pare-choc arriÃ¨re parking Ã©cole', 'LÃ©gÃ¨re', 'ValidÃ©'),
('2025-11-05', 6, 7, 7, 'Panne moteur en plein trajet (surchauffe)', 'Moyenne', 'En attente');


-- =================================================================
-- 9. FONCTIONNALITÃ‰S CHAUFFEUR (Essence, Signalements)
-- =================================================================
-- Prise essence
INSERT INTO prise_essence (chauffeur_id, bus_id, date, quantite_litres, prix_total, station_service) VALUES 
(1, 1, '2025-10-15', 50.5, 650.00, 'Afriquia Hay Riad'),
(2, 2, '2025-10-20', 40.0, 520.00, 'Shell Agdal'),
(4, 4, '2025-11-01', 60.0, 780.00, 'Total Harhoura');

-- Signalements Maintenance
INSERT INTO signalements_maintenance (chauffeur_id, bus_id, type_probleme, description, urgence, statut) VALUES 
(7, 6, 'mecanique', 'Bruit suspect moteur Ã  l\'accÃ©lÃ©ration', 'haute', 'en_cours'),
(3, 3, 'climatisation', 'Clim ne refroidit pas bien', 'faible', 'en_attente');


-- =================================================================
-- 10. NOTIFICATIONS (GÃ©nÃ©ration en masse)
-- =================================================================
-- Notifs aux tuteurs pour les absences
INSERT INTO notifications (destinataire_id, destinataire_type, titre, message, type, lue, date)
SELECT tuteur_id, 'tuteur', 'Absence Enfant', 'Votre enfant a Ã©tÃ© marquÃ© absent le 02/11/2025', 'alerte', 0, '2025-11-02 18:00:00'
FROM eleves WHERE id IN (1, 5, 10, 15, 20);

-- Notifs aux responsables pour les accidents
INSERT INTO notifications (destinataire_id, destinataire_type, titre, message, type, lue, date)
VALUES (7, 'responsable', 'Panne Bus', 'Le bus BUS-06 a signalÃ© une panne moteur', 'warning', 0, '2025-11-05 08:30:00');

-- Notifs Paiement pour ceux en attente
INSERT INTO notifications (destinataire_id, destinataire_type, titre, message, type, lue, date)
SELECT t.id, 'tuteur', 'Paiement En Attente', 'Le paiement de Novembre est en attente.', 'info', 0, NOW()
FROM paiements p
JOIN inscriptions i ON p.inscription_id = i.id
JOIN eleves e ON i.eleve_id = e.id
JOIN tuteurs t ON e.tuteur_id = t.id
WHERE p.statut = 'En attente';

SELECT '=== GÃ‰NÃ‰RATION TERMINÃ‰E ===' as '';
SELECT '8 Chauffeurs, 8 Responsables, 8 Tuteurs crÃ©Ã©s.' as '';
SELECT '20 Ã‰lÃ¨ves (18 actifs, 2 refusÃ©s).' as '';
SELECT '8 Bus, 8 Trajets.' as '';
SELECT 'DonnÃ©es financiÃ¨res et logistiques (Essence, Accidents) ajoutÃ©es.' as '';
-- DONNEES DE TEST - 50 ELEVES
-- Ce fichier ajoute environ 50 Ã©lÃ¨ves, leurs tuteurs, inscriptions, demandes et paiements.
-- Les Ã©lÃ¨ves sont rÃ©partis sur les diffÃ©rentes zones et classes.
-- Classes: 1AP, 2AP, 3AP, 4AP, 5AP, 6AP, 1ACC, 2AC, 3AC, TC, 1BAC, 2BAC
-- Mot de passe pour tous les utilisateurs : test123

USE transport_scolaire;

-- ==============================================================================
-- 1. CRÃ‰ATION DES TUTEURS (PARENTS) ET UTILISATEURS ASSOCIÃ‰S
-- ==============================================================================

-- Parent 1
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, statut) VALUES ('Bennani', 'Karim', 'k.bennani@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0661110001', 'Actif');
INSERT INTO tuteurs (utilisateur_id) VALUES (LAST_INSERT_ID());
SET @tuteur_1 = LAST_INSERT_ID();

-- Parent 2
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, statut) VALUES ('Chraibi', 'Meryem', 'm.chraibi@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0661110002', 'Actif');
INSERT INTO tuteurs (utilisateur_id) VALUES (LAST_INSERT_ID());
SET @tuteur_2 = LAST_INSERT_ID();

-- Parent 3
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, statut) VALUES ('Berrada', 'Omar', 'o.berrada@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0661110003', 'Actif');
INSERT INTO tuteurs (utilisateur_id) VALUES (LAST_INSERT_ID());
SET @tuteur_3 = LAST_INSERT_ID();

-- Parent 4
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, statut) VALUES ('Tazi', 'Sofia', 's.tazi@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0661110004', 'Actif');
INSERT INTO tuteurs (utilisateur_id) VALUES (LAST_INSERT_ID());
SET @tuteur_4 = LAST_INSERT_ID();

-- Parent 5
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, statut) VALUES ('El Fassi', 'Youssef', 'y.elfassi@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0661110005', 'Actif');
INSERT INTO tuteurs (utilisateur_id) VALUES (LAST_INSERT_ID());
SET @tuteur_5 = LAST_INSERT_ID();

-- Parent 6
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, statut) VALUES ('Alaoui', 'Fatima', 'f.alaoui@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0661110006', 'Actif');
INSERT INTO tuteurs (utilisateur_id) VALUES (LAST_INSERT_ID());
SET @tuteur_6 = LAST_INSERT_ID();

-- Parent 7
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, statut) VALUES ('Kabbaj', 'Ahmed', 'a.kabbaj@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0661110007', 'Actif');
INSERT INTO tuteurs (utilisateur_id) VALUES (LAST_INSERT_ID());
SET @tuteur_7 = LAST_INSERT_ID();

-- Parent 8 (Famille nombreuse 1)
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, statut) VALUES ('Idrissi', 'Leila', 'l.idrissi@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0661110008', 'Actif');
INSERT INTO tuteurs (utilisateur_id) VALUES (LAST_INSERT_ID());
SET @tuteur_8 = LAST_INSERT_ID();

-- Parent 9 (Famille nombreuse 2)
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, statut) VALUES ('Benjelloun', 'Rachid', 'r.benjelloun@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0661110009', 'Actif');
INSERT INTO tuteurs (utilisateur_id) VALUES (LAST_INSERT_ID());
SET @tuteur_9 = LAST_INSERT_ID();

-- Parent 10
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, statut) VALUES ('Tahiri', 'Noura', 'n.tahiri@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0661110010', 'Actif');
INSERT INTO tuteurs (utilisateur_id) VALUES (LAST_INSERT_ID());
SET @tuteur_10 = LAST_INSERT_ID();

-- Parent 11
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, statut) VALUES ('Mekouar', 'Driss', 'd.mekouar@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0661110011', 'Actif');
INSERT INTO tuteurs (utilisateur_id) VALUES (LAST_INSERT_ID());
SET @tuteur_11 = LAST_INSERT_ID();

-- Parent 12
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, statut) VALUES ('Slaoui', 'Kenza', 'k.slaoui@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0661110012', 'Actif');
INSERT INTO tuteurs (utilisateur_id) VALUES (LAST_INSERT_ID());
SET @tuteur_12 = LAST_INSERT_ID();

-- Parent 13
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, statut) VALUES ('Kadiri', 'Hassan', 'h.kadiri@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0661110013', 'Actif');
INSERT INTO tuteurs (utilisateur_id) VALUES (LAST_INSERT_ID());
SET @tuteur_13 = LAST_INSERT_ID();

-- Parent 14
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, statut) VALUES ('Chaoui', 'Samia', 's.chaoui@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0661110014', 'Actif');
INSERT INTO tuteurs (utilisateur_id) VALUES (LAST_INSERT_ID());
SET @tuteur_14 = LAST_INSERT_ID();

-- Parent 15
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, statut) VALUES ('Jettou', 'Adnane', 'a.jettou@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0661110015', 'Actif');
INSERT INTO tuteurs (utilisateur_id) VALUES (LAST_INSERT_ID());
SET @tuteur_15 = LAST_INSERT_ID();

-- ==============================================================================
-- 2. CRÃ‰ATION DES Ã‰LÃˆVES ET DEMANDES (50 Ã©lÃ¨ves)
-- ==============================================================================

-- Zone: Agdal (Rabat)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Bennani', 'Ali', '2019-05-12', '10 Rue Agdal', '0661110001', 'k.bennani@test.com', '1AP', @tuteur_1, 'Actif'),
('Bennani', 'Lina', '2013-08-23', '10 Rue Agdal', '0661110001', 'k.bennani@test.com', '6AP', @tuteur_1, 'Actif'),
('Chraibi', 'Adam', '2009-01-15', '45 Av Hassan II, Agdal', '0661110002', 'm.chraibi@test.com', '1BAC', @tuteur_2, 'Actif');

SET @id_start = LAST_INSERT_ID();
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, zone_geographique, montant_facture, statut, description) VALUES
(@id_start, @tuteur_1, 'inscription', 'Agdal', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+1, @tuteur_1, 'inscription', 'Agdal', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+2, @tuteur_2, 'inscription', 'Agdal', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}');

-- Zone: Hassan (Rabat)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Berrada', 'Sara', '2014-03-30', '12 Rue Hassan', '0661110003', 'o.berrada@test.com', '5AP', @tuteur_3, 'Actif'),
('Berrada', 'Rania', '2018-11-10', '12 Rue Hassan', '0661110003', 'o.berrada@test.com', '2AP', @tuteur_3, 'Actif'),
('Tazi', 'Amine', '2008-06-20', '88 Bd Mohamed V, Hassan', '0661110004', 's.tazi@test.com', '2BAC', @tuteur_4, 'Actif');

SET @id_start = LAST_INSERT_ID();
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, zone_geographique, montant_facture, statut, description) VALUES
(@id_start, @tuteur_3, 'inscription', 'Hassan', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+1, @tuteur_3, 'inscription', 'Hassan', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+2, @tuteur_4, 'inscription', 'Hassan', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}');

-- Zone: Hay Riad (Rabat)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('El Fassi', 'Ghita', '2012-09-05', 'Villa 45, Secteur 10, Hay Riad', '0661110005', 'y.elfassi@test.com', '1ACC', @tuteur_5, 'Actif'),
('El Fassi', 'Mehdi', '2010-02-14', 'Villa 45, Secteur 10, Hay Riad', '0661110005', 'y.elfassi@test.com', 'TC', @tuteur_5, 'Actif'),
('Alaoui', 'Yassine', '2015-12-01', 'Av Annakhil, Hay Riad', '0661110006', 'f.alaoui@test.com', '3AP', @tuteur_6, 'Actif');

SET @id_start = LAST_INSERT_ID();
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, zone_geographique, montant_facture, statut, description) VALUES
(@id_start, @tuteur_5, 'inscription', 'Hay Riad', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+1, @tuteur_5, 'inscription', 'Hay Riad', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+2, @tuteur_6, 'inscription', 'Hay Riad', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}');

-- Zone: Yacoub El Mansour (Rabat)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Kabbaj', 'Hiba', '2019-07-22', 'Res. Ocean, Yacoub Mansour', '0661110007', 'a.kabbaj@test.com', '1AP', @tuteur_7, 'Actif'),
('Kabbaj', 'Zineb', '2016-04-18', 'Res. Ocean, Yacoub Mansour', '0661110007', 'a.kabbaj@test.com', '3AP', @tuteur_7, 'Actif'),
('Idrissi', 'Omar', '2017-09-09', 'Rue 12, Yacoub Mansour', '0661110008', 'l.idrissi@test.com', '2AP', @tuteur_8, 'Actif');

SET @id_start = LAST_INSERT_ID();
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, zone_geographique, montant_facture, statut, description) VALUES
(@id_start, @tuteur_7, 'inscription', 'Yacoub El Mansour', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+1, @tuteur_7, 'inscription', 'Yacoub El Mansour', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+2, @tuteur_8, 'inscription', 'Yacoub El Mansour', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}');

-- Zone: Souissi (Rabat)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Benjelloun', 'Kenza', '2011-03-03', 'Villa 12, Souissi', '0661110009', 'r.benjelloun@test.com', '2AC', @tuteur_9, 'Actif'),
('Benjelloun', 'Ali', '2013-05-15', 'Villa 12, Souissi', '0661110009', 'r.benjelloun@test.com', '6AP', @tuteur_9, 'Actif'),
('Benjelloun', 'Nour', '2019-11-20', 'Villa 12, Souissi', '0661110009', 'r.benjelloun@test.com', '1AP', @tuteur_9, 'Actif');

SET @id_start = LAST_INSERT_ID();
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, zone_geographique, montant_facture, statut, description) VALUES
(@id_start, @tuteur_9, 'inscription', 'Souissi', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+1, @tuteur_9, 'inscription', 'Souissi', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+2, @tuteur_9, 'inscription', 'Souissi', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}');

-- Zone: Nahda (Rabat)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Tahiri', 'Salma', '2015-08-08', 'Lot Nahda 2', '0661110010', 'n.tahiri@test.com', '4AP', @tuteur_10, 'Actif'),
('Tahiri', 'Ahmed', '2010-12-12', 'Lot Nahda 2', '0661110010', 'n.tahiri@test.com', '3AC', @tuteur_10, 'Actif'),
('Mekouar', 'Yanis', '2017-02-28', 'Rue Nahda 1', '0661110011', 'd.mekouar@test.com', '2AP', @tuteur_11, 'Actif');

SET @id_start = LAST_INSERT_ID();
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, zone_geographique, montant_facture, statut, description) VALUES
(@id_start, @tuteur_10, 'inscription', 'Nahda', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+1, @tuteur_10, 'inscription', 'Nahda', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+2, @tuteur_11, 'inscription', 'Nahda', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}');

-- Zone: Akkari (Rabat)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Slaoui', 'Ines', '2016-06-14', 'Bd Akkari', '0661110012', 'k.slaoui@test.com', '3AP', @tuteur_12, 'Actif'),
('Slaoui', 'Rym', '2019-09-30', 'Bd Akkari', '0661110012', 'k.slaoui@test.com', '1AP', @tuteur_12, 'Actif'),
('Kadiri', 'Jad', '2014-11-11', 'Rue 4, Akkari', '0661110013', 'h.kadiri@test.com', '5AP', @tuteur_13, 'Actif');

SET @id_start = LAST_INSERT_ID();
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, zone_geographique, montant_facture, statut, description) VALUES
(@id_start, @tuteur_12, 'inscription', 'Akkari', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+1, @tuteur_12, 'inscription', 'Akkari', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+2, @tuteur_13, 'inscription', 'Akkari', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}');

-- Zone: Takkadoum (Rabat)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Chaoui', 'Malak', '2015-05-05', 'Res Takkadoum', '0661110014', 's.chaoui@test.com', '4AP', @tuteur_14, 'Actif'),
('Chaoui', 'Samy', '2017-10-10', 'Res Takkadoum', '0661110014', 's.chaoui@test.com', '2AP', @tuteur_14, 'Actif'),
('Jettou', 'Anas', '2016-07-07', 'Av Takkadoum', '0661110015', 'a.jettou@test.com', '3AP', @tuteur_15, 'Actif');

SET @id_start = LAST_INSERT_ID();
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, zone_geographique, montant_facture, statut, description) VALUES
(@id_start, @tuteur_14, 'inscription', 'Takkadoum', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+1, @tuteur_14, 'inscription', 'Takkadoum', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+2, @tuteur_15, 'inscription', 'Takkadoum', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}');

-- Zone: Hay Amal (SalÃ©)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Bennani', 'Dina', '2014-01-25', 'Hay Amal, SalÃ©', '0661110001', 'k.bennani@test.com', '5AP', @tuteur_1, 'Actif'),
('Chraibi', 'Sofia', '2019-03-15', 'Hay Amal, SalÃ©', '0661110002', 'm.chraibi@test.com', '1AP', @tuteur_2, 'Actif');

SET @id_start = LAST_INSERT_ID();
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, zone_geographique, montant_facture, statut, description) VALUES
(@id_start, @tuteur_1, 'inscription', 'Hay Amal', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+1, @tuteur_2, 'inscription', 'Hay Amal', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}');

-- Zone: Hay Karima (SalÃ©)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Berrada', 'Khalil', '2015-09-20', 'Hay Karima, SalÃ©', '0661110003', 'o.berrada@test.com', '4AP', @tuteur_3, 'Actif'),
('Tazi', 'Neyla', '2017-04-05', 'Hay Karima, SalÃ©', '0661110004', 's.tazi@test.com', '2AP', @tuteur_4, 'Actif');

SET @id_start = LAST_INSERT_ID();
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, zone_geographique, montant_facture, statut, description) VALUES
(@id_start, @tuteur_3, 'inscription', 'Hay Karima', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+1, @tuteur_4, 'inscription', 'Hay Karima', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}');

-- Zone: Hay Nbi3at (SalÃ©)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('El Fassi', 'Rayan', '2016-12-30', 'Hay Nbi3at, SalÃ©', '0661110005', 'y.elfassi@test.com', '3AP', @tuteur_5, 'Actif'),
('Alaoui', 'Mia', '2019-08-15', 'Hay Nbi3at, SalÃ©', '0661110006', 'f.alaoui@test.com', '1AP', @tuteur_6, 'Actif');

SET @id_start = LAST_INSERT_ID();
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, zone_geographique, montant_facture, statut, description) VALUES
(@id_start, @tuteur_5, 'inscription', 'Hay Nbi3at', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+1, @tuteur_6, 'inscription', 'Hay Nbi3at', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}');

-- Zone: Sidi Moussa (SalÃ©)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Kabbaj', 'Amir', '2014-05-10', 'Sidi Moussa, SalÃ©', '0661110007', 'a.kabbaj@test.com', '5AP', @tuteur_7, 'Actif'),
('Idrissi', 'Leen', '2017-01-20', 'Sidi Moussa, SalÃ©', '0661110008', 'l.idrissi@test.com', '2AP', @tuteur_8, 'Actif');

SET @id_start = LAST_INSERT_ID();
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, zone_geographique, montant_facture, statut, description) VALUES
(@id_start, @tuteur_7, 'inscription', 'Sidi Moussa', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+1, @tuteur_8, 'inscription', 'Sidi Moussa', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}');

-- Zone: Boulknadel (SalÃ©)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Benjelloun', 'Reda', '2015-06-06', 'Boulknadel', '0661110009', 'r.benjelloun@test.com', '4AP', @tuteur_9, 'Actif'),
('Tahiri', 'Yara', '2019-02-14', 'Boulknadel', '0661110010', 'n.tahiri@test.com', '1AP', @tuteur_10, 'Actif');

SET @id_start = LAST_INSERT_ID();
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, zone_geographique, montant_facture, statut, description) VALUES
(@id_start, @tuteur_9, 'inscription', 'Boulknadel', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+1, @tuteur_10, 'inscription', 'Boulknadel', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}');

-- Zone: Sale Jadida (SalÃ©)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Mekouar', 'Samir', '2016-10-25', 'Sale Jadida', '0661110011', 'd.mekouar@test.com', '3AP', @tuteur_11, 'Actif'),
('Slaoui', 'Lilya', '2014-04-12', 'Sale Jadida', '0661110012', 'k.slaoui@test.com', '5AP', @tuteur_12, 'Actif');

SET @id_start = LAST_INSERT_ID();
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, zone_geographique, montant_facture, statut, description) VALUES
(@id_start, @tuteur_11, 'inscription', 'Sale Jadida', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+1, @tuteur_12, 'inscription', 'Sale Jadida', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}');

-- Zone: Harhoura (SalÃ©/Temara)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Kadiri', 'Ziad', '2017-09-09', 'Villa Harhoura', '0661110013', 'h.kadiri@test.com', '2AP', @tuteur_13, 'Actif'),
('Chaoui', 'Nour', '2015-11-30', 'Villa Harhoura', '0661110014', 's.chaoui@test.com', '4AP', @tuteur_14, 'Actif'),
('Jettou', 'Ilya', '2019-07-01', 'Villa Harhoura', '0661110015', 'a.jettou@test.com', '1AP', @tuteur_15, 'Actif');

SET @id_start = LAST_INSERT_ID();
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, zone_geographique, montant_facture, statut, description) VALUES
(@id_start, @tuteur_13, 'inscription', 'Harhoura', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+1, @tuteur_14, 'inscription', 'Harhoura', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+2, @tuteur_15, 'inscription', 'Harhoura', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}');

-- Zone: Maamora (SalÃ©)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Bennani', 'Kamal', '2016-02-18', 'Maamora', '0661110001', 'k.bennani@test.com', '3AP', @tuteur_1, 'Actif'),
('Chraibi', 'Soraya', '2014-08-22', 'Maamora', '0661110002', 'm.chraibi@test.com', '5AP', @tuteur_2, 'Actif');

SET @id_start = LAST_INSERT_ID();
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, zone_geographique, montant_facture, statut, description) VALUES
(@id_start, @tuteur_1, 'inscription', 'Maamora', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+1, @tuteur_2, 'inscription', 'Maamora', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}');

-- Zone: Temara Centre
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Berrada', 'Marwane', '2017-12-05', 'Temara Centre', '0661110003', 'o.berrada@test.com', '2AP', @tuteur_3, 'Actif'),
('Tazi', 'Yasmine', '2008-05-15', 'Temara Centre', '0661110004', 's.tazi@test.com', '2BAC', @tuteur_4, 'Actif');

SET @id_start = LAST_INSERT_ID();
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, zone_geographique, montant_facture, statut, description) VALUES
(@id_start, @tuteur_3, 'inscription', 'Temara Centre', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+1, @tuteur_4, 'inscription', 'Temara Centre', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}');

-- Zone: Milano (Temara)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('El Fassi', 'Driss', '2019-01-10', 'Res Milano, Temara', '0661110005', 'y.elfassi@test.com', '1AP', @tuteur_5, 'Actif'),
('Alaoui', 'Selma', '2016-09-28', 'Res Milano, Temara', '0661110006', 'f.alaoui@test.com', '3AP', @tuteur_6, 'Actif');

SET @id_start = LAST_INSERT_ID();
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, zone_geographique, montant_facture, statut, description) VALUES
(@id_start, @tuteur_5, 'inscription', 'Milano', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+1, @tuteur_6, 'inscription', 'Milano', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}');

-- Quelques Ã©lÃ¨ves supplÃ©mentaires en Vrac pour atteindre le compte
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Kabbaj', 'Nabil', '2009-02-02', 'Maarif', '0661110007', 'a.kabbaj@test.com', 'TC', @tuteur_7, 'Actif'),
('Idrissi', 'Mounir', '2017-06-16', 'Agdal', '0661110008', 'l.idrissi@test.com', '2AP', @tuteur_8, 'Actif'),
('Benjelloun', 'Sanae', '2015-10-10', 'Hay Riad', '0661110009', 'r.benjelloun@test.com', '4AP', @tuteur_9, 'Actif'),
('Tahiri', 'Yassir', '2019-03-23', 'Souissi', '0661110010', 'n.tahiri@test.com', '1AP', @tuteur_10, 'Actif');

SET @id_start = LAST_INSERT_ID();
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, zone_geographique, montant_facture, statut, description) VALUES
(@id_start, @tuteur_7, 'inscription', 'Maarif', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+1, @tuteur_8, 'inscription', 'Agdal', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+2, @tuteur_9, 'inscription', 'Hay Riad', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+3, @tuteur_10, 'inscription', 'Souissi', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}');


-- ==============================================================================
-- 3. INSCRIPTIONS ET PAIEMENTS
-- ==============================================================================

-- On crÃ©e des inscriptions pour tous ces Ã©lÃ¨ves
-- Et on ajoute des paiements (certains payÃ©s, certains en attente)

INSERT INTO inscriptions (eleve_id, bus_id, date_inscription, date_debut, date_fin, statut, montant_mensuel)
SELECT 
    id, 
    CAST(1 + FLOOR(RAND() * 4) AS UNSIGNED), -- Bus alÃ©atoire entre 1 et 4
    CURDATE(), 
    CURDATE(), 
    DATE_ADD(CURDATE(), INTERVAL 9 MONTH), 
    'Active', 
    500.00
FROM eleves 
WHERE email_parent LIKE '%@test.com';

-- Paiement Mois 1 (PayÃ© pour tous)
INSERT INTO paiements (inscription_id, montant, mois, annee, date_paiement, mode_paiement, statut)
SELECT 
    id, 
    500.00, 
    MONTH(CURDATE()), 
    YEAR(CURDATE()), 
    CURDATE(), 
    ELT(1 + FLOOR(RAND() * 3), 'EspÃ¨ces', 'Virement', 'Carte bancaire'),
    'PayÃ©'
FROM inscriptions
WHERE eleve_id IN (SELECT id FROM eleves WHERE email_parent LIKE '%@test.com');

-- Paiement Mois 2 (50% payÃ©s, 50% en attente)
INSERT INTO paiements (inscription_id, montant, mois, annee, date_paiement, mode_paiement, statut)
SELECT 
    id, 
    500.00, 
    MONTH(DATE_ADD(CURDATE(), INTERVAL 1 MONTH)), 
    YEAR(DATE_ADD(CURDATE(), INTERVAL 1 MONTH)), 
    IF(RAND() > 0.5, CURDATE(), NULL), 
    IF(RAND() > 0.5, 'EspÃ¨ces', NULL),
    IF(RAND() > 0.5, 'PayÃ©', 'En attente')
FROM inscriptions
WHERE eleve_id IN (SELECT id FROM eleves WHERE email_parent LIKE '%@test.com');

-- Paiement Mois 3 (Tous en attente)
INSERT INTO paiements (inscription_id, montant, mois, annee, date_paiement, mode_paiement, statut)
SELECT 
    id, 
    500.00, 
    MONTH(DATE_ADD(CURDATE(), INTERVAL 2 MONTH)), 
    YEAR(DATE_ADD(CURDATE(), INTERVAL 2 MONTH)), 
    NULL, 
    NULL,
    'En attente'
FROM inscriptions
WHERE eleve_id IN (SELECT id FROM eleves WHERE email_parent LIKE '%@test.com');

SELECT 'GÃ©nÃ©ration des donnÃ©es terminÃ©e avec succÃ¨s.' as 'Status';
-- DONNEES DE TEST POUR LES STATISTIQUES (PROBLEMES, ESSENCE, ACCIDENTS, ABSENCES)
-- Ce fichier doit Ãªtre exÃ©cutÃ© APRES donnees_test_50_eleves.sql pour garantir que les Ã©lÃ¨ves et bus existent.

USE transport_scolaire;

-- ==============================================================================
-- 1. SIGNALEMENTS DE PROBLÃˆMES (BUS QUI A PLUSIEURS PROBLÃˆMES)
-- ==============================================================================

-- On suppose que des bus existent dÃ©jÃ  (crÃ©Ã©s par le script prÃ©cÃ©dent/initial).
-- On va cibler un bus spÃ©cifique pour qu'il ait "plusieurs problÃ¨mes" (ex: bus avec ID 1 ou le premier trouvÃ©).
SET @bus_problematique = (SELECT id FROM bus LIMIT 1);
SET @bus_clean = (SELECT id FROM bus WHERE id != @bus_problematique LIMIT 1);
SET @chauffeur_id = (SELECT id FROM chauffeurs LIMIT 1);

-- Ajouter des signalements pour le bus problÃ©matique (4 problÃ¨mes)
-- Table rÃ©elle : signalements_maintenance
-- Correction : priorite -> urgence, valeurs en minuscule (haute, moyenne, faible), et status en snake_case
INSERT INTO signalements_maintenance (bus_id, chauffeur_id, type_probleme, description, urgence, statut, date_creation) VALUES
(@bus_problematique, @chauffeur_id, 'Panne Moteur', 'Moteur surchauffe dans les pentes', 'haute', 'en_attente', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(@bus_problematique, @chauffeur_id, 'Climatisation', 'La clim ne fonctionne pas Ã  l\'arriÃ¨re', 'moyenne', 'en_cours', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(@bus_problematique, @chauffeur_id, 'Pneu crevÃ©', 'Pneu arriÃ¨re droit Ã  changer', 'haute', 'resolu', DATE_SUB(NOW(), INTERVAL 10 DAY)),
(@bus_problematique, @chauffeur_id, 'SiÃ¨ge cassÃ©', 'SiÃ¨ge rangÃ©e 3 cotÃ© fenÃªtre abimÃ©', 'faible', 'en_attente', DATE_SUB(NOW(), INTERVAL 15 DAY));

-- Quelques signalements pour d'autres bus (pour comparaison)
INSERT INTO signalements_maintenance (bus_id, chauffeur_id, type_probleme, description, urgence, statut, date_creation) VALUES
(@bus_clean, @chauffeur_id, 'Vitre bloquÃ©e', 'Vitre conducteur ne descend plus', 'faible', 'en_attente', DATE_SUB(NOW(), INTERVAL 3 DAY));


-- ==============================================================================
-- 2. CONSOMMATION D'ESSENCE (BUS QUI CONSOMME PLUS)
-- ==============================================================================

-- On cible un bus "gourmand" (peut Ãªtre le mÃªme ou un autre).
SET @bus_gourmand = (SELECT id FROM bus ORDER BY id DESC LIMIT 1);

-- EntrÃ©es de carburant pour le bus gourmand (Total Ã©levÃ©)
-- Table rÃ©elle : prise_essence
-- Correction : montant -> prix_total, ajout colonne heure, suppression kilometrage (absent du create.php)
INSERT INTO prise_essence (bus_id, date, heure, quantite_litres, prix_total, chauffeur_id, station_service) VALUES
(@bus_gourmand, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '08:30:00', 150, 2000.00, @chauffeur_id, 'Station Total Agdal'),
(@bus_gourmand, DATE_SUB(CURDATE(), INTERVAL 8 DAY), '09:15:00', 140, 1850.00, @chauffeur_id, 'Station Shell Hay Riad'),
(@bus_gourmand, DATE_SUB(CURDATE(), INTERVAL 15 DAY), '18:45:00', 160, 2100.00, @chauffeur_id, 'Station Afriquia Temara');

-- EntrÃ©es pour un bus "normal"
INSERT INTO prise_essence (bus_id, date, heure, quantite_litres, prix_total, chauffeur_id, station_service) VALUES
(@bus_clean, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '07:00:00', 80, 1000.00, @chauffeur_id, 'Station Total Agdal'),
(@bus_clean, DATE_SUB(CURDATE(), INTERVAL 9 DAY), '14:20:00', 75, 950.00, @chauffeur_id, 'Station Total Agdal');


-- ==============================================================================
-- 3. ACCIDENTS (CHAUFFEUR AVEC PLUSIEURS ACCIDENTS)
-- ==============================================================================

-- On vÃ©rifie s'il y a des chauffeurs, sinon on en crÃ©e ou on utilise les IDs existants.
-- Supposons que IDs 1 et 2 existent (crÃ©Ã©s via l'interface ou script).
-- Si pas de chauffeurs, on en crÃ©e temporairement pour le test.
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, statut) 
VALUES ('Amrani', 'Khalid', 'khalid.amrani@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0600000001', 'Actif');

SET @new_user_id = LAST_INSERT_ID();

INSERT INTO chauffeurs (utilisateur_id, numero_permis, date_expiration_permis, salaire, statut) 
VALUES (@new_user_id, 'RB-2024-999', DATE_ADD(CURDATE(), INTERVAL 2 YEAR), 4500.00, 'Actif');

SET @chauffeur_danger = (SELECT id FROM chauffeurs LIMIT 1);

-- Accidents pour ce chauffeur
INSERT INTO accidents (bus_id, chauffeur_id, date, description, lieu, gravite, statut) VALUES
(@bus_problematique, @chauffeur_danger, DATE_SUB(NOW(), INTERVAL 5 DAY), 'Choc lÃ©ger pare-chocs avant', 'Av. des Ires', 'LÃ©ger', 'En cours'),
(@bus_problematique, @chauffeur_danger, DATE_SUB(NOW(), INTERVAL 20 DAY), 'RÃ©troviseur arrachÃ© par un camion', 'Rocade Rabat', 'Moyenne', 'RÃ©solu'),
(@bus_problematique, @chauffeur_danger, DATE_SUB(NOW(), INTERVAL 45 DAY), 'Collision mineure au feu rouge', 'Hay Riad', 'LÃ©ger', 'CloturÃ©');


-- ==============================================================================
-- 4. ABSENCES ET PRÃ‰SENCES
-- ==============================================================================

-- On va marquer des absences pour quelques Ã©lÃ¨ves spÃ©cifiques pour qu'ils apparaissent dans "Ã‰lÃ¨ves les plus absents".
-- On prend les 5 premiers Ã©lÃ¨ves.
SET @eleve_absent_1 = (SELECT id FROM eleves LIMIT 1);
SET @eleve_absent_2 = (SELECT id FROM eleves LIMIT 1 OFFSET 1);

-- Ã‰lÃ¨ve 1 : TRES absent (Absence Matin et Soir sur plusieurs jours)
INSERT INTO presences (eleve_id, bus_id, date, present_matin, present_soir) VALUES
(@eleve_absent_1, @bus_problematique, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 0, 0), -- Absent matin et soir
(@eleve_absent_1, @bus_problematique, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 0, 1), -- Absent matin
(@eleve_absent_1, @bus_problematique, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 0, 0), -- Absent matin et soir
(@eleve_absent_1, @bus_problematique, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 1, 0); -- Absent soir

-- Ã‰lÃ¨ve 2 : Moyennement absent
INSERT INTO presences (eleve_id, bus_id, date, present_matin, present_soir) VALUES
(@eleve_absent_2, @bus_clean, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 1, 0),
(@eleve_absent_2, @bus_clean, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 0, 1);

-- GÃ©nÃ©rer des PRÃ‰SENCES pour le reste (pour peupler les graphiques)
-- On prend 10 autres Ã©lÃ¨ves et on les marque prÃ©sents aujourd'hui
INSERT INTO presences (eleve_id, bus_id, date, present_matin, present_soir)
SELECT id, @bus_clean, CURDATE(), 1, 1
FROM eleves
WHERE id NOT IN (@eleve_absent_1, @eleve_absent_2)
LIMIT 10;
