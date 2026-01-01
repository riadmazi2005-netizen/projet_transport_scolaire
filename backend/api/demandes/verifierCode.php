<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['demande_id']) || !isset($data['code_verification'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID de la demande et code de vérification requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Récupérer la demande avec le code de vérification
    $stmt = $pdo->prepare('
        SELECT d.*, 
               e.id as eleve_id,
               e.nom as eleve_nom,
               e.prenom as eleve_prenom,
               t.utilisateur_id as tuteur_utilisateur_id
        FROM demandes d
        LEFT JOIN eleves e ON d.eleve_id = e.id
        LEFT JOIN tuteurs t ON d.tuteur_id = t.id
        WHERE d.id = ?
    ');
    $stmt->execute([$data['demande_id']]);
    $demande = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$demande) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Demande non trouvée']);
        exit;
    }
    
    // Vérifier que la demande est en attente de paiement
    if ($demande['statut'] !== 'En attente de paiement') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Cette demande n\'est pas en attente de paiement']);
        exit;
    }
    
    // Vérifier le code
    if (empty($demande['code_verification'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Aucun code de vérification n\'a été généré pour cette demande']);
        exit;
    }
    
    if (strtoupper(trim($data['code_verification'])) !== strtoupper(trim($demande['code_verification']))) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Code de vérification incorrect']);
        exit;
    }
    
    // Code correct - mettre à jour le statut de la demande en "Inscrit" et de l'élève en "Actif"
    $stmt = $pdo->prepare('
        UPDATE demandes 
        SET statut = "Inscrit",
            date_traitement = NOW()
        WHERE id = ?
    ');
    $stmt->execute([$data['demande_id']]);
    
    // Activer l'élève (mettre le statut à "Actif")
    if ($demande['eleve_id']) {
        $stmt = $pdo->prepare('UPDATE eleves SET statut = "Actif" WHERE id = ?');
        $stmt->execute([$demande['eleve_id']]);
        
        // Vérifier que la mise à jour a bien été effectuée
        if ($stmt->rowCount() === 0) {
            // L'élève n'existe pas, créer un log d'erreur mais continuer quand même
            error_log("Erreur: L'élève avec l'ID {$demande['eleve_id']} n'existe pas dans la table eleves");
        }
    }
    
    // Envoyer une notification au tuteur
    if ($demande['tuteur_utilisateur_id']) {
        $stmt = $pdo->prepare('
            INSERT INTO notifications (destinataire_id, destinataire_type, titre, message, type, lue)
            VALUES (?, ?, ?, ?, ?, FALSE)
        ');
        $stmt->execute([
            $demande['tuteur_utilisateur_id'],
            'tuteur',
            'Paiement confirmé',
            "Le paiement pour {$demande['eleve_prenom']} {$demande['eleve_nom']} a été confirmé. L'administrateur va maintenant affecter votre enfant à un bus.",
            'info'
        ]);
    }
    
    // Envoyer une notification à tous les administrateurs
    $stmt = $pdo->prepare('
        SELECT a.utilisateur_id 
        FROM administrateurs a
    ');
    $stmt->execute();
    $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($admins as $admin) {
        $stmt = $pdo->prepare('
            INSERT INTO notifications (destinataire_id, destinataire_type, titre, message, type, lue)
            VALUES (?, ?, ?, ?, ?, FALSE)
        ');
        $stmt->execute([
            $admin['utilisateur_id'],
            'admin',
            'Paiement confirmé - Affectation bus requise',
            "Le paiement pour {$demande['eleve_prenom']} {$demande['eleve_nom']} a été confirmé. Veuillez affecter l'élève à un bus.",
            'alerte'
        ]);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Code de vérification correct. Le paiement a été confirmé.',
        'data' => [
            'demande_id' => $demande['id'],
            'eleve_id' => $demande['eleve_id'],
            'statut' => 'Inscrit'
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la vérification: ' . $e->getMessage()]);
}
?>

