<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

$date = $_GET['date'] ?? null;
if (!$date) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'date requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Filtrer par bus_id ou responsable_id si fournis
    $bus_id = $_GET['bus_id'] ?? null;
    $responsable_id = $_GET['responsable_id'] ?? null;
    
    if ($bus_id) {
        $stmt = $pdo->prepare('SELECT * FROM presences WHERE date = ? AND bus_id = ?');
        $stmt->execute([$date, $bus_id]);
    } elseif ($responsable_id) {
        $stmt = $pdo->prepare('SELECT * FROM presences WHERE date = ? AND responsable_id = ?');
        $stmt->execute([$date, $responsable_id]);
    } else {
        $stmt = $pdo->prepare('SELECT * FROM presences WHERE date = ?');
        $stmt->execute([$date]);
    }
    
    $presences = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Convertir les valeurs boolean, en préservant NULL
    foreach ($presences as &$presence) {
        $presence['present_matin'] = is_null($presence['present_matin']) ? null : (bool)$presence['present_matin'];
        $presence['present_soir'] = is_null($presence['present_soir']) ? null : (bool)$presence['present_soir'];
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



