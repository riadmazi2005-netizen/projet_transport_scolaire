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
    
    // Parser la description pour extraire les informations
    $descriptionData = json_decode($demande['description'], true);
    if (!is_array($descriptionData)) {
        $descriptionData = [];
    }
    
    // Calculer les dates selon le type d'abonnement
    $dateDebut = date('Y-m-d');
    $abonnement = $descriptionData['abonnement'] ?? 'Mensuel';
    $dateFin = ($abonnement === 'Annuel') ? '2026-06-30' : '2026-02-01';
    
    // Calculer le montant mensuel
    $typeTransport = $descriptionData['type_transport'] ?? 'Aller-Retour';
    $basePrice = ($typeTransport === 'Aller-Retour') ? 400 : 250;
    $montantFacture = ($abonnement === 'Annuel') ? $basePrice * 10 : $basePrice;
    $montantMensuel = ($abonnement === 'Annuel') ? $montantFacture / 10 : $montantFacture;
    
    // Code correct - mettre à jour le statut de la demande en "Payée"
    // L'administrateur devra ensuite affecter le bus et mettre le statut à "Inscrit"
    $stmt = $pdo->prepare('
        UPDATE demandes 
        SET statut = "Payée",
            date_traitement = NOW()
        WHERE id = ?
    ');
    $stmt->execute([$data['demande_id']]);
    
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
            "Le paiement pour l'inscription de {$demande['eleve_prenom']} {$demande['eleve_nom']} a été confirmé. L'administrateur va maintenant affecter votre enfant à un bus.",
            'success'
        ]);
    }
    
    // Envoyer une notification à tous les administrateurs pour qu'ils affectent le bus
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
            "Le paiement pour l'inscription de {$demande['eleve_prenom']} {$demande['eleve_nom']} a été confirmé. Veuillez affecter l'élève à un bus dans la section Inscriptions.",
            'alerte'
        ]);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Code de vérification correct. Le paiement a été confirmé. L\'administrateur va maintenant affecter votre enfant à un bus.',
        'data' => [
            'demande_id' => $demande['id'],
            'eleve_id' => $demande['eleve_id'],
            'statut' => 'Payée'
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la vérification: ' . $e->getMessage()]);
}
?>

