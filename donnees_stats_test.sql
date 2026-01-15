-- DONNEES DE TEST POUR LES STATISTIQUES (PROBLEMES, ESSENCE, ACCIDENTS, ABSENCES)
-- Ce fichier doit être exécuté APRES donnees_test_50_eleves.sql pour garantir que les élèves et bus existent.

USE transport_scolaire;

-- ==============================================================================
-- 1. SIGNALEMENTS DE PROBLÈMES (BUS QUI A PLUSIEURS PROBLÈMES)
-- ==============================================================================

-- On suppose que des bus existent déjà (créés par le script précédent/initial).
-- On va cibler un bus spécifique pour qu'il ait "plusieurs problèmes" (ex: bus avec ID 1 ou le premier trouvé).
SET @bus_problematique = (SELECT id FROM bus LIMIT 1);
SET @bus_clean = (SELECT id FROM bus WHERE id != @bus_problematique LIMIT 1);
SET @chauffeur_id = (SELECT id FROM chauffeurs LIMIT 1);

-- Ajouter des signalements pour le bus problématique (4 problèmes)
-- Table réelle : signalements_maintenance
-- Correction : priorite -> urgence, valeurs en minuscule (haute, moyenne, faible), et status en snake_case
INSERT INTO signalements_maintenance (bus_id, chauffeur_id, type_probleme, description, urgence, statut, date_creation) VALUES
(@bus_problematique, @chauffeur_id, 'Panne Moteur', 'Moteur surchauffe dans les pentes', 'haute', 'en_attente', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(@bus_problematique, @chauffeur_id, 'Climatisation', 'La clim ne fonctionne pas à l\'arrière', 'moyenne', 'en_cours', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(@bus_problematique, @chauffeur_id, 'Pneu crevé', 'Pneu arrière droit à changer', 'haute', 'resolu', DATE_SUB(NOW(), INTERVAL 10 DAY)),
(@bus_problematique, @chauffeur_id, 'Siège cassé', 'Siège rangée 3 coté fenêtre abimé', 'faible', 'en_attente', DATE_SUB(NOW(), INTERVAL 15 DAY));

-- Quelques signalements pour d'autres bus (pour comparaison)
INSERT INTO signalements_maintenance (bus_id, chauffeur_id, type_probleme, description, urgence, statut, date_creation) VALUES
(@bus_clean, @chauffeur_id, 'Vitre bloquée', 'Vitre conducteur ne descend plus', 'faible', 'en_attente', DATE_SUB(NOW(), INTERVAL 3 DAY));


-- ==============================================================================
-- 2. CONSOMMATION D'ESSENCE (BUS QUI CONSOMME PLUS)
-- ==============================================================================

-- On cible un bus "gourmand" (peut être le même ou un autre).
SET @bus_gourmand = (SELECT id FROM bus ORDER BY id DESC LIMIT 1);

-- Entrées de carburant pour le bus gourmand (Total élevé)
-- Table réelle : prise_essence
-- Correction : montant -> prix_total, ajout colonne heure, suppression kilometrage (absent du create.php)
INSERT INTO prise_essence (bus_id, date, heure, quantite_litres, prix_total, chauffeur_id, station_service) VALUES
(@bus_gourmand, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '08:30:00', 150, 2000.00, @chauffeur_id, 'Station Total Agdal'),
(@bus_gourmand, DATE_SUB(CURDATE(), INTERVAL 8 DAY), '09:15:00', 140, 1850.00, @chauffeur_id, 'Station Shell Hay Riad'),
(@bus_gourmand, DATE_SUB(CURDATE(), INTERVAL 15 DAY), '18:45:00', 160, 2100.00, @chauffeur_id, 'Station Afriquia Temara');

-- Entrées pour un bus "normal"
INSERT INTO prise_essence (bus_id, date, heure, quantite_litres, prix_total, chauffeur_id, station_service) VALUES
(@bus_clean, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '07:00:00', 80, 1000.00, @chauffeur_id, 'Station Total Agdal'),
(@bus_clean, DATE_SUB(CURDATE(), INTERVAL 9 DAY), '14:20:00', 75, 950.00, @chauffeur_id, 'Station Total Agdal');


-- ==============================================================================
-- 3. ACCIDENTS (CHAUFFEUR AVEC PLUSIEURS ACCIDENTS)
-- ==============================================================================

-- On vérifie s'il y a des chauffeurs, sinon on en crée ou on utilise les IDs existants.
-- Supposons que IDs 1 et 2 existent (créés via l'interface ou script).
-- Si pas de chauffeurs, on en crée temporairement pour le test.
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, statut) 
VALUES ('Amrani', 'Khalid', 'khalid.amrani@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0600000001', 'Actif');

SET @new_user_id = LAST_INSERT_ID();

INSERT INTO chauffeurs (utilisateur_id, numero_permis, date_expiration_permis, salaire, statut) 
VALUES (@new_user_id, 'RB-2024-999', DATE_ADD(CURDATE(), INTERVAL 2 YEAR), 4500.00, 'Actif');

SET @chauffeur_danger = (SELECT id FROM chauffeurs LIMIT 1);

-- Accidents pour ce chauffeur
INSERT INTO accidents (bus_id, chauffeur_id, date, description, lieu, gravite, statut) VALUES
(@bus_problematique, @chauffeur_danger, DATE_SUB(NOW(), INTERVAL 5 DAY), 'Choc léger pare-chocs avant', 'Av. des Ires', 'Léger', 'En cours'),
(@bus_problematique, @chauffeur_danger, DATE_SUB(NOW(), INTERVAL 20 DAY), 'Rétroviseur arraché par un camion', 'Rocade Rabat', 'Moyenne', 'Résolu'),
(@bus_problematique, @chauffeur_danger, DATE_SUB(NOW(), INTERVAL 45 DAY), 'Collision mineure au feu rouge', 'Hay Riad', 'Léger', 'Cloturé');


-- ==============================================================================
-- 4. ABSENCES ET PRÉSENCES
-- ==============================================================================

-- On va marquer des absences pour quelques élèves spécifiques pour qu'ils apparaissent dans "Élèves les plus absents".
-- On prend les 5 premiers élèves.
SET @eleve_absent_1 = (SELECT id FROM eleves LIMIT 1);
SET @eleve_absent_2 = (SELECT id FROM eleves LIMIT 1 OFFSET 1);

-- Élève 1 : TRES absent (Absence Matin et Soir sur plusieurs jours)
INSERT INTO presences (eleve_id, bus_id, date, present_matin, present_soir) VALUES
(@eleve_absent_1, @bus_problematique, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 0, 0), -- Absent matin et soir
(@eleve_absent_1, @bus_problematique, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 0, 1), -- Absent matin
(@eleve_absent_1, @bus_problematique, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 0, 0), -- Absent matin et soir
(@eleve_absent_1, @bus_problematique, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 1, 0); -- Absent soir

-- Élève 2 : Moyennement absent
INSERT INTO presences (eleve_id, bus_id, date, present_matin, present_soir) VALUES
(@eleve_absent_2, @bus_clean, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 1, 0),
(@eleve_absent_2, @bus_clean, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 0, 1);

-- Générer des PRÉSENCES pour le reste (pour peupler les graphiques)
-- On prend 10 autres élèves et on les marque présents aujourd'hui
INSERT INTO presences (eleve_id, bus_id, date, present_matin, present_soir)
SELECT id, @bus_clean, CURDATE(), 1, 1
FROM eleves
WHERE id NOT IN (@eleve_absent_1, @eleve_absent_2)
LIMIT 10;
