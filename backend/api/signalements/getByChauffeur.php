<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

$chauffeur_id = $_GET['chauffeur_id'] ?? null;

if (!$chauffeur_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'chauffeur_id requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare('
        SELECT * FROM signalements_maintenance 
        WHERE chauffeur_id = ? 
        ORDER BY date_creation DESC
    ');
    $stmt->execute([$chauffeur_id]);
    $signalements = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $signalements
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}
?>

