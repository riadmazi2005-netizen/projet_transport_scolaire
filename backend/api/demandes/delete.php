<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

// Récupérer l'ID depuis les paramètres de requête ou le body
$id = null;
if (isset($_GET['id'])) {
    $id = intval($_GET['id']);
} else {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = isset($data['id']) ? intval($data['id']) : null;
}

if (!$id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID de la demande requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Vérifier que la demande existe et n'est pas encore traitée
    $stmt = $pdo->prepare('SELECT * FROM demandes WHERE id = ?');
    $stmt->execute([$id]);
    $demande = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$demande) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Demande non trouvée']);
        exit;
    }
    
    // Vérifier que la demande n'est pas encore traitée (seulement "En attente" peut être supprimée)
    if ($demande['statut'] !== 'En attente') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Cette demande ne peut plus être supprimée car elle est déjà en cours de traitement']);
        exit;
    }
    
    // Supprimer la demande (l'élève associé sera supprimé en cascade si nécessaire)
    $stmt = $pdo->prepare('DELETE FROM demandes WHERE id = ?');
    $stmt->execute([$id]);
    
    // Si c'est une demande d'inscription et que l'élève n'a pas d'inscription active, le supprimer aussi
    if ($demande['type_demande'] === 'inscription' && $demande['eleve_id']) {
        // Vérifier si l'élève a une inscription active
        $stmt = $pdo->prepare('SELECT id FROM inscriptions WHERE eleve_id = ? AND statut = "Active"');
        $stmt->execute([$demande['eleve_id']]);
        $inscription = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Si pas d'inscription active, supprimer l'élève
        if (!$inscription) {
            $stmt = $pdo->prepare('DELETE FROM eleves WHERE id = ?');
            $stmt->execute([$demande['eleve_id']]);
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Demande supprimée avec succès'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression: ' . $e->getMessage()]);
}
?>

