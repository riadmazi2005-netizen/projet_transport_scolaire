<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

$chauffeur_id = $_GET['chauffeur_id'] ?? null;
if (!$chauffeur_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'chauffeur_id requis']);
    exit;
}

$pdo = getDBConnection();
$stmt = $pdo->prepare('
    SELECT 
        a.*,
        b.numero as bus_numero
    FROM accidents a
    LEFT JOIN bus b ON a.bus_id = b.id
    WHERE a.chauffeur_id = ?
    ORDER BY a.date DESC, a.heure DESC
');
$stmt->execute([$chauffeur_id]);
$accidents = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Décoder les photos pour chaque accident
foreach ($accidents as &$accident) {
    if ($accident['photos']) {
        $accident['photos'] = json_decode($accident['photos'], true);
    }
}

echo json_encode([
    'success' => true,
    'data' => $accidents
]);
?>

