<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id']) || !isset($data['statut'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID et statut requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Récupérer la demande actuelle avec les informations de l'élève et du tuteur
    $stmt = $pdo->prepare('
        SELECT d.*, 
               e.nom as eleve_nom, 
               e.prenom as eleve_prenom,
               t.utilisateur_id as tuteur_utilisateur_id
        FROM demandes d
        LEFT JOIN eleves e ON d.eleve_id = e.id
        LEFT JOIN tuteurs t ON d.tuteur_id = t.id
        WHERE d.id = ?
    ');
    $stmt->execute([$data['id']]);
    $demandeActuelle = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$demandeActuelle) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Demande non trouvée']);
        exit;
    }
    
    $ancienStatut = $demandeActuelle['statut'];
    $nouveauStatut = $data['statut'];
    
    // Parser la description pour extraire les informations
    $descriptionData = json_decode($demandeActuelle['description'], true);
    if (!is_array($descriptionData)) {
        $descriptionData = [];
    }
    
    // Générer un code de vérification unique si la demande est validée (passe en attente de paiement)
    $codeVerification = null;
    $montantFacture = null;
    
    if ($nouveauStatut === 'En attente de paiement') {
        // Générer un code unique de 8 caractères (lettres et chiffres)
        $codeVerification = strtoupper(substr(md5(uniqid(rand(), true)), 0, 8));
        
        // Calculer le montant de la facture depuis la description
        $typeTransport = $descriptionData['type_transport'] ?? 'Aller-Retour';
        $abonnement = $descriptionData['abonnement'] ?? 'Mensuel';
        
        $basePrice = ($typeTransport === 'Aller-Retour') ? 400 : 250;
        $montantFacture = ($abonnement === 'Annuel') ? $basePrice * 10 : $basePrice;
    }
    
    // Récupérer la raison du refus si fournie
    $raisonRefus = isset($data['raison_refus']) ? trim($data['raison_refus']) : null;
    if ($nouveauStatut === 'Refusée' && empty($raisonRefus)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'La raison du refus est obligatoire']);
        exit;
    }
    
    // Mettre à jour la demande
    $updateFields = ['statut = ?', 'date_traitement = NOW()', 'traite_par = ?'];
    $updateValues = [$nouveauStatut, $data['traite_par'] ?? null];
    
    if ($codeVerification) {
        $updateFields[] = 'code_verification = ?';
        $updateValues[] = $codeVerification;
    }
    
    if ($montantFacture) {
        $updateFields[] = 'montant_facture = ?';
        $updateValues[] = $montantFacture;
    }
    
    if ($raisonRefus) {
        $updateFields[] = 'raison_refus = ?';
        $updateValues[] = $raisonRefus;
    }
    
    $updateValues[] = $data['id'];
    
    $stmt = $pdo->prepare('
        UPDATE demandes 
        SET ' . implode(', ', $updateFields) . '
        WHERE id = ?
    ');
    $stmt->execute($updateValues);
    
    // Récupérer la demande mise à jour
    $stmt = $pdo->prepare('SELECT * FROM demandes WHERE id = ?');
    $stmt->execute([$data['id']]);
    $demande = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Ajouter le code de vérification et le montant à la réponse si générés
    if ($codeVerification) {
        $demande['code_verification'] = $codeVerification;
    }
    if ($montantFacture) {
        $demande['montant_facture'] = $montantFacture;
    }
    
    // Envoyer une notification au tuteur avec un message détaillé
    if ($demandeActuelle['tuteur_utilisateur_id']) {
        $messages = [
            'En cours de traitement' => [
                'titre' => 'Demande en cours de traitement',
                'message' => "Votre demande d'inscription pour {$demandeActuelle['eleve_prenom']} {$demandeActuelle['eleve_nom']} est maintenant en cours de traitement par l'administrateur.",
                'type' => 'info'
            ],
            'En attente de paiement' => [
                'titre' => 'Paiement requis',
                'message' => "Votre demande d'inscription pour {$demandeActuelle['eleve_prenom']} {$demandeActuelle['eleve_nom']} a été approuvée.\n\n" .
                            "FACTURE:\n" .
                            "- Élève: {$demandeActuelle['eleve_prenom']} {$demandeActuelle['eleve_nom']}\n" .
                            "- Classe: " . ($demandeActuelle['eleve_classe'] ?? 'Non spécifiée') . "\n" .
                            "- Montant: " . number_format($montantFacture, 2) . " DH\n" .
                            "- Type de transport: " . ($descriptionData['type_transport'] ?? 'Non spécifié') . "\n\n" .
                            "Veuillez vous rendre à l'école pour effectuer le paiement. Après le paiement, vous recevrez un code de vérification à saisir sur le site dans la section 'Mes Enfants'.",
                'type' => 'alerte'
            ],
            'Validée' => [
                'titre' => 'Inscription validée',
                'message' => "Félicitations ! L'inscription de {$demandeActuelle['eleve_prenom']} {$demandeActuelle['eleve_nom']} a été validée. Vous pouvez maintenant suivre le transport de votre enfant.",
                'type' => 'info'
            ],
            'Refusée' => [
                'titre' => 'Demande refusée',
                'message' => "Malheureusement, votre demande d'inscription pour {$demandeActuelle['eleve_prenom']} {$demandeActuelle['eleve_nom']} a été refusée.\n\n" .
                            "Raisons du refus:\n{$raisonRefus}\n\n" .
                            "Vous pouvez nous contacter pour plus d'informations.",
                'type' => 'avertissement'
            ]
        ];
        
        if (isset($messages[$nouveauStatut])) {
            $notification = $messages[$nouveauStatut];
            $stmt = $pdo->prepare('
                INSERT INTO notifications (destinataire_id, destinataire_type, titre, message, type, lue)
                VALUES (?, ?, ?, ?, ?, FALSE)
            ');
            $stmt->execute([
                $demandeActuelle['tuteur_utilisateur_id'],
                'tuteur',
                $notification['titre'],
                $notification['message'],
                $notification['type']
            ]);
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => $demande,
        'message' => 'Demande traitée avec succès'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors du traitement: ' . $e->getMessage()]);
}
?>

