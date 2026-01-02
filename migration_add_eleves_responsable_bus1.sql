-- Migration: Ajouter des élèves de test pour le Responsable Bus1 Respo1
-- Ce script ajoute des élèves au BUS-001 (assigné au responsable_id = 1)

-- 1. Créer des tuteurs supplémentaires si nécessaire
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, statut) VALUES
('Bennani', 'Hassan', 'hassan.bennani@email.ma', 'password123', '0623456789', 'Actif'),
('Idrissi', 'Aicha', 'aicha.idrissi@email.ma', 'password123', '0634567890', 'Actif'),
('Alaoui', 'Mohamed', 'mohamed.alaoui@email.ma', 'password123', '0645678901', 'Actif'),
('Tazi', 'Fatima', 'fatima.tazi@email.ma', 'password123', '0656789012', 'Actif'),
('Berrada', 'Khalid', 'khalid.berrada@email.ma', 'password123', '0667890123', 'Actif')
ON DUPLICATE KEY UPDATE nom=nom;

-- 2. Créer les tuteurs correspondants
INSERT INTO tuteurs (utilisateur_id) 
SELECT id FROM utilisateurs 
WHERE email IN ('hassan.bennani@email.ma', 'aicha.idrissi@email.ma', 'mohamed.alaoui@email.ma', 'fatima.tazi@email.ma', 'khalid.berrada@email.ma')
AND id NOT IN (SELECT utilisateur_id FROM tuteurs);

-- 3. Créer des élèves pour le BUS-001
INSERT INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut) VALUES
-- Élèves de Hassan Bennani
('Bennani', 'Layla', '2013-05-10', '78 Avenue Hassan II, Casablanca', '0623456789', 'hassan.bennani@email.ma', 'CE1', 
 (SELECT id FROM tuteurs WHERE utilisateur_id = (SELECT id FROM utilisateurs WHERE email = 'hassan.bennani@email.ma')), 'Actif'),
('Bennani', 'Omar', '2015-08-20', '78 Avenue Hassan II, Casablanca', '0623456789', 'hassan.bennani@email.ma', 'CP', 
 (SELECT id FROM tuteurs WHERE utilisateur_id = (SELECT id FROM utilisateurs WHERE email = 'hassan.bennani@email.ma')), 'Actif'),

-- Élèves de Aicha Idrissi
('Idrissi', 'Sara', '2012-11-15', '12 Rue Zerktouni, Casablanca', '0634567890', 'aicha.idrissi@email.ma', 'CE2', 
 (SELECT id FROM tuteurs WHERE utilisateur_id = (SELECT id FROM utilisateurs WHERE email = 'aicha.idrissi@email.ma')), 'Actif'),
('Idrissi', 'Youssef', '2014-02-28', '12 Rue Zerktouni, Casablanca', '0634567890', 'aicha.idrissi@email.ma', 'CE1', 
 (SELECT id FROM tuteurs WHERE utilisateur_id = (SELECT id FROM utilisateurs WHERE email = 'aicha.idrissi@email.ma')), 'Actif'),

-- Élèves de Mohamed Alaoui
('Alaoui', 'Nour', '2011-09-05', '45 Boulevard Mohammed V, Casablanca', '0645678901', 'mohamed.alaoui@email.ma', 'CM1', 
 (SELECT id FROM tuteurs WHERE utilisateur_id = (SELECT id FROM utilisateurs WHERE email = 'mohamed.alaoui@email.ma')), 'Actif'),
('Alaoui', 'Amine', '2013-12-18', '45 Boulevard Mohammed V, Casablanca', '0645678901', 'mohamed.alaoui@email.ma', 'CE1', 
 (SELECT id FROM tuteurs WHERE utilisateur_id = (SELECT id FROM utilisateurs WHERE email = 'mohamed.alaoui@email.ma')), 'Actif'),

-- Élèves de Fatima Tazi
('Tazi', 'Ines', '2012-07-22', '89 Rue Allal Ben Abdellah, Casablanca', '0656789012', 'fatima.tazi@email.ma', 'CE2', 
 (SELECT id FROM tuteurs WHERE utilisateur_id = (SELECT id FROM utilisateurs WHERE email = 'fatima.tazi@email.ma')), 'Actif'),
('Tazi', 'Zakaria', '2014-04-14', '89 Rue Allal Ben Abdellah, Casablanca', '0656789012', 'fatima.tazi@email.ma', 'CP', 
 (SELECT id FROM tuteurs WHERE utilisateur_id = (SELECT id FROM utilisateurs WHERE email = 'fatima.tazi@email.ma')), 'Actif'),

-- Élèves de Khalid Berrada
('Berrada', 'Hiba', '2011-10-30', '23 Avenue des FAR, Casablanca', '0667890123', 'khalid.berrada@email.ma', 'CM1', 
 (SELECT id FROM tuteurs WHERE utilisateur_id = (SELECT id FROM utilisateurs WHERE email = 'khalid.berrada@email.ma')), 'Actif'),
('Berrada', 'Mehdi', '2013-03-08', '23 Avenue des FAR, Casablanca', '0667890123', 'khalid.berrada@email.ma', 'CE1', 
 (SELECT id FROM tuteurs WHERE utilisateur_id = (SELECT id FROM utilisateurs WHERE email = 'khalid.berrada@email.ma')), 'Actif');

-- 4. Créer des inscriptions pour ces élèves au BUS-001
INSERT INTO inscriptions (eleve_id, bus_id, date_inscription, date_debut, date_fin, statut, montant_mensuel)
SELECT 
    e.id,
    (SELECT id FROM bus WHERE numero = 'BUS-001' LIMIT 1),
    CURDATE(),
    DATE_ADD(CURDATE(), INTERVAL 7 DAY),
    DATE_ADD(CURDATE(), INTERVAL 6 MONTH),
    'Active',
    400.00
FROM eleves e
WHERE e.nom IN ('Bennani', 'Idrissi', 'Alaoui', 'Tazi', 'Berrada')
AND e.prenom IN ('Layla', 'Omar', 'Sara', 'Youssef', 'Nour', 'Amine', 'Ines', 'Zakaria', 'Hiba', 'Mehdi')
AND e.id NOT IN (SELECT eleve_id FROM inscriptions WHERE statut = 'Active');

-- 5. Créer des demandes d'inscription avec groupe (A ou B) pour certains élèves
INSERT INTO demandes (eleve_id, tuteur_id, type_demande, description, statut, zone_geographique)
SELECT 
    e.id,
    e.tuteur_id,
    'inscription',
    JSON_OBJECT('groupe', CASE WHEN e.id % 2 = 0 THEN 'A' ELSE 'B' END),
    'Validée',
    'Casablanca'
FROM eleves e
WHERE e.nom IN ('Bennani', 'Idrissi', 'Alaoui', 'Tazi', 'Berrada')
AND e.prenom IN ('Layla', 'Omar', 'Sara', 'Youssef', 'Nour', 'Amine', 'Ines', 'Zakaria', 'Hiba', 'Mehdi')
AND e.id NOT IN (SELECT eleve_id FROM demandes WHERE type_demande = 'inscription');

-- 6. Créer quelques présences de test pour aujourd'hui et hier
INSERT INTO presences (eleve_id, date, present_matin, present_soir, bus_id, responsable_id)
SELECT 
    e.id,
    CURDATE(),
    TRUE,
    TRUE,
    (SELECT id FROM bus WHERE numero = 'BUS-001' LIMIT 1),
    (SELECT responsable_id FROM bus WHERE numero = 'BUS-001' LIMIT 1)
FROM eleves e
INNER JOIN inscriptions i ON e.id = i.eleve_id
WHERE i.bus_id = (SELECT id FROM bus WHERE numero = 'BUS-001' LIMIT 1)
AND i.statut = 'Active'
AND NOT EXISTS (
    SELECT 1 FROM presences p 
    WHERE p.eleve_id = e.id 
    AND p.date = CURDATE()
);

-- Présences pour hier
INSERT INTO presences (eleve_id, date, present_matin, present_soir, bus_id, responsable_id)
SELECT 
    e.id,
    DATE_SUB(CURDATE(), INTERVAL 1 DAY),
    CASE WHEN e.id % 3 = 0 THEN FALSE ELSE TRUE END,
    TRUE,
    (SELECT id FROM bus WHERE numero = 'BUS-001' LIMIT 1),
    (SELECT responsable_id FROM bus WHERE numero = 'BUS-001' LIMIT 1)
FROM eleves e
INNER JOIN inscriptions i ON e.id = i.eleve_id
WHERE i.bus_id = (SELECT id FROM bus WHERE numero = 'BUS-001' LIMIT 1)
AND i.statut = 'Active'
AND NOT EXISTS (
    SELECT 1 FROM presences p 
    WHERE p.eleve_id = e.id 
    AND p.date = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
);

