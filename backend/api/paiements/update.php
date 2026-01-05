<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID du paiement requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Vérifier que le paiement existe
    $stmt = $pdo->prepare('SELECT * FROM paiements WHERE id = ?');
    $stmt->execute([$data['id']]);
    $paiement = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$paiement) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Paiement non trouvé']);
        exit;
    }
    
    // Construire la requête de mise à jour
    $updateFields = [];
    $updateValues = [];
    
    if (isset($data['montant'])) {
        $updateFields[] = 'montant = ?';
        $updateValues[] = $data['montant'];
    }
    
    if (isset($data['mois'])) {
        $updateFields[] = 'mois = ?';
        $updateValues[] = $data['mois'];
    }
    
    if (isset($data['annee'])) {
        $updateFields[] = 'annee = ?';
        $updateValues[] = $data['annee'];
    }
    
    if (isset($data['date_paiement'])) {
        $updateFields[] = 'date_paiement = ?';
        $updateValues[] = $data['date_paiement'];
    }
    
    if (isset($data['mode_paiement'])) {
        $updateFields[] = 'mode_paiement = ?';
        $updateValues[] = $data['mode_paiement'];
    }
    
    if (empty($updateFields)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Aucun champ à mettre à jour']);
        exit;
    }
    
    $updateValues[] = $data['id'];
    
    $stmt = $pdo->prepare('
        UPDATE paiements 
        SET ' . implode(', ', $updateFields) . '
        WHERE id = ?
    ');
    $stmt->execute($updateValues);
    
    // Récupérer le paiement mis à jour
    $stmt = $pdo->prepare('SELECT * FROM paiements WHERE id = ?');
    $stmt->execute([$data['id']]);
    $paiementUpdated = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $paiementUpdated,
        'message' => 'Paiement mis à jour avec succès'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour: ' . $e->getMessage()]);
}
?>

