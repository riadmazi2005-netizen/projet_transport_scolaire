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
               e.classe as eleve_classe,
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
        // Déterminer le rang exact de l'élève dans la famille basé sur la date d'inscription
        $tuteurId = $demandeActuelle['tuteur_id'];
        $eleveIdActuel = $demandeActuelle['eleve_id'];
        $dateCreationDemande = $demandeActuelle['date_creation'];
        
        // Récupérer tous les élèves du tuteur avec leurs dates d'inscription (triés par date)
        // On considère soit la date d'inscription (si inscription active), soit la date de création de la demande (si payée/validée)
        $stmtRang = $pdo->prepare('
            SELECT 
                e.id as eleve_id,
                COALESCE(
                    (SELECT MIN(i.date_inscription) FROM inscriptions i WHERE i.eleve_id = e.id AND i.statut = "Active"),
                    (SELECT MIN(d.date_creation) FROM demandes d 
                     WHERE d.eleve_id = e.id 
                       AND d.type_demande = "inscription" 
                       AND d.statut IN ("Payée", "Validée", "Inscrit", "En attente de paiement")
                       AND d.id != ?)
                ) as date_inscription
            FROM eleves e
            WHERE e.tuteur_id = ?
            HAVING date_inscription IS NOT NULL
            ORDER BY date_inscription ASC
        ');
        $stmtRang->execute([$data['id'], $tuteurId]);
        $elevesInscrits = $stmtRang->fetchAll(PDO::FETCH_ASSOC);
        
        // Compter les élèves déjà inscrits (avec date d'inscription antérieure à la demande actuelle)
        $nombreElevesAvant = 0;
        foreach ($elevesInscrits as $eleveInscrit) {
            if ($eleveInscrit['eleve_id'] != $eleveIdActuel) {
                $dateInscription = $eleveInscrit['date_inscription'];
                if ($dateInscription && $dateInscription < $dateCreationDemande) {
                    $nombreElevesAvant++;
                }
            }
        }
        
        // Le rang de l'élève actuel = nombre d'élèves inscrits avant lui + 1
        $rangEleve = $nombreElevesAvant + 1;
        $nombreElevesTotal = $rangEleve; // Total incluant l'élève actuel
        
        // Appliquer la réduction selon le rang exact de l'élève
        // 1er élève → pas de réduction (0%)
        // 2ème élève → 10% de réduction
        // 3ème élève et plus → 20% de réduction
        $tauxReduction = 0;
        $rangTexte = '';
        if ($rangEleve === 1) {
            $tauxReduction = 0;
            $rangTexte = '1er élève';
        } elseif ($rangEleve === 2) {
            $tauxReduction = 0.10; // 10% de réduction
            $rangTexte = '2ème élève';
        } else {
            $tauxReduction = 0.20; // 20% de réduction
            $rangTexte = $rangEleve . 'ème élève';
        }
        
        $montantFacture = $montantFactureInitial;
        if ($tauxReduction > 0) {
            $montantFacture = $montantFactureInitial * (1 - $tauxReduction);
        }
        
        // Stocker les informations de réduction dans la description
        $descriptionData['montant_avant_reduction'] = $montantFactureInitial;
        $descriptionData['taux_reduction'] = $tauxReduction;
        $descriptionData['montant_reduction'] = $tauxReduction > 0 ? ($montantFactureInitial - $montantFacture) : 0;
        $descriptionData['rang_eleve'] = $rangEleve;
        $descriptionData['rang_eleve_texte'] = $rangTexte;
        $descriptionData['nombre_eleves_total'] = $nombreElevesTotal;
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
                    if (isset($tauxReduction) && $tauxReduction > 0 && isset($descriptionData['rang_eleve'])) {
                        $pourcentageReduction = round($tauxReduction * 100);
                        $rangEleve = $descriptionData['rang_eleve'];
                        $rangTexte = $descriptionData['rang_eleve_texte'] ?? $rangEleve . 'ème élève';
                        
                        if ($rangEleve === 2) {
                            // 2ème élève : 10% de réduction
                            $message .= "🎉 Félicitations ! En tant que {$rangTexte} de la famille, vous bénéficiez d'une réduction de {$pourcentageReduction}% sur cette inscription.\n\n";
                        } elseif ($rangEleve >= 3) {
                            // 3ème, 4ème, 5ème élève : 20% de réduction
                            $message .= "🎉 Félicitations ! En tant que {$rangTexte} de la famille, vous bénéficiez d'une réduction de {$pourcentageReduction}% sur cette inscription.\n\n";
                        }
                    }
                    
                    $message .= "FACTURE:\n" .
                                "- Élève: {$demandeActuelle['eleve_prenom']} {$demandeActuelle['eleve_nom']}\n" .
                                "- Classe: " . ($demandeActuelle['eleve_classe'] ?? 'Non spécifiée') . "\n";
                    
                    // Afficher le montant avant réduction si réduction appliquée
                    if (isset($tauxReduction) && $tauxReduction > 0 && isset($descriptionData['montant_avant_reduction'])) {
                        $message .= "- Montant initial: " . number_format($descriptionData['montant_avant_reduction'], 2) . " DH\n";
                        $message .= "- Réduction familiale (" . round($tauxReduction * 100) . "%): -" . number_format($descriptionData['montant_reduction'] ?? 0, 2) . " DH\n";
                    }
                    
                    $message .= "- Montant total à payer: " . number_format($montantFacture, 2) . " DH\n" .
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

