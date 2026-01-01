-- Migration pour ajouter une colonne mot_de_passe_plain pour stocker les mots de passe en clair
-- ATTENTION: Ce n'est pas une bonne pratique de sécurité, mais nécessaire pour afficher les mots de passe dans l'interface admin

-- Ajouter mot_de_passe_plain à la table utilisateurs
ALTER TABLE utilisateurs 
ADD COLUMN IF NOT EXISTS mot_de_passe_plain VARCHAR(255) NULL COMMENT 'Mot de passe en clair (pour affichage admin uniquement - NON SÉCURISÉ)';

