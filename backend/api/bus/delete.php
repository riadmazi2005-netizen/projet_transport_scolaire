<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Vérifier que le bus existe
    $stmt = $pdo->prepare('SELECT id FROM bus WHERE id = ?');
    $stmt->execute([$data['id']]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Bus non trouvé']);
        exit;
    }
    
    // Supprimer le bus
    $stmt = $pdo->prepare('DELETE FROM bus WHERE id = ?');
    $stmt->execute([$data['id']]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Bus supprimé'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression: ' . $e->getMessage()]);
}
?>







