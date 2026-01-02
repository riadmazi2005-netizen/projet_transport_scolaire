-- Script de vérification : Vérifier les élèves du BUS-001
-- Exécutez ce script pour voir si les élèves sont bien assignés au bus

-- 1. Vérifier le bus BUS-001 et son responsable
SELECT 
    b.id as bus_id,
    b.numero,
    b.responsable_id,
    r.id as responsable_table_id,
    u.nom as responsable_nom,
    u.prenom as responsable_prenom
FROM bus b
LEFT JOIN responsables_bus r ON b.responsable_id = r.id
LEFT JOIN utilisateurs u ON r.utilisateur_id = u.id
WHERE b.numero = 'BUS-001';

-- 2. Vérifier les inscriptions actives pour BUS-001
SELECT 
    i.id as inscription_id,
    i.eleve_id,
    i.bus_id,
    i.statut as inscription_statut,
    e.nom,
    e.prenom,
    e.classe
FROM inscriptions i
INNER JOIN eleves e ON i.eleve_id = e.id
WHERE i.bus_id = (SELECT id FROM bus WHERE numero = 'BUS-001' LIMIT 1)
AND i.statut = 'Active'
ORDER BY e.nom, e.prenom;

-- 3. Compter le nombre d'élèves actifs par bus
SELECT 
    b.numero,
    b.responsable_id,
    COUNT(i.id) as nombre_eleves
FROM bus b
LEFT JOIN inscriptions i ON b.id = i.bus_id AND i.statut = 'Active'
GROUP BY b.id, b.numero, b.responsable_id
ORDER BY b.numero;

-- 4. Vérifier tous les élèves avec leurs inscriptions
SELECT 
    e.id,
    e.nom,
    e.prenom,
    e.classe,
    i.bus_id,
    b.numero as bus_numero,
    i.statut as inscription_statut
FROM eleves e
LEFT JOIN inscriptions i ON e.id = i.eleve_id
LEFT JOIN bus b ON i.bus_id = b.id
WHERE e.statut = 'Actif'
ORDER BY b.numero, e.nom, e.prenom;

