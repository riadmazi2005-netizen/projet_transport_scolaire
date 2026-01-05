<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$userId = isset($data['user_id']) ? intval($data['user_id']) : null;
$userType = isset($data['user_type']) ? trim($data['user_type']) : null;

if (!$userId || !$userType) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'user_id et user_type sont requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare('DELETE FROM notifications WHERE destinataire_id = ? AND destinataire_type = ?');
    $stmt->execute([$userId, $userType]);
    
    $deletedCount = $stmt->rowCount();
    
    echo json_encode([
        'success' => true,
        'message' => "{$deletedCount} notification(s) supprimée(s)",
        'deleted_count' => $deletedCount
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression: ' . $e->getMessage()]);
}
?>

