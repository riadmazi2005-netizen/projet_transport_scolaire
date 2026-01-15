-- DONNEES DE TEST - 50 ELEVES
-- Ce fichier ajoute environ 50 élèves, leurs tuteurs, inscriptions et paiements.
-- Les élèves sont répartis sur les différentes zones.
-- Mot de passe pour tous les utilisateurs : test123

USE transport_scolaire;

-- ==============================================================================
-- 1. CRÉATION DES TUTEURS (PARENTS) ET UTILISATEURS ASSOCIÉS
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
-- 2. CRÉATION DES ÉLÈVES (50 élèves)
-- ==============================================================================

-- Zone: Agdal (Rabat)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Bennani', 'Ali', '2015-05-12', '10 Rue Agdal', '0661110001', 'k.bennani@test.com', 'CP', @tuteur_1, 'Actif'),
('Bennani', 'Lina', '2013-08-23', '10 Rue Agdal', '0661110001', 'k.bennani@test.com', 'CE2', @tuteur_1, 'Actif'),
('Chraibi', 'Adam', '2012-01-15', '45 Av Hassan II, Agdal', '0661110002', 'm.chraibi@test.com', 'CM1', @tuteur_2, 'Actif');

-- Zone: Hassan (Rabat)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Berrada', 'Sara', '2014-03-30', '12 Rue Hassan', '0661110003', 'o.berrada@test.com', 'CE1', @tuteur_3, 'Actif'),
('Berrada', 'Rania', '2016-11-10', '12 Rue Hassan', '0661110003', 'o.berrada@test.com', 'Maternelle', @tuteur_3, 'Actif'),
('Tazi', 'Amine', '2011-06-20', '88 Bd Mohamed V, Hassan', '0661110004', 's.tazi@test.com', 'CM2', @tuteur_4, 'Actif');

-- Zone: Hay Riad (Rabat)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('El Fassi', 'Ghita', '2013-09-05', 'Villa 45, Secteur 10, Hay Riad', '0661110005', 'y.elfassi@test.com', 'CE2', @tuteur_5, 'Actif'),
('El Fassi', 'Mehdi', '2010-02-14', 'Villa 45, Secteur 10, Hay Riad', '0661110005', 'y.elfassi@test.com', '6eme', @tuteur_5, 'Actif'),
('Alaoui', 'Yassine', '2012-12-01', 'Av Annakhil, Hay Riad', '0661110006', 'f.alaoui@test.com', 'CM1', @tuteur_6, 'Actif');

-- Zone: Yacoub El Mansour (Rabat)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Kabbaj', 'Hiba', '2015-07-22', 'Res. Ocean, Yacoub Mansour', '0661110007', 'a.kabbaj@test.com', 'CP', @tuteur_7, 'Actif'),
('Kabbaj', 'Zineb', '2013-04-18', 'Res. Ocean, Yacoub Mansour', '0661110007', 'a.kabbaj@test.com', 'CE2', @tuteur_7, 'Actif'),
('Idrissi', 'Omar', '2014-09-09', 'Rue 12, Yacoub Mansour', '0661110008', 'l.idrissi@test.com', 'CE1', @tuteur_8, 'Actif');

-- Zone: Souissi (Rabat)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Benjelloun', 'Kenza', '2011-03-03', 'Villa 12, Souissi', '0661110009', 'r.benjelloun@test.com', 'CM2', @tuteur_9, 'Actif'),
('Benjelloun', 'Ali', '2013-05-15', 'Villa 12, Souissi', '0661110009', 'r.benjelloun@test.com', 'CE2', @tuteur_9, 'Actif'),
('Benjelloun', 'Nour', '2015-11-20', 'Villa 12, Souissi', '0661110009', 'r.benjelloun@test.com', 'CP', @tuteur_9, 'Actif');

-- Zone: Nahda (Rabat)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Tahiri', 'Salma', '2012-08-08', 'Lot Nahda 2', '0661110010', 'n.tahiri@test.com', 'CM1', @tuteur_10, 'Actif'),
('Tahiri', 'Ahmed', '2010-12-12', 'Lot Nahda 2', '0661110010', 'n.tahiri@test.com', '6eme', @tuteur_10, 'Actif'),
('Mekouar', 'Yanis', '2014-02-28', 'Rue Nahda 1', '0661110011', 'd.mekouar@test.com', 'CE1', @tuteur_11, 'Actif');

-- Zone: Akkari (Rabat)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Slaoui', 'Ines', '2013-06-14', 'Bd Akkari', '0661110012', 'k.slaoui@test.com', 'CE2', @tuteur_12, 'Actif'),
('Slaoui', 'Rym', '2015-09-30', 'Bd Akkari', '0661110012', 'k.slaoui@test.com', 'CP', @tuteur_12, 'Actif'),
('Kadiri', 'Jad', '2011-11-11', 'Rue 4, Akkari', '0661110013', 'h.kadiri@test.com', 'CM2', @tuteur_13, 'Actif');

-- Zone: Takkadoum (Rabat)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Chaoui', 'Malak', '2012-05-05', 'Res Takkadoum', '0661110014', 's.chaoui@test.com', 'CM1', @tuteur_14, 'Actif'),
('Chaoui', 'Samy', '2014-10-10', 'Res Takkadoum', '0661110014', 's.chaoui@test.com', 'CE1', @tuteur_14, 'Actif'),
('Jettou', 'Anas', '2013-07-07', 'Av Takkadoum', '0661110015', 'a.jettou@test.com', 'CE2', @tuteur_15, 'Actif');

-- Zone: Hay Amal (Salé)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Bennani', 'Dina', '2011-01-25', 'Hay Amal, Salé', '0661110001', 'k.bennani@test.com', 'CM2', @tuteur_1, 'Actif'),
('Chraibi', 'Sofia', '2015-03-15', 'Hay Amal, Salé', '0661110002', 'm.chraibi@test.com', 'CP', @tuteur_2, 'Actif');

-- Zone: Hay Karima (Salé)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Berrada', 'Khalil', '2012-09-20', 'Hay Karima, Salé', '0661110003', 'o.berrada@test.com', 'CM1', @tuteur_3, 'Actif'),
('Tazi', 'Neyla', '2014-04-05', 'Hay Karima, Salé', '0661110004', 's.tazi@test.com', 'CE1', @tuteur_4, 'Actif');

-- Zone: Hay Nbi3at (Salé)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('El Fassi', 'Rayan', '2013-12-30', 'Hay Nbi3at, Salé', '0661110005', 'y.elfassi@test.com', 'CE2', @tuteur_5, 'Actif'),
('Alaoui', 'Mia', '2015-08-15', 'Hay Nbi3at, Salé', '0661110006', 'f.alaoui@test.com', 'CP', @tuteur_6, 'Actif');

-- Zone: Sidi Moussa (Salé)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Kabbaj', 'Amir', '2011-05-10', 'Sidi Moussa, Salé', '0661110007', 'a.kabbaj@test.com', 'CM2', @tuteur_7, 'Actif'),
('Idrissi', 'Leen', '2014-01-20', 'Sidi Moussa, Salé', '0661110008', 'l.idrissi@test.com', 'CE1', @tuteur_8, 'Actif');

-- Zone: Boulknadel (Salé)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Benjelloun', 'Reda', '2012-06-06', 'Boulknadel', '0661110009', 'r.benjelloun@test.com', 'CM1', @tuteur_9, 'Actif'),
('Tahiri', 'Yara', '2015-02-14', 'Boulknadel', '0661110010', 'n.tahiri@test.com', 'CP', @tuteur_10, 'Actif');

-- Zone: Sale Jadida (Salé)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Mekouar', 'Samir', '2013-10-25', 'Sale Jadida', '0661110011', 'd.mekouar@test.com', 'CE2', @tuteur_11, 'Actif'),
('Slaoui', 'Lilya', '2011-04-12', 'Sale Jadida', '0661110012', 'k.slaoui@test.com', 'CM2', @tuteur_12, 'Actif');

-- Zone: Harhoura (Salé/Temara)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Kadiri', 'Ziad', '2014-09-09', 'Villa Harhoura', '0661110013', 'h.kadiri@test.com', 'CE1', @tuteur_13, 'Actif'),
('Chaoui', 'Nour', '2012-11-30', 'Villa Harhoura', '0661110014', 's.chaoui@test.com', 'CM1', @tuteur_14, 'Actif'),
('Jettou', 'Ilya', '2015-07-01', 'Villa Harhoura', '0661110015', 'a.jettou@test.com', 'CP', @tuteur_15, 'Actif');

-- Zone: Maamora (Salé)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Bennani', 'Kamal', '2013-02-18', 'Maamora', '0661110001', 'k.bennani@test.com', 'CE2', @tuteur_1, 'Actif'),
('Chraibi', 'Soraya', '2011-08-22', 'Maamora', '0661110002', 'm.chraibi@test.com', 'CM2', @tuteur_2, 'Actif');

-- Zone: Temara Centre
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Berrada', 'Marwane', '2014-12-05', 'Temara Centre', '0661110003', 'o.berrada@test.com', 'CE1', @tuteur_3, 'Actif'),
('Tazi', 'Yasmine', '2012-05-15', 'Temara Centre', '0661110004', 's.tazi@test.com', 'CM1', @tuteur_4, 'Actif');

-- Zone: Milano (Temara)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('El Fassi', 'Driss', '2015-01-10', 'Res Milano, Temara', '0661110005', 'y.elfassi@test.com', 'CP', @tuteur_5, 'Actif'),
('Alaoui', 'Selma', '2013-09-28', 'Res Milano, Temara', '0661110006', 'f.alaoui@test.com', 'CE2', @tuteur_6, 'Actif');

-- Quelques élèves supplémentaires en Vrac pour atteindre le compte
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Kabbaj', 'Nabil', '2011-02-02', 'Maarif', '0661110007', 'a.kabbaj@test.com', 'CM2', @tuteur_7, 'Actif'),
('Idrissi', 'Mounir', '2014-06-16', 'Agdal', '0661110008', 'l.idrissi@test.com', 'CE1', @tuteur_8, 'Actif'),
('Benjelloun', 'Sanae', '2012-10-10', 'Hay Riad', '0661110009', 'r.benjelloun@test.com', 'CM1', @tuteur_9, 'Actif'),
('Tahiri', 'Yassir', '2015-03-23', 'Souissi', '0661110010', 'n.tahiri@test.com', 'CP', @tuteur_10, 'Actif');


-- ==============================================================================
-- 3. INSCRIPTIONS ET PAIEMENTS
-- ==============================================================================

-- On crée des inscriptions pour tous ces élèves
-- Et on ajoute des paiements (certains payés, certains en attente)

-- Procedure pour simplifier (ou bloc répété en SQL pur pour compatibilité simple)
-- Utilisons une requête INSERT INTO ... SELECT pour faire ça en masse

INSERT INTO inscriptions (eleve_id, bus_id, date_inscription, date_debut, date_fin, statut, montant_mensuel)
SELECT 
    id, 
    CAST(1 + FLOOR(RAND() * 4) AS UNSIGNED), -- Bus aléatoire entre 1 et 4
    CURDATE(), 
    CURDATE(), 
    DATE_ADD(CURDATE(), INTERVAL 9 MONTH), 
    'Active', 
    500.00
FROM eleves 
WHERE email_parent LIKE '%@test.com';

-- Paiement Mois 1 (Payé pour tous)
INSERT INTO paiements (inscription_id, montant, mois, annee, date_paiement, mode_paiement, statut)
SELECT 
    id, 
    500.00, 
    MONTH(CURDATE()), 
    YEAR(CURDATE()), 
    CURDATE(), 
    ELT(1 + FLOOR(RAND() * 3), 'Espèces', 'Virement', 'Carte bancaire'),
    'Payé'
FROM inscriptions
WHERE eleve_id IN (SELECT id FROM eleves WHERE email_parent LIKE '%@test.com');

-- Paiement Mois 2 (50% payés, 50% en attente)
INSERT INTO paiements (inscription_id, montant, mois, annee, date_paiement, mode_paiement, statut)
SELECT 
    id, 
    500.00, 
    MONTH(DATE_ADD(CURDATE(), INTERVAL 1 MONTH)), 
    YEAR(DATE_ADD(CURDATE(), INTERVAL 1 MONTH)), 
    IF(RAND() > 0.5, CURDATE(), NULL), 
    IF(RAND() > 0.5, 'Espèces', NULL),
    IF(RAND() > 0.5, 'Payé', 'En attente')
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

SELECT 'Génération des données terminée avec succès.' as 'Status';
