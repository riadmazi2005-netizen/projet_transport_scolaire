<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

$eleveId = $_GET['eleve_id'] ?? null;

if (!$eleveId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'eleve_id requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // D'abord, vérifier toutes les inscriptions de l'élève pour débogage
    $stmtDebug = $pdo->prepare('SELECT id, eleve_id, bus_id, statut, date_inscription, date_creation FROM inscriptions WHERE eleve_id = ? ORDER BY date_creation DESC');
    $stmtDebug->execute([$eleveId]);
    $allInscriptions = $stmtDebug->fetchAll(PDO::FETCH_ASSOC);
    
    // Récupérer l'inscription avec toutes les informations du bus, chauffeur, responsable et trajet
    // Les chauffeurs et responsables_bus référencent utilisateurs, donc on doit joindre cette table
    // On cherche TOUTES les inscriptions avec bus_id (pas seulement Active) pour être sûr de trouver le bus
    // Priorité: Active > Suspendue > Terminée, puis par date de création DESC
    $stmt = $pdo->prepare('
        SELECT 
            i.id as inscription_id,
            i.bus_id as inscription_bus_id,
            i.statut as inscription_statut,
            i.date_inscription,
            i.date_creation,
            b.id as bus_id,
            b.numero as bus_numero,
            b.marque as bus_marque,
            b.modele as bus_modele,
            b.capacite as bus_capacite,
            b.immatriculation as bus_immatriculation,
            b.plaque as bus_plaque,
            b.chauffeur_id as bus_chauffeur_id,
            b.responsable_id as bus_responsable_id,
            b.trajet_id as bus_trajet_id,
            c.id as chauffeur_id,
            uc.prenom as chauffeur_prenom,
            uc.nom as chauffeur_nom,
            uc.telephone as chauffeur_telephone,
            uc.email as chauffeur_email,
            r.id as responsable_id,
            ur.prenom as responsable_prenom,
            ur.nom as responsable_nom,
            ur.telephone as responsable_telephone,
            ur.email as responsable_email,
            t.id as trajet_id,
            t.nom as trajet_nom,
            t.heure_depart_matin_a,
            t.heure_arrivee_matin_a,
            t.heure_depart_soir_a,
            t.heure_arrivee_soir_a
        FROM inscriptions i
        LEFT JOIN bus b ON i.bus_id = b.id
        LEFT JOIN chauffeurs c ON b.chauffeur_id = c.id
        LEFT JOIN utilisateurs uc ON c.utilisateur_id = uc.id
        LEFT JOIN responsables_bus r ON b.responsable_id = r.id
        LEFT JOIN utilisateurs ur ON r.utilisateur_id = ur.id
        LEFT JOIN trajets t ON b.trajet_id = t.id
        WHERE i.eleve_id = ? 
          AND i.bus_id IS NOT NULL 
          AND i.bus_id > 0
          AND b.id IS NOT NULL
        ORDER BY 
          CASE 
            WHEN i.statut = "Active" THEN 0 
            WHEN i.statut = "Suspendue" THEN 1 
            ELSE 2 
          END,
          i.date_creation DESC
        LIMIT 1
    ');
    $stmt->execute([$eleveId]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Si aucune inscription trouvée, retourner un message détaillé
    if (!$result || !$result['bus_id'] || !$result['inscription_bus_id']) {
        $debugInfo = [
            'eleve_id' => $eleveId,
            'inscriptions_trouvees' => count($allInscriptions),
            'inscriptions' => $allInscriptions
        ];
        
        echo json_encode([
            'success' => true,
            'data' => null,
            'message' => 'Aucune inscription avec bus assigné trouvée',
            'debug' => $debugInfo
        ]);
        exit;
    }
    
    // Structurer les données
    $transportInfo = [
        'inscription' => [
            'id' => $result['inscription_id'],
            'bus_id' => $result['inscription_bus_id'],
            'statut' => $result['inscription_statut'],
            'date_inscription' => $result['date_inscription']
        ],
        'bus' => [
            'id' => $result['bus_id'],
            'numero' => $result['bus_numero'],
            'marque' => $result['bus_marque'],
            'modele' => $result['bus_modele'],
            'capacite' => $result['bus_capacite'],
            'immatriculation' => $result['bus_immatriculation'],
            'plaque' => $result['bus_plaque'],
            'chauffeur_id' => $result['bus_chauffeur_id'],
            'responsable_id' => $result['bus_responsable_id'],
            'trajet_id' => $result['bus_trajet_id']
        ],
        'chauffeur' => $result['chauffeur_id'] ? [
            'id' => $result['chauffeur_id'],
            'prenom' => $result['chauffeur_prenom'],
            'nom' => $result['chauffeur_nom'],
            'telephone' => $result['chauffeur_telephone'],
            'email' => $result['chauffeur_email']
        ] : null,
        'responsable' => $result['responsable_id'] ? [
            'id' => $result['responsable_id'],
            'prenom' => $result['responsable_prenom'],
            'nom' => $result['responsable_nom'],
            'telephone' => $result['responsable_telephone'],
            'email' => $result['responsable_email']
        ] : null,
        'trajet' => $result['trajet_id'] ? [
            'id' => $result['trajet_id'],
            'nom' => $result['trajet_nom'],
            'heure_depart_matin_a' => $result['heure_depart_matin_a'],
            'heure_arrivee_matin_a' => $result['heure_arrivee_matin_a'],
            'heure_depart_soir_a' => $result['heure_depart_soir_a'],
            'heure_arrivee_soir_a' => $result['heure_arrivee_soir_a']
        ] : null
    ];
    
    echo json_encode([
        'success' => true,
        'data' => $transportInfo
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Erreur lors de la récupération des informations de transport: ' . $e->getMessage()
    ]);
}



