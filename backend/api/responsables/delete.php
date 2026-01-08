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
    
    // Récupérer l'utilisateur_id avant la suppression
    $stmt = $pdo->prepare('SELECT utilisateur_id FROM responsables_bus WHERE id = ?');
    $stmt->execute([$data['id']]);
    $responsable = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$responsable) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Responsable non trouvé']);
        exit;
    }
    
    // Supprimer le responsable (cela supprimera aussi l'utilisateur grâce à ON DELETE CASCADE)
    $stmt = $pdo->prepare('DELETE FROM responsables_bus WHERE id = ?');
    $stmt->execute([$data['id']]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Responsable supprimé'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression: ' . $e->getMessage()]);
}



