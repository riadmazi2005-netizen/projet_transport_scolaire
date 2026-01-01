-- ============================================
-- TRANSPORT SCOLAIRE - BASE DE DONNÉES COMPLÈTE
-- ============================================
-- Ce fichier contient :
-- 1. Le schéma complet de la base de données (SANS colonne role)
-- 2. Tables séparées : administrateurs, tuteurs, chauffeurs, responsables_bus
-- 3. Les données de test complètes
-- 
-- MOT DE PASSE POUR TOUS LES COMPTES DE TEST : test123
-- Hash bcrypt pour "test123" : $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- ============================================

-- Créer la base de données
CREATE DATABASE IF NOT EXISTS transport_scolaire;
USE transport_scolaire;

-- ============================================
-- 1. SCHÉMA DE LA BASE DE DONNÉES
-- ============================================

-- Table utilisateurs (table de base pour tous les types d'utilisateurs)
-- PAS de colonne role - le type est déterminé par la présence dans les tables spécifiques
CREATE TABLE utilisateurs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    statut ENUM('Actif', 'Inactif') DEFAULT 'Actif',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table administrateurs (accès unique - un utilisateur ne peut être que dans UNE table)
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
    statut ENUM('Actif', 'Licencié', 'Suspendu') DEFAULT 'Actif',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- Table responsables_bus
CREATE TABLE responsables_bus (
    id INT PRIMARY KEY AUTO_INCREMENT,
    utilisateur_id INT UNIQUE NOT NULL,
    zone_responsabilite VARCHAR(100),
    statut ENUM('Actif', 'Inactif') DEFAULT 'Actif',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- Table eleves (référence maintenant tuteurs au lieu de utilisateurs)
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

-- Table accidents
CREATE TABLE accidents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    heure TIME,
    bus_id INT,
    chauffeur_id INT,
    description TEXT NOT NULL,
    degats TEXT,
    lieu VARCHAR(255),
    gravite ENUM('Légère', 'Moyenne', 'Grave') NOT NULL,
    blesses BOOLEAN DEFAULT FALSE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES bus(id) ON DELETE SET NULL,
    FOREIGN KEY (chauffeur_id) REFERENCES chauffeurs(id) ON DELETE SET NULL
);

-- Table notifications
-- destinataire_type est déterminé par la présence dans les tables spécifiques
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    destinataire_id INT NOT NULL,
    destinataire_type ENUM('chauffeur', 'responsable', 'tuteur', 'admin') NOT NULL,
    titre VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'alerte', 'avertissement') DEFAULT 'info',
    lue BOOLEAN DEFAULT FALSE,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table demandes (référence maintenant tuteurs au lieu de utilisateurs)
-- Structure complète avec toutes les améliorations (code de vérification, zone géographique, etc.)
CREATE TABLE demandes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    eleve_id INT,
    tuteur_id INT NOT NULL,
    type_demande ENUM(
        'inscription', 
        'modification', 
        'desinscription',
        'Augmentation',
        'Congé',
        'Déménagement',
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
        'Payée',
        'Validée', 
        'Inscrit',
        'Refusée'
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
    statut ENUM('Active', 'Suspendue', 'Terminée') DEFAULT 'Active',
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
    mode_paiement ENUM('Espèces', 'Virement', 'Carte bancaire', 'Chèque') DEFAULT 'Espèces',
    statut ENUM('Payé', 'En attente', 'Échoué') DEFAULT 'Payé',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inscription_id) REFERENCES inscriptions(id) ON DELETE CASCADE
);

-- Table presences (pour suivre les présences et absences des élèves)
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
    statut ENUM('Actif', 'Terminé', 'Suspendu') DEFAULT 'Actif',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chauffeur_id) REFERENCES chauffeurs(id) ON DELETE CASCADE,
    FOREIGN KEY (trajet_id) REFERENCES trajets(id) ON DELETE CASCADE,
    FOREIGN KEY (bus_id) REFERENCES bus(id) ON DELETE SET NULL
);

-- ============================================
-- 2. INDEX POUR AMÉLIORER LES PERFORMANCES
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
CREATE INDEX idx_notifications_destinataire ON notifications(destinataire_id, destinataire_type);
CREATE INDEX idx_inscriptions_bus ON inscriptions(bus_id);
CREATE INDEX idx_paiements_inscription ON paiements(inscription_id);
CREATE INDEX idx_presences_eleve ON presences(eleve_id);
CREATE INDEX idx_presences_date ON presences(date);
CREATE INDEX idx_presences_bus ON presences(bus_id);
CREATE INDEX idx_conduire_chauffeur ON conduire(chauffeur_id);
CREATE INDEX idx_conduire_trajet ON conduire(trajet_id);

-- ============================================
-- 3. DONNÉES DE TEST
-- ============================================
-- IMPORTANT: Tous les comptes utilisent le mot de passe "test123"
-- Hash bcrypt valide pour "test123": $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

-- 3.1. Créer les utilisateurs de base
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, statut) VALUES
-- Admin de test
('Admin', 'Système', 'admin@transport.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0612345678', 'Actif'),

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

-- 3.2. Créer l'administrateur (utilisateur_id = 1)
INSERT INTO administrateurs (utilisateur_id) VALUES (1);

-- 3.3. Créer les chauffeurs
INSERT INTO chauffeurs (utilisateur_id, numero_permis, date_expiration_permis, nombre_accidents, statut) VALUES
(2, 'CH-001956', DATE_ADD(CURDATE(), INTERVAL 2 YEAR), 0, 'Actif'),        -- Ahmed Idrissi
(3, 'CH-009789', DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 1, 'Actif'),        -- Youssef Tazi
(4, 'CH-000123', DATE_ADD(CURDATE(), INTERVAL 3 YEAR), 0, 'Actif');        -- Karim El Fassi

-- 3.4. Créer les responsables bus
INSERT INTO responsables_bus (utilisateur_id, zone_responsabilite, statut) VALUES
(5, 'Zone Centre - Maarif, Gauthier, 2 Mars', 'Actif'),      -- Nadia Kettani
(6, 'Zone Nord - Sidi Maarouf, Californie, Oasis', 'Actif'); -- Omar Benjelloun

-- 3.5. Créer les tuteurs
INSERT INTO tuteurs (utilisateur_id) VALUES
(7),  -- Mohammed Alami
(8);  -- Fatima Benjelloun

-- 3.6. Créer les trajets
INSERT INTO trajets (nom, zones, heure_depart_matin_a, heure_arrivee_matin_a, heure_depart_soir_a, heure_arrivee_soir_a, heure_depart_matin_b, heure_arrivee_matin_b, heure_depart_soir_b, heure_arrivee_soir_b) VALUES
('Trajet Centre', '["Maarif", "Gauthier", "2 Mars", "Ain Diab"]', '07:30:00', '08:00:00', '17:00:00', '17:30:00', '08:00:00', '08:30:00', '17:30:00', '18:00:00'),
('Trajet Nord', '["Sidi Maarouf", "Californie", "Oasis", "Ain Sebaa"]', '07:00:00', '08:00:00', '16:45:00', '17:30:00', '07:45:00', '08:30:00', '17:15:00', '18:00:00'),
('Trajet Sud', '["Hay Hassani", "Oulfa", "Sbata", "Hay Mohammadi"]', '07:15:00', '08:00:00', '16:50:00', '17:35:00', '08:00:00', '08:45:00', '17:20:00', '18:05:00');

-- 3.7. Créer les bus
INSERT INTO bus (numero, marque, modele, annee_fabrication, capacite, chauffeur_id, responsable_id, trajet_id, statut) VALUES
('BUS-001', 'Mercedes', 'Sprinter', 2020, 50, 1, 1, 1, 'Actif'),    -- Chauffeur: Ahmed (chauffeur_id=1), Responsable: Nadia (responsable_id=1)
('BUS-002', 'Volvo', '9700', 2019, 45, 2, 1, 1, 'Actif'),           -- Chauffeur: Youssef (chauffeur_id=2), Responsable: Nadia
('BUS-003', 'Iveco', 'Daily', 2021, 35, 3, 2, 2, 'Actif'),          -- Chauffeur: Karim (chauffeur_id=3), Responsable: Omar (responsable_id=2)
('BUS-004', 'Mercedes', 'Sprinter', 2022, 50, NULL, 2, 3, 'Actif'); -- Pas de chauffeur assigné, Responsable: Omar

-- 3.8. Créer des élèves (référence maintenant tuteurs au lieu de utilisateurs)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES
-- Élèves de Mohammed Alami (tuteur_id = 1)
('Alami', 'Yasmine', '2012-03-15', '123 Rue Maarif, Casablanca', '0612345679', 'mohammed.alami@email.ma', 'CE2', 1, 'Actif'),
('Alami', 'Karim', '2014-09-22', '123 Rue Maarif, Casablanca', '0612345679', 'mohammed.alami@email.ma', 'CP', 1, 'Actif'),

-- Élèves de Fatima Benjelloun (tuteur_id = 2)
('Benjelloun', 'Salma', '2011-06-10', '45 Boulevard Gauthier, Casablanca', '0612345680', 'fatima.benjelloun@email.ma', 'CM1', 2, 'Actif'),
('Benjelloun', 'Mehdi', '2013-01-20', '45 Boulevard Gauthier, Casablanca', '0612345680', 'fatima.benjelloun@email.ma', 'CE1', 2, 'Actif');

-- 3.9. Créer des inscriptions
INSERT INTO inscriptions (eleve_id, bus_id, date_inscription, date_debut, date_fin, statut, montant_mensuel) VALUES
(1, 1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 'Active', 400.00), -- Yasmine -> BUS-001
(2, 1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 'Active', 400.00), -- Karim -> BUS-001
(3, 2, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 'Active', 400.00), -- Salma -> BUS-002
(4, 3, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 'Active', 400.00); -- Mehdi -> BUS-003

-- 3.10. Créer des présences (pour tester)
INSERT INTO presences (eleve_id, date, present_matin, present_soir, bus_id, responsable_id, chauffeur_id, remarque) VALUES
(1, CURDATE(), TRUE, TRUE, 1, 1, 1, 'Présent'),
(2, CURDATE(), TRUE, TRUE, 1, 1, 1, 'Présent'),
(3, CURDATE(), TRUE, FALSE, 2, 1, 2, 'Absent le soir'),
(4, CURDATE(), FALSE, TRUE, 3, 2, 3, 'Absent le matin'),
(1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), TRUE, TRUE, 1, 1, 1, NULL),
(2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), TRUE, TRUE, 1, 1, 1, NULL);

-- 3.11. Créer des demandes (référence maintenant tuteurs)
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, description, statut) VALUES
(4, 2, 'inscription', 'Demande d\'inscription pour Mehdi Benjelloun', 'En attente'),
(1, 1, 'modification', 'Changement de zone pour Yasmine Alami', 'En attente');

-- 3.12. Créer des notifications
INSERT INTO notifications (destinataire_id, destinataire_type, titre, message, type, lue) VALUES
-- Notifications pour Admin (destinataire_id = 1 = administrateur.id)
(1, 'admin', 'Nouvelle inscription', 'Nouvelle demande d\'inscription reçue pour Mehdi Benjelloun', 'info', FALSE),
(1, 'admin', 'Paiement en attente', '3 paiements en attente de validation', 'alerte', FALSE),
(1, 'admin', 'Bus en maintenance', 'Le bus BUS-004 nécessite une révision', 'avertissement', FALSE),

-- Notifications pour Chauffeurs (destinataire_id = chauffeur.id)
(1, 'chauffeur', 'Nouveau trajet assigné', 'Vous avez été assigné au BUS-001 sur le trajet Centre', 'info', FALSE),
(1, 'chauffeur', 'Rappel: Inspection', 'Votre permis expire dans 2 ans. Pensez à le renouveler.', 'info', TRUE),
(2, 'chauffeur', 'Trajet du jour', 'Votre trajet du jour: BUS-002 - Trajet Centre', 'info', FALSE),
(3, 'chauffeur', 'Bienvenue', 'Bienvenue dans le système de transport scolaire', 'info', FALSE),

-- Notifications pour Responsables (destinataire_id = responsable_bus.id)
(1, 'responsable', 'Nouveau bus assigné', 'Le BUS-001 et BUS-002 sont sous votre responsabilité', 'info', FALSE),
(1, 'responsable', 'Présences du jour', '2 élèves absents aujourd\'hui sur votre zone', 'alerte', FALSE),
(2, 'responsable', 'Zone Nord', 'Vous êtes responsable de la Zone Nord - 2 bus', 'info', FALSE),
(2, 'responsable', 'Nouvelle inscription', 'Nouvel élève inscrit sur votre zone: Mehdi Benjelloun', 'info', FALSE);

-- 3.13. Créer des paiements
INSERT INTO paiements (inscription_id, montant, mois, annee, date_paiement, mode_paiement, statut) VALUES
(1, 400.00, MONTH(CURDATE()), YEAR(CURDATE()), DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'Virement', 'Payé'),
(1, 400.00, MONTH(DATE_ADD(CURDATE(), INTERVAL 1 MONTH)), YEAR(CURDATE()), NULL, NULL, 'En attente'),
(2, 400.00, MONTH(CURDATE()), YEAR(CURDATE()), DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'Espèces', 'Payé'),
(3, 400.00, MONTH(CURDATE()), YEAR(CURDATE()), DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'Carte bancaire', 'Payé'),
(4, 400.00, MONTH(CURDATE()), YEAR(CURDATE()), NULL, NULL, 'En attente');

-- 3.14. Créer des accidents (pour tester)
INSERT INTO accidents (date, heure, bus_id, chauffeur_id, description, degats, lieu, gravite, blesses, date_creation) VALUES
(DATE_SUB(CURDATE(), INTERVAL 30 DAY), '08:15:00', 2, 2, 'Collision mineure avec un poteau', 'Rétroviseur cassé', 'Boulevard Gauthier', 'Légère', FALSE, DATE_SUB(CURDATE(), INTERVAL 30 DAY)),
(DATE_SUB(CURDATE(), INTERVAL 90 DAY), '17:20:00', 1, 1, 'Accrochage avec un véhicule', 'Rayure sur la portière arrière', 'Avenue 2 Mars', 'Légère', FALSE, DATE_SUB(CURDATE(), INTERVAL 90 DAY));

-- 3.15. Créer des relations CONDUIRE (chauffeurs-trajets)
INSERT INTO conduire (chauffeur_id, trajet_id, bus_id, date_debut, date_fin, statut) VALUES
(1, 1, 1, DATE_SUB(CURDATE(), INTERVAL 90 DAY), NULL, 'Actif'),  -- Ahmed conduit BUS-001 sur Trajet Centre
(2, 1, 2, DATE_SUB(CURDATE(), INTERVAL 60 DAY), NULL, 'Actif'),  -- Youssef conduit BUS-002 sur Trajet Centre
(3, 2, 3, DATE_SUB(CURDATE(), INTERVAL 30 DAY), NULL, 'Actif');  -- Karim conduit BUS-003 sur Trajet Nord

-- ============================================
-- 4. RÉSUMÉ DES DONNÉES CRÉÉES
-- ============================================
SELECT '=== RÉSUMÉ DES DONNÉES DE TEST ===' as '';

SELECT 'Utilisateurs:' as '', COUNT(*) as total FROM utilisateurs;
SELECT 'Administrateurs:' as '', COUNT(*) as total FROM administrateurs;
SELECT 'Chauffeurs:' as '', COUNT(*) as total FROM chauffeurs;
SELECT 'Responsables:' as '', COUNT(*) as total FROM responsables_bus;
SELECT 'Tuteurs:' as '', COUNT(*) as total FROM tuteurs;
SELECT 'Bus:' as '', COUNT(*) as total FROM bus;
SELECT 'Trajets:' as '', COUNT(*) as total FROM trajets;
SELECT 'Élèves:' as '', COUNT(*) as total FROM eleves;
SELECT 'Inscriptions:' as '', COUNT(*) as total FROM inscriptions;
SELECT 'Paiements:' as '', COUNT(*) as total FROM paiements;
SELECT 'Notifications:' as '', COUNT(*) as total FROM notifications;
SELECT 'Accidents:' as '', COUNT(*) as total FROM accidents;

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
-- Pour vérifier que tout fonctionne, testez la connexion avec :
-- Email: admin@transport.ma
-- Mot de passe: test123
-- Type: admin (déterminé automatiquement par la présence dans la table administrateurs)
-- ============================================
