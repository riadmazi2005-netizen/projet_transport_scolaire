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
    echo json_encode(['success' => false, 'message' => 'ID de l\'accident requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Vérifier que l'accident existe
    $stmt = $pdo->prepare('SELECT * FROM accidents WHERE id = ?');
    $stmt->execute([$data['id']]);
    $accident = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$accident) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Accident non trouvé']);
        exit;
    }
    
    // Supprimer l'accident
    $stmt = $pdo->prepare('DELETE FROM accidents WHERE id = ?');
    $stmt->execute([$data['id']]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Accident supprimé avec succès'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}
?>

