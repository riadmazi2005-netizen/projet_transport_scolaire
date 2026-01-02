<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

$eleveId = $_GET['eleve_id'] ?? null;
$startDate = $_GET['start_date'] ?? null;
$endDate = $_GET['end_date'] ?? null;

if (!$eleveId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'eleve_id requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    if ($startDate && $endDate) {
        $stmt = $pdo->prepare('SELECT * FROM presences WHERE eleve_id = ? AND date BETWEEN ? AND ? ORDER BY date DESC');
        $stmt->execute([$eleveId, $startDate, $endDate]);
    } else {
        $stmt = $pdo->prepare('SELECT * FROM presences WHERE eleve_id = ? ORDER BY date DESC');
        $stmt->execute([$eleveId]);
    }
    
    $presences = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Convertir les valeurs boolean
    foreach ($presences as &$presence) {
        $presence['present_matin'] = (bool)$presence['present_matin'];
        $presence['present_soir'] = (bool)$presence['present_soir'];
    }
    
    echo json_encode([
        'success' => true,
        'data' => $presences
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Erreur lors de la récupération des présences: ' . $e->getMessage()
    ]);
}
?>

