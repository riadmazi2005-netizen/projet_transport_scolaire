<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

$eleveId = $_GET['eleve_id'] ?? null;

if (!$eleveId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'eleve_id requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare('SELECT * FROM inscriptions WHERE eleve_id = ? ORDER BY date_inscription DESC');
    $stmt->execute([$eleveId]);
    $inscriptions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($inscriptions)) {
        echo json_encode([
            'success' => true,
            'data' => []
        ]);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'data' => $inscriptions
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Erreur lors de la récupération des inscriptions: ' . $e->getMessage()
    ]);
}
?>

