<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$id = isset($_GET['id']) ? intval($_GET['id']) : null;

if (!$id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Vérifier si la zone existe
    $stmt = $pdo->prepare('SELECT id FROM zones WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Zone non trouvée']);
        exit;
    }
    
    // Supprimer la zone
    $stmt = $pdo->prepare('DELETE FROM zones WHERE id = ?');
    $stmt->execute([$id]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Zone supprimée avec succès'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression: ' . $e->getMessage()]);
}



