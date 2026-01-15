-- DONNEES DE TEST - 50 ELEVES
-- Ce fichier ajoute environ 50 élèves, leurs tuteurs, inscriptions, demandes et paiements.
-- Les élèves sont répartis sur les différentes zones et classes.
-- Classes: 1AP, 2AP, 3AP, 4AP, 5AP, 6AP, 1ACC, 2AC, 3AC, TC, 1BAC, 2BAC
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
-- 2. CRÉATION DES ÉLÈVES ET DEMANDES (50 élèves)
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

-- Zone: Hay Amal (Salé)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Bennani', 'Dina', '2014-01-25', 'Hay Amal, Salé', '0661110001', 'k.bennani@test.com', '5AP', @tuteur_1, 'Actif'),
('Chraibi', 'Sofia', '2019-03-15', 'Hay Amal, Salé', '0661110002', 'm.chraibi@test.com', '1AP', @tuteur_2, 'Actif');

SET @id_start = LAST_INSERT_ID();
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, zone_geographique, montant_facture, statut, description) VALUES
(@id_start, @tuteur_1, 'inscription', 'Hay Amal', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+1, @tuteur_2, 'inscription', 'Hay Amal', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}');

-- Zone: Hay Karima (Salé)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Berrada', 'Khalil', '2015-09-20', 'Hay Karima, Salé', '0661110003', 'o.berrada@test.com', '4AP', @tuteur_3, 'Actif'),
('Tazi', 'Neyla', '2017-04-05', 'Hay Karima, Salé', '0661110004', 's.tazi@test.com', '2AP', @tuteur_4, 'Actif');

SET @id_start = LAST_INSERT_ID();
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, zone_geographique, montant_facture, statut, description) VALUES
(@id_start, @tuteur_3, 'inscription', 'Hay Karima', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+1, @tuteur_4, 'inscription', 'Hay Karima', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}');

-- Zone: Hay Nbi3at (Salé)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('El Fassi', 'Rayan', '2016-12-30', 'Hay Nbi3at, Salé', '0661110005', 'y.elfassi@test.com', '3AP', @tuteur_5, 'Actif'),
('Alaoui', 'Mia', '2019-08-15', 'Hay Nbi3at, Salé', '0661110006', 'f.alaoui@test.com', '1AP', @tuteur_6, 'Actif');

SET @id_start = LAST_INSERT_ID();
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, zone_geographique, montant_facture, statut, description) VALUES
(@id_start, @tuteur_5, 'inscription', 'Hay Nbi3at', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+1, @tuteur_6, 'inscription', 'Hay Nbi3at', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}');

-- Zone: Sidi Moussa (Salé)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Kabbaj', 'Amir', '2014-05-10', 'Sidi Moussa, Salé', '0661110007', 'a.kabbaj@test.com', '5AP', @tuteur_7, 'Actif'),
('Idrissi', 'Leen', '2017-01-20', 'Sidi Moussa, Salé', '0661110008', 'l.idrissi@test.com', '2AP', @tuteur_8, 'Actif');

SET @id_start = LAST_INSERT_ID();
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, zone_geographique, montant_facture, statut, description) VALUES
(@id_start, @tuteur_7, 'inscription', 'Sidi Moussa', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+1, @tuteur_8, 'inscription', 'Sidi Moussa', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}');

-- Zone: Boulknadel (Salé)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Benjelloun', 'Reda', '2015-06-06', 'Boulknadel', '0661110009', 'r.benjelloun@test.com', '4AP', @tuteur_9, 'Actif'),
('Tahiri', 'Yara', '2019-02-14', 'Boulknadel', '0661110010', 'n.tahiri@test.com', '1AP', @tuteur_10, 'Actif');

SET @id_start = LAST_INSERT_ID();
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, zone_geographique, montant_facture, statut, description) VALUES
(@id_start, @tuteur_9, 'inscription', 'Boulknadel', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+1, @tuteur_10, 'inscription', 'Boulknadel', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}');

-- Zone: Sale Jadida (Salé)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Mekouar', 'Samir', '2016-10-25', 'Sale Jadida', '0661110011', 'd.mekouar@test.com', '3AP', @tuteur_11, 'Actif'),
('Slaoui', 'Lilya', '2014-04-12', 'Sale Jadida', '0661110012', 'k.slaoui@test.com', '5AP', @tuteur_12, 'Actif');

SET @id_start = LAST_INSERT_ID();
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, zone_geographique, montant_facture, statut, description) VALUES
(@id_start, @tuteur_11, 'inscription', 'Sale Jadida', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+1, @tuteur_12, 'inscription', 'Sale Jadida', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}');

-- Zone: Harhoura (Salé/Temara)
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES 
('Kadiri', 'Ziad', '2017-09-09', 'Villa Harhoura', '0661110013', 'h.kadiri@test.com', '2AP', @tuteur_13, 'Actif'),
('Chaoui', 'Nour', '2015-11-30', 'Villa Harhoura', '0661110014', 's.chaoui@test.com', '4AP', @tuteur_14, 'Actif'),
('Jettou', 'Ilya', '2019-07-01', 'Villa Harhoura', '0661110015', 'a.jettou@test.com', '1AP', @tuteur_15, 'Actif');

SET @id_start = LAST_INSERT_ID();
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, zone_geographique, montant_facture, statut, description) VALUES
(@id_start, @tuteur_13, 'inscription', 'Harhoura', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+1, @tuteur_14, 'inscription', 'Harhoura', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}'),
(@id_start+2, @tuteur_15, 'inscription', 'Harhoura', 500.00, 'Inscrit', '{"abonnement":"Mensuel"}');

-- Zone: Maamora (Salé)
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

-- Quelques élèves supplémentaires en Vrac pour atteindre le compte
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

-- On crée des inscriptions pour tous ces élèves
-- Et on ajoute des paiements (certains payés, certains en attente)

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
