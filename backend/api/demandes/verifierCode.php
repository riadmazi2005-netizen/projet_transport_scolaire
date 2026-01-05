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
    
    // Utiliser le montant de la facture depuis la demande (avec réduction déjà appliquée)
    $montantFacture = floatval($demande['montant_facture'] ?? 0);
    
    // Calculer le montant mensuel pour l'inscription
    $typeTransport = $descriptionData['type_transport'] ?? 'Aller-Retour';
    $basePrice = ($typeTransport === 'Aller-Retour') ? 400 : 250;
    $montantMensuel = ($abonnement === 'Annuel') ? $basePrice : $basePrice;
    
    // Code correct - mettre à jour le statut de la demande en "Payée"
    $stmt = $pdo->prepare('
        UPDATE demandes 
        SET statut = "Payée",
            date_traitement = NOW()
        WHERE id = ?
    ');
    $stmt->execute([$data['demande_id']]);
    
    // Vérifier si une inscription existe déjà pour cet élève
    $stmt = $pdo->prepare('SELECT id FROM inscriptions WHERE eleve_id = ? LIMIT 1');
    $stmt->execute([$demande['eleve_id']]);
    $inscriptionExistante = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $inscriptionId = null;
    if ($inscriptionExistante) {
        // Utiliser l'inscription existante
        $inscriptionId = $inscriptionExistante['id'];
    } else {
        // Créer une inscription (sans bus pour l'instant, l'admin l'assignera plus tard)
        $stmt = $pdo->prepare('
            INSERT INTO inscriptions (eleve_id, bus_id, date_inscription, date_debut, date_fin, statut, montant_mensuel)
            VALUES (?, NULL, ?, ?, ?, "Active", ?)
        ');
        $stmt->execute([
            $demande['eleve_id'],
            $dateDebut,
            $dateDebut,
            $dateFin,
            $montantMensuel
        ]);
        $inscriptionId = $pdo->lastInsertId();
    }
    
    // Vérifier si un paiement initial existe déjà pour cette inscription (pour éviter les doublons)
    $stmt = $pdo->prepare('
        SELECT id FROM paiements 
        WHERE inscription_id = ? 
        AND montant = ? 
        AND mois = ? 
        AND annee = ?
        LIMIT 1
    ');
    $datePaiement = date('Y-m-d');
    $mois = intval(date('n'));
    $annee = intval(date('Y'));
    $stmt->execute([$inscriptionId, $montantFacture, $mois, $annee]);
    $paiementExistant = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$paiementExistant) {
        // Créer le paiement dans la table paiements
        $stmt = $pdo->prepare('
            INSERT INTO paiements (inscription_id, montant, mois, annee, date_paiement, mode_paiement, statut)
            VALUES (?, ?, ?, ?, ?, "Espèces", "Payé")
        ');
        $stmt->execute([
            $inscriptionId,
            $montantFacture,
            $mois,
            $annee,
            $datePaiement
        ]);
    }
    
    // Envoyer une notification au tuteur avec les détails de réduction
    if ($demande['tuteur_utilisateur_id']) {
        // Récupérer les informations de réduction depuis la description
        $montantAvantReduction = $descriptionData['montant_avant_reduction'] ?? null;
        $tauxReduction = $descriptionData['taux_reduction'] ?? 0;
        $montantReduction = $descriptionData['montant_reduction'] ?? 0;
        $nombreElevesTotal = $descriptionData['nombre_eleves_total'] ?? 1;
        
        // Construire le message de notification
        $message = "Le paiement pour l'inscription de {$demande['eleve_prenom']} {$demande['eleve_nom']} a été confirmé.\n\n";
        
        // Ajouter les félicitations et détails de réduction si applicable
        if ($tauxReduction > 0 && $montantAvantReduction) {
            $pourcentageReduction = round($tauxReduction * 100);
            
            if ($nombreElevesTotal === 2) {
                // 2ème élève : 10% de réduction
                $message .= "🎉 Félicitations ! Vu que vous avez fait deux inscriptions, vous avez bénéficié d'une réduction de {$pourcentageReduction}% sur l'inscription du deuxième élève.\n\n";
            } elseif ($nombreElevesTotal >= 3) {
                // 3ème, 4ème, 5ème élève : 20% de réduction
                $message .= "🎉 Félicitations ! Vu que vous avez fait plus de deux inscriptions, vous avez bénéficié d'une réduction de {$pourcentageReduction}%.\n\n";
            }
            
            // Afficher les montants avant et après réduction
            $message .= "Détails du paiement :\n";
            $message .= "- Montant initial : " . number_format($montantAvantReduction, 2) . " DH\n";
            $message .= "- Réduction ({$pourcentageReduction}%) : -" . number_format($montantReduction, 2) . " DH\n";
            $message .= "- Montant payé : " . number_format($montantFacture, 2) . " DH\n\n";
        }
        
        $message .= "L'administrateur va maintenant affecter votre enfant à un bus.";
        
        $stmt = $pdo->prepare('
            INSERT INTO notifications (destinataire_id, destinataire_type, titre, message, type, lue)
            VALUES (?, ?, ?, ?, ?, FALSE)
        ');
        $stmt->execute([
            $demande['tuteur_utilisateur_id'],
            'tuteur',
            'Paiement confirmé',
            $message,
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

