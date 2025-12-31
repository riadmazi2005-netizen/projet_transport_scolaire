<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

$id = $_GET['id'] ?? null;
if (!$id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID requis']);
    exit;
}

$pdo = getDBConnection();
$stmt = $pdo->prepare('
    SELECT 
        a.*,
        b.numero as bus_numero,
        c.nom as chauffeur_nom,
        c.prenom as chauffeur_prenom,
        r.id as responsable_id
    FROM accidents a
    LEFT JOIN bus b ON a.bus_id = b.id
    LEFT JOIN chauffeurs c ON a.chauffeur_id = c.id
    LEFT JOIN responsables_bus r ON b.responsable_id = r.id
    WHERE a.id = ?
');
$stmt->execute([$id]);
$accident = $stmt->fetch(PDO::FETCH_ASSOC);

if ($accident && $accident['photos']) {
    $accident['photos'] = json_decode($accident['photos'], true);
}

echo json_encode([
    'success' => true,
    'data' => $accident ?: null
]);
?>

