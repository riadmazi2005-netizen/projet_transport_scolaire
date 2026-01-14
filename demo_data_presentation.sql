-- =================================================================
-- DONNÉES DE DÉMONSTRATION ÉTENDUES - PRÉSENTATION PROJET (MAROC)
-- =================================================================
-- Ce script génère un jeu de données complet pour tester TOUTES les fonctionnalités.
-- Contexte : Octobre/Novembre 2025
-- Volume :
--   - 8 Tuteurs, 8 Chauffeurs, 8 Responsables
--   - 8 Bus, 8 Trajets
--   - 20 Élèves (18 Inscrits, 2 Refusés)
--   - 5 Demandes en cours
--   - Historique complet (Paiements, Accidents, Essence, Signalements)
-- =================================================================

USE transport_scolaire;

-- Désactiver les vérifications de clés étrangères pour le nettoyage
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
-- 1. UTILISATEURS & RÔLES
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
(9, 'Bettana, Salé');

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
(15, 'RB-2020-555', '2026-06-06', 0.00, 'Licencié'), -- Chauffeur licencié
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
(23, 'Zone Salé Centre', 0.00, 'Inactif'),
(24, 'Zone Salé Marina', 5300.00, 'Actif'),
(25, 'Zone Temara', 5200.00, 'Actif');


-- =================================================================
-- 2. ZONES & TRAJETS (8)
-- =================================================================

INSERT INTO zones (nom, ville, actif) VALUES 
('Hay Riad', 'Rabat', TRUE), ('Agdal', 'Rabat', TRUE), ('Souissi', 'Rabat', TRUE), ('Hassan', 'Rabat', TRUE),
('Harhoura', 'Temara', TRUE), ('Guich', 'Rabat', TRUE), ('Sala Al Jadida', 'Salé', TRUE), ('Hay Karima', 'Salé', TRUE);

INSERT INTO trajets (nom, zones, heure_depart_matin_a, heure_arrivee_matin_a) VALUES 
('Circuit A - Hay Riad', '["Hay Riad"]', '07:30', '08:00'),
('Circuit B - Agdal/Hassan', '["Agdal", "Hassan"]', '07:15', '08:00'),
('Circuit C - Souissi', '["Souissi"]', '07:45', '08:15'),
('Circuit D - Harhoura', '["Harhoura"]', '07:00', '08:00'),
('Circuit E - Guich/Cygnes', '["Guich"]', '07:30', '08:00'),
('Circuit F - Salé Express', '["Sala Al Jadida"]', '06:45', '07:45'),
('Circuit G - Salé Nord', '["Hay Karima"]', '06:30', '07:30'),
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
-- 4. ÉLÈVES (20 Total: 18 Inscrits, 2 Refusés)
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

-- Tuteur 3 (M. Tazi) - 3 enfants (dont 1 Refusé)
INSERT INTO eleves (nom, prenom, date_naissance, classe, tuteur_id, statut) VALUES 
('Tazi', 'Kenza', '2013-09-09', '6eme', 3, 'Actif'),   -- 6
('Tazi', 'Mehdi', '2015-01-01', 'CM1', 3, 'Actif'),    -- 7
('Tazi', 'Ali', '2020-05-05', 'GS', 3, 'Inactif');     -- 8 (Refusé)

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

-- Tuteur 7 (Mme Naciri) - 2 enfants (dont 1 Refusé)
INSERT INTO eleves (nom, prenom, date_naissance, classe, tuteur_id, statut) VALUES 
('Naciri', 'Yassir', '2014-08-08', 'CM2', 7, 'Inactif'), -- 17 (Refusé)
('Naciri', 'Sara', '2016-01-20', 'CE1', 7, 'Actif');     -- 18

-- Tuteur 8 (M. Benjelloun) - 2 enfants
INSERT INTO eleves (nom, prenom, date_naissance, classe, tuteur_id, statut) VALUES 
('Benjelloun', 'Aya', '2013-05-05', '6eme', 8, 'Actif'), -- 19
('Benjelloun', 'Amir', '2015-03-30', 'CM1', 8, 'Actif'); -- 20


-- =================================================================
-- 5. INSCRIPTIONS (18 Actives, 2 Refusées)
-- =================================================================
-- Inscriptions Actives (Réparties sur les bus)
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

-- Demandes refusées (2)
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, statut, raison_refus) VALUES
(8, 3, 'inscription', 'Refusée', 'Pas de bus disponible pour la maternelle (GS)'),
(17, 7, 'inscription', 'Refusée', 'Zone géographique non couverte');


-- =================================================================
-- 6. DEMANDES (5 En cours pour test)
-- =================================================================
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, description, statut, date_creation) VALUES 
(1, 1, 'modification', 'Changement d\'adresse pour le mois prochain', 'En attente', NOW()),
(4, 2, 'Congé', 'Absence prévue pour voyage familial fin novembre', 'En cours de traitement', NOW()),
(9, 4, 'Autre', 'Demande de changement de bus (conflit horaire)', 'En attente', NOW()),
(11, 5, 'inscription', 'Nouvelle inscription pour l''an prochain', 'En attente', NOW()),
(19, 8, 'desinscription', 'Déménagement prévu en Décembre', 'En attente', NOW());


-- =================================================================
-- 7. PAIEMENTS (Octobre & Novembre 2025)
-- =================================================================
-- Paiements d'Octobre (Tous payés)
INSERT INTO paiements (inscription_id, montant, mois, annee, date_paiement, mode_paiement, statut)
SELECT id, montant_mensuel, 10, 2025, '2025-10-05', 'Virement', 'Payé' FROM inscriptions WHERE statut = 'Active';

-- Paiements de Novembre (Mix : Payé, En attente)
INSERT INTO paiements (inscription_id, montant, mois, annee, date_paiement, mode_paiement, statut)
SELECT id, montant_mensuel, 11, 2025, 
CASE WHEN id % 2 = 0 THEN '2025-11-05' ELSE NULL END, 
CASE WHEN id % 2 = 0 THEN 'Espèces' ELSE NULL END, 
CASE WHEN id % 2 = 0 THEN 'Payé' ELSE 'En attente' END 
FROM inscriptions WHERE statut = 'Active';


-- =================================================================
-- 8. ABSENCES & ACCIDENTS
-- =================================================================
-- Absences du 2 Novembre 2025 (Dimanche ? Disons Lundi 3 Nov pour cohérence, ou on garde le scénario user)
-- Gardons 2 Nov comme demandé.

-- 5 Élèves absents le 2 Novembre SOIR
INSERT INTO presences (eleve_id, date, present_matin, present_soir, bus_id, responsable_id, remarque) VALUES 
(1, '2025-11-02', 1, 0, 1, 1, 'RDV Médical'),
(5, '2025-11-02', 1, 0, 2, 2, 'Fatigue'),
(10, '2025-11-02', 1, 0, 4, 4, NULL),
(15, '2025-11-02', 0, 0, 7, 7, 'Maladnie toute la journée'),
(20, '2025-11-02', 1, 0, 1, 1, 'Parti avec ses parents');

-- Accidents / Incidents (2)
INSERT INTO accidents (date, bus_id, chauffeur_id, responsable_id, description, gravite, statut) VALUES 
('2025-10-20', 1, 1, 1, 'Petit accrochage pare-choc arrière parking école', 'Légère', 'Validé'),
('2025-11-05', 6, 7, 7, 'Panne moteur en plein trajet (surchauffe)', 'Moyenne', 'En attente');


-- =================================================================
-- 9. FONCTIONNALITÉS CHAUFFEUR (Essence, Signalements)
-- =================================================================
-- Prise essence
INSERT INTO prise_essence (chauffeur_id, bus_id, date, quantite_litres, prix_total, station_service) VALUES 
(1, 1, '2025-10-15', 50.5, 650.00, 'Afriquia Hay Riad'),
(2, 2, '2025-10-20', 40.0, 520.00, 'Shell Agdal'),
(4, 4, '2025-11-01', 60.0, 780.00, 'Total Harhoura');

-- Signalements Maintenance
INSERT INTO signalements_maintenance (chauffeur_id, bus_id, type_probleme, description, urgence, statut) VALUES 
(7, 6, 'mecanique', 'Bruit suspect moteur à l\'accélération', 'haute', 'en_cours'),
(3, 3, 'climatisation', 'Clim ne refroidit pas bien', 'faible', 'en_attente');


-- =================================================================
-- 10. NOTIFICATIONS (Génération en masse)
-- =================================================================
-- Notifs aux tuteurs pour les absences
INSERT INTO notifications (destinataire_id, destinataire_type, titre, message, type, lue, date)
SELECT tuteur_id, 'tuteur', 'Absence Enfant', 'Votre enfant a été marqué absent le 02/11/2025', 'alerte', 0, '2025-11-02 18:00:00'
FROM eleves WHERE id IN (1, 5, 10, 15, 20);

-- Notifs aux responsables pour les accidents
INSERT INTO notifications (destinataire_id, destinataire_type, titre, message, type, lue, date)
VALUES (7, 'responsable', 'Panne Bus', 'Le bus BUS-06 a signalé une panne moteur', 'warning', 0, '2025-11-05 08:30:00');

-- Notifs Paiement pour ceux en attente
INSERT INTO notifications (destinataire_id, destinataire_type, titre, message, type, lue, date)
SELECT t.id, 'tuteur', 'Paiement En Attente', 'Le paiement de Novembre est en attente.', 'info', 0, NOW()
FROM paiements p
JOIN inscriptions i ON p.inscription_id = i.id
JOIN eleves e ON i.eleve_id = e.id
JOIN tuteurs t ON e.tuteur_id = t.id
WHERE p.statut = 'En attente';

SELECT '=== GÉNÉRATION TERMINÉE ===' as '';
SELECT '8 Chauffeurs, 8 Responsables, 8 Tuteurs créés.' as '';
SELECT '20 Élèves (18 actifs, 2 refusés).' as '';
SELECT '8 Bus, 8 Trajets.' as '';
SELECT 'Données financières et logistiques (Essence, Accidents) ajoutées.' as '';
