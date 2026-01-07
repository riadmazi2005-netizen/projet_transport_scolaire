-- Script pour supprimer l'élève de test "Qwerty Kourig"
-- Ce script supprime l'élève et toutes les données associées

-- Trouver et supprimer l'élève "Qwerty Kourig" (ou "Kourig Qwerty")
-- Les suppressions en cascade s'occuperont des demandes, inscriptions, paiements, etc.

DELETE FROM eleves 
WHERE (nom LIKE '%Qwerty%' OR nom LIKE '%Kourig%' OR prenom LIKE '%Qwerty%' OR prenom LIKE '%Kourig%')
  AND (nom LIKE '%Kourig%' OR prenom LIKE '%Qwerty%');

-- Vérifier qu'il n'y a plus de données de test
SELECT COUNT(*) as 'Eleves restants avec Qwerty/Kourig' 
FROM eleves 
WHERE nom LIKE '%Qwerty%' OR nom LIKE '%Kourig%' OR prenom LIKE '%Qwerty%' OR prenom LIKE '%Kourig%';
