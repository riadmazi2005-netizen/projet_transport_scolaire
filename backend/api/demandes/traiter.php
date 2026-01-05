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
    $tauxReduction = 0;
    $nombreElevesInscrits = 0;
    
    if ($nouveauStatut === 'En attente de paiement') {
        // Générer un code unique de 8 caractères (lettres et chiffres)
        $codeVerification = strtoupper(substr(md5(uniqid(rand(), true)), 0, 8));
        
        // Calculer le montant de la facture depuis la description
        $typeTransport = $descriptionData['type_transport'] ?? 'Aller-Retour';
        $abonnement = $descriptionData['abonnement'] ?? 'Mensuel';
        
        $basePrice = ($typeTransport === 'Aller-Retour') ? 400 : 250;
        $montantFactureInitial = ($abonnement === 'Annuel') ? $basePrice * 10 : $basePrice;
        
        // Calculer la réduction familiale
        // Compter le nombre d'élèves déjà inscrits du tuteur (inscriptions actives + demandes payées)
        $tuteurId = $demandeActuelle['tuteur_id'];
        $stmtCount = $pdo->prepare('
            SELECT COUNT(DISTINCT e.id) as nombre_eleves_inscrits
            FROM eleves e
            WHERE e.tuteur_id = ?
              AND (
                  EXISTS (
                      SELECT 1 FROM inscriptions i 
                      WHERE i.eleve_id = e.id AND i.statut = "Active"
                  )
                  OR EXISTS (
                      SELECT 1 FROM demandes d 
                      WHERE d.eleve_id = e.id 
                        AND d.type_demande = "inscription"
                        AND d.statut = "Payée"
                        AND d.id != ?
                  )
              )
        ');
        $stmtCount->execute([$tuteurId, $data['id']]);
        $resultCount = $stmtCount->fetch(PDO::FETCH_ASSOC);
        $nombreElevesInscrits = intval($resultCount['nombre_eleves_inscrits'] ?? 0);
        
        // Appliquer la réduction selon le nombre d'élèves inscrits
        // 0 élève inscrit → 1er élève → pas de réduction (0%)
        // 1 élève inscrit → 2ème élève → 10% de réduction
        // 2+ élèves inscrits → 3ème, 4ème, 5ème élève → 20% de réduction
        $tauxReduction = 0;
        if ($nombreElevesInscrits === 1) {
            // 2ème élève : 10% de réduction
            $tauxReduction = 0.10;
        } elseif ($nombreElevesInscrits >= 2) {
            // 3ème, 4ème, 5ème élève : 20% de réduction
            $tauxReduction = 0.20;
        }
        
        $montantFacture = $montantFactureInitial;
        if ($tauxReduction > 0) {
            $montantFacture = $montantFactureInitial * (1 - $tauxReduction);
        }
        
        // Stocker les informations de réduction dans la description
        $descriptionData['montant_avant_reduction'] = $montantFactureInitial;
        $descriptionData['taux_reduction'] = $tauxReduction;
        $descriptionData['montant_reduction'] = $tauxReduction > 0 ? ($montantFactureInitial - $montantFacture) : 0;
        // Nombre total d'élèves inscrits (y compris l'élève actuel)
        $descriptionData['nombre_eleves_total'] = $nombreElevesInscrits + 1;
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
    
    // Mettre à jour la description si elle contient des informations de réduction
    if (isset($descriptionData['montant_avant_reduction'])) {
        $description = json_encode($descriptionData);
        $updateFields[] = 'description = ?';
        $updateValues[] = $description;
    }
    
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
                'message' => (function() use ($demandeActuelle, $descriptionData, $montantFacture, &$tauxReduction) {
                    $message = "Votre demande d'inscription pour {$demandeActuelle['eleve_prenom']} {$demandeActuelle['eleve_nom']} a été approuvée.\n\n";
                    
                    // Ajouter le message de félicitations pour les réductions
                    if (isset($tauxReduction) && $tauxReduction > 0 && isset($descriptionData['nombre_eleves_total'])) {
                        $pourcentageReduction = round($tauxReduction * 100);
                        $nombreElevesTotal = $descriptionData['nombre_eleves_total'];
                        
                        if ($nombreElevesTotal === 2) {
                            // 2ème élève : 10% de réduction
                            $message .= "🎉 Félicitations ! Vu que vous avez fait deux inscriptions, vous avez bénéficié d'une réduction de {$pourcentageReduction}% sur l'inscription du deuxième élève.\n\n";
                        } elseif ($nombreElevesTotal >= 3) {
                            // 3ème, 4ème, 5ème élève : 20% de réduction
                            $message .= "🎉 Félicitations ! Vu que vous avez fait plus de deux inscriptions, vous avez bénéficié d'une réduction de {$pourcentageReduction}%.\n\n";
                        }
                    }
                    
                    $message .= "FACTURE:\n" .
                                "- Élève: {$demandeActuelle['eleve_prenom']} {$demandeActuelle['eleve_nom']}\n" .
                                "- Classe: " . ($demandeActuelle['eleve_classe'] ?? 'Non spécifiée') . "\n";
                    
                    // Afficher le montant avant réduction si réduction appliquée
                    if (isset($tauxReduction) && $tauxReduction > 0 && isset($descriptionData['montant_avant_reduction'])) {
                        $message .= "- Montant initial: " . number_format($descriptionData['montant_avant_reduction'], 2) . " DH\n";
                        $message .= "- Réduction: -" . number_format($descriptionData['montant_reduction'] ?? 0, 2) . " DH\n";
                    }
                    
                    $message .= "- Montant: " . number_format($montantFacture, 2) . " DH\n" .
                                "- Type de transport: " . ($descriptionData['type_transport'] ?? 'Non spécifié') . "\n\n" .
                                "Veuillez vous rendre à l'école pour effectuer le paiement. Après le paiement, vous devez récupérer votre code de vérification à l'école et le saisir sur le site dans la section 'Mes Enfants'.";
                    
                    return $message;
                })(),
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

