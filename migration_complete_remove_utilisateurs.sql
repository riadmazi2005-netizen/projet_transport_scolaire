-- ============================================
-- MIGRATION COMPLÈTE : SUPPRESSION DE LA TABLE UTILISATEURS
-- ============================================
-- Ce fichier migre toutes les données de la table utilisateurs
-- vers les tables spécifiques (administrateurs, tuteurs, chauffeurs, responsables_bus)
-- et supprime la table utilisateurs
-- 
-- ATTENTION: FAITES UNE SAUVEGARDE COMPLÈTE AVANT D'EXÉCUTER CE SCRIPT
-- 
-- INSTRUCTIONS:
-- 1. Sauvegardez votre base de données
-- 2. Exécutez ce script dans phpMyAdmin ou MySQL CLI
-- 3. Si vous voyez des erreurs "Duplicate column name", c'est normal - ignorez-les
-- 4. Si vous voyez des erreurs "Unknown column", vérifiez que les colonnes existent
-- 5. Après la migration, mettez à jour tous les fichiers PHP backend
-- ============================================

USE transport_scolaire;

-- ============================================
-- ÉTAPE 1: AJOUTER LES COLONNES NÉCESSAIRES
-- ============================================
-- Si une colonne existe déjà, vous verrez une erreur "Duplicate column name"
-- C'est normal, continuez avec l'étape suivante

-- Ajouter les colonnes dans administrateurs
ALTER TABLE administrateurs 
ADD COLUMN nom VARCHAR(100),
ADD COLUMN prenom VARCHAR(100),
ADD COLUMN email VARCHAR(150),
ADD COLUMN telephone VARCHAR(20),
ADD COLUMN mot_de_passe VARCHAR(255),
ADD COLUMN statut ENUM('Actif', 'Inactif') DEFAULT 'Actif',
ADD COLUMN date_creation_new TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Ajouter les colonnes dans tuteurs
ALTER TABLE tuteurs 
ADD COLUMN nom VARCHAR(100),
ADD COLUMN prenom VARCHAR(100),
ADD COLUMN email VARCHAR(150),
ADD COLUMN telephone VARCHAR(20),
ADD COLUMN mot_de_passe VARCHAR(255),
ADD COLUMN statut ENUM('Actif', 'Inactif') DEFAULT 'Actif',
ADD COLUMN date_creation_new TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Ajouter les colonnes dans chauffeurs
ALTER TABLE chauffeurs 
ADD COLUMN nom VARCHAR(100),
ADD COLUMN prenom VARCHAR(100),
ADD COLUMN email VARCHAR(150),
ADD COLUMN telephone VARCHAR(20),
ADD COLUMN mot_de_passe VARCHAR(255),
ADD COLUMN statut_new ENUM('Actif', 'Inactif', 'Licencié', 'Suspendu') DEFAULT 'Actif',
ADD COLUMN date_creation_new TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN salaire DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN date_embauche DATE;

-- Supprimer la contrainte UNIQUE sur numero_permis (peut échouer si l'index n'existe pas - c'est OK)
ALTER TABLE chauffeurs DROP INDEX numero_permis;

-- Modifier numero_permis pour permettre NULL
ALTER TABLE chauffeurs MODIFY COLUMN numero_permis VARCHAR(255) NULL;

-- Ajouter les colonnes dans responsables_bus
ALTER TABLE responsables_bus 
ADD COLUMN nom VARCHAR(100),
ADD COLUMN prenom VARCHAR(100),
ADD COLUMN email VARCHAR(150),
ADD COLUMN telephone VARCHAR(20),
ADD COLUMN mot_de_passe VARCHAR(255),
ADD COLUMN statut_new ENUM('Actif', 'Inactif') DEFAULT 'Actif',
ADD COLUMN date_creation_new TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN salaire DECIMAL(10, 2) DEFAULT 0;

-- Ajouter les champs dans accidents (peut échouer si les colonnes existent déjà - c'est OK)
ALTER TABLE accidents 
ADD COLUMN nombre_eleves INT DEFAULT NULL,
ADD COLUMN nombre_blesses INT DEFAULT NULL,
ADD COLUMN photos TEXT DEFAULT NULL;

-- ============================================
-- ÉTAPE 2: MIGRER LES DONNÉES
-- ============================================

-- Migrer les données vers administrateurs
UPDATE administrateurs a
INNER JOIN utilisateurs u ON a.utilisateur_id = u.id
SET 
    a.nom = u.nom,
    a.prenom = u.prenom,
    a.email = u.email,
    a.telephone = u.telephone,
    a.mot_de_passe = u.mot_de_passe,
    a.statut = u.statut,
    a.date_creation_new = u.date_creation,
    a.date_modification = u.date_modification;

-- Migrer les données vers tuteurs
UPDATE tuteurs t
INNER JOIN utilisateurs u ON t.utilisateur_id = u.id
SET 
    t.nom = u.nom,
    t.prenom = u.prenom,
    t.email = u.email,
    t.telephone = u.telephone,
    t.mot_de_passe = u.mot_de_passe,
    t.statut = u.statut,
    t.date_creation_new = u.date_creation;

-- Migrer les données vers chauffeurs
UPDATE chauffeurs c
INNER JOIN utilisateurs u ON c.utilisateur_id = u.id
SET 
    c.nom = u.nom,
    c.prenom = u.prenom,
    c.email = u.email,
    c.telephone = u.telephone,
    c.mot_de_passe = u.mot_de_passe,
    c.statut_new = CASE 
        WHEN c.statut = 'Actif' THEN 'Actif'
        WHEN c.statut = 'Licencié' THEN 'Licencié'
        WHEN c.statut = 'Suspendu' THEN 'Suspendu'
        ELSE 'Actif'
    END,
    c.date_creation_new = u.date_creation;

-- Migrer les données vers responsables_bus
UPDATE responsables_bus r
INNER JOIN utilisateurs u ON r.utilisateur_id = u.id
SET 
    r.nom = u.nom,
    r.prenom = u.prenom,
    r.email = u.email,
    r.telephone = u.telephone,
    r.mot_de_passe = u.mot_de_passe,
    r.statut_new = u.statut,
    r.date_creation_new = u.date_creation;

-- ============================================
-- ÉTAPE 3: RENOMMER LES COLONNES TEMPORAIRES
-- ============================================

-- Pour administrateurs
ALTER TABLE administrateurs DROP COLUMN date_creation;
ALTER TABLE administrateurs CHANGE COLUMN date_creation_new date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Pour tuteurs
ALTER TABLE tuteurs DROP COLUMN date_creation;
ALTER TABLE tuteurs CHANGE COLUMN date_creation_new date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Pour chauffeurs
ALTER TABLE chauffeurs DROP COLUMN date_creation;
ALTER TABLE chauffeurs CHANGE COLUMN date_creation_new date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE chauffeurs DROP COLUMN statut;
ALTER TABLE chauffeurs CHANGE COLUMN statut_new statut ENUM('Actif', 'Inactif', 'Licencié', 'Suspendu') DEFAULT 'Actif';

-- Pour responsables_bus
ALTER TABLE responsables_bus DROP COLUMN date_creation;
ALTER TABLE responsables_bus CHANGE COLUMN date_creation_new date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE responsables_bus DROP COLUMN statut;
ALTER TABLE responsables_bus CHANGE COLUMN statut_new statut ENUM('Actif', 'Inactif') DEFAULT 'Actif';

-- ============================================
-- ÉTAPE 4: SUPPRIMER LES CONTRAINTES ET COLONNES UTILISATEUR_ID
-- ============================================

-- Désactiver les vérifications de clés étrangères
SET FOREIGN_KEY_CHECKS = 0;

-- Supprimer les contraintes (peut échouer si elles n'existent pas - c'est OK)
ALTER TABLE administrateurs DROP FOREIGN KEY administrateurs_ibfk_1;
ALTER TABLE tuteurs DROP FOREIGN KEY tuteurs_ibfk_1;
ALTER TABLE chauffeurs DROP FOREIGN KEY chauffeurs_ibfk_1;
ALTER TABLE responsables_bus DROP FOREIGN KEY responsables_bus_ibfk_1;

-- Réactiver les vérifications
SET FOREIGN_KEY_CHECKS = 1;

-- Supprimer les index (peut échouer - c'est OK)
DROP INDEX utilisateur_id ON administrateurs;
DROP INDEX utilisateur_id ON tuteurs;
DROP INDEX utilisateur_id ON chauffeurs;
DROP INDEX utilisateur_id ON responsables_bus;

-- Supprimer la colonne utilisateur_id
ALTER TABLE administrateurs DROP COLUMN utilisateur_id;
ALTER TABLE tuteurs DROP COLUMN utilisateur_id;
ALTER TABLE chauffeurs DROP COLUMN utilisateur_id;
ALTER TABLE responsables_bus DROP COLUMN utilisateur_id;

-- ============================================
-- ÉTAPE 5: RENDRE LES COLONNES OBLIGATOIRES ET AJOUTER CONTRAINTES
-- ============================================

-- Administrateurs
ALTER TABLE administrateurs 
MODIFY COLUMN nom VARCHAR(100) NOT NULL,
MODIFY COLUMN prenom VARCHAR(100) NOT NULL,
MODIFY COLUMN email VARCHAR(150) NOT NULL,
MODIFY COLUMN mot_de_passe VARCHAR(255) NOT NULL,
ADD UNIQUE KEY unique_email (email);

-- Tuteurs
ALTER TABLE tuteurs 
MODIFY COLUMN nom VARCHAR(100) NOT NULL,
MODIFY COLUMN prenom VARCHAR(100) NOT NULL,
MODIFY COLUMN email VARCHAR(150) NOT NULL,
MODIFY COLUMN mot_de_passe VARCHAR(255) NOT NULL,
ADD UNIQUE KEY unique_email (email);

-- Chauffeurs
ALTER TABLE chauffeurs 
MODIFY COLUMN nom VARCHAR(100) NOT NULL,
MODIFY COLUMN prenom VARCHAR(100) NOT NULL,
MODIFY COLUMN email VARCHAR(150) NOT NULL,
MODIFY COLUMN mot_de_passe VARCHAR(255) NOT NULL,
ADD UNIQUE KEY unique_email (email);

-- Responsables bus
ALTER TABLE responsables_bus 
MODIFY COLUMN nom VARCHAR(100) NOT NULL,
MODIFY COLUMN prenom VARCHAR(100) NOT NULL,
MODIFY COLUMN email VARCHAR(150) NOT NULL,
MODIFY COLUMN mot_de_passe VARCHAR(255) NOT NULL,
ADD UNIQUE KEY unique_email (email);

-- ============================================
-- ÉTAPE 6: SUPPRIMER LA TABLE UTILISATEURS
-- ============================================

DROP TABLE IF EXISTS utilisateurs;

-- ============================================
-- MIGRATION TERMINÉE
-- ============================================
-- La migration est terminée. Toutes les données ont été migrées.
-- 
-- IMPORTANT: Vous devez maintenant mettre à jour TOUS les fichiers PHP backend
-- pour qu'ils n'utilisent plus la table utilisateurs.
-- 
-- Les fichiers principaux à modifier:
-- - backend/api/auth/login.php
-- - backend/api/chauffeurs/*.php
-- - backend/api/responsables/*.php
-- - backend/api/tuteurs/*.php
-- - Tous les autres fichiers qui référencent "utilisateurs" ou "utilisateur_id"
-- ============================================
