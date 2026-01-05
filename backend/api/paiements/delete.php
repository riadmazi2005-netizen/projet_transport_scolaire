<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$id = isset($_GET['id']) ? $_GET['id'] : null;

if (!$id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID du paiement requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Vérifier que le paiement existe
    $stmt = $pdo->prepare('SELECT * FROM paiements WHERE id = ?');
    $stmt->execute([$id]);
    $paiement = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$paiement) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Paiement non trouvé']);
        exit;
    }
    
    // Supprimer le paiement
    $stmt = $pdo->prepare('DELETE FROM paiements WHERE id = ?');
    $stmt->execute([$id]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Paiement supprimé avec succès'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression: ' . $e->getMessage()]);
}
?>

