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

// Décoder les champs JSON pour chaque accident
foreach ($accidents as &$accident) {
    if ($accident['photos']) {
        $accident['photos'] = json_decode($accident['photos'], true);
    }
    if ($accident['eleves_concernees']) {
        $accident['eleves_concernees'] = json_decode($accident['eleves_concernees'], true);
    }
}

echo json_encode([
    'success' => true,
    'data' => $accidents
]);
?>

