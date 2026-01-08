<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

$userId = $_GET['user_id'] ?? null;
$userType = $_GET['user_type'] ?? null;

if (!$userId || !$userType) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'user_id et user_type sont requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare('
        SELECT * FROM notifications 
        WHERE destinataire_id = ? AND destinataire_type = ? 
        ORDER BY date DESC
    ');
    $stmt->execute([$userId, $userType]);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $notifications
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la récupération des notifications']);
}



