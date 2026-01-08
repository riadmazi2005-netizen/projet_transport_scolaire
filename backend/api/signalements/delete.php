<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$id = $_GET['id'] ?? null;

if (!$id) {
    // Essayer de récupérer depuis le body pour POST
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;
}

if (!$id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare('DELETE FROM signalements_maintenance WHERE id = ?');
    $stmt->execute([$id]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Signalement supprimé avec succès'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}



