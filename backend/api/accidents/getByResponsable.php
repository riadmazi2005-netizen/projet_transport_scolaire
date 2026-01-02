<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

$responsable_id = $_GET['responsable_id'] ?? null;
if (!$responsable_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'responsable_id requis']);
    exit;
}

$pdo = getDBConnection();

// Vérifier si la colonne responsable_id existe
try {
    $checkColumn = $pdo->query("SHOW COLUMNS FROM accidents LIKE 'responsable_id'");
    $columnExists = $checkColumn && $checkColumn->rowCount() > 0;
} catch (PDOException $e) {
    $columnExists = false;
}

if ($columnExists) {
    // Si la colonne existe, utiliser responsable_id directement
    $stmt = $pdo->prepare('
        SELECT 
            a.*,
            b.numero as bus_numero,
            c.nom as chauffeur_nom,
            c.prenom as chauffeur_prenom
        FROM accidents a
        LEFT JOIN bus b ON a.bus_id = b.id
        LEFT JOIN chauffeurs c ON a.chauffeur_id = c.id
        WHERE a.responsable_id = ? OR (a.bus_id IS NOT NULL AND b.responsable_id = ?)
        ORDER BY a.date DESC, a.heure DESC
    ');
    $stmt->execute([$responsable_id, $responsable_id]);
} else {
    // Sinon, chercher via le bus
    $stmt = $pdo->prepare('
        SELECT 
            a.*,
            b.numero as bus_numero,
            c.nom as chauffeur_nom,
            c.prenom as chauffeur_prenom
        FROM accidents a
        LEFT JOIN bus b ON a.bus_id = b.id
        LEFT JOIN chauffeurs c ON a.chauffeur_id = c.id
        WHERE b.responsable_id = ?
        ORDER BY a.date DESC, a.heure DESC
    ');
    $stmt->execute([$responsable_id]);
}
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

