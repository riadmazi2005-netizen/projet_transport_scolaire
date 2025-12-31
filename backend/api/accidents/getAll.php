<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

$pdo = getDBConnection();
$stmt = $pdo->query('
    SELECT 
        a.*,
        b.numero as bus_numero,
        c.nom as chauffeur_nom,
        c.prenom as chauffeur_prenom,
        r.id as responsable_id,
        r.zone_responsabilite
    FROM accidents a
    LEFT JOIN bus b ON a.bus_id = b.id
    LEFT JOIN chauffeurs c ON a.chauffeur_id = c.id
    LEFT JOIN responsables_bus r ON b.responsable_id = r.id
    ORDER BY a.date DESC, a.heure DESC
');
$accidents = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    'success' => true,
    'data' => $accidents
]);
?>

