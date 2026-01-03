<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

$id = $_GET['id'] ?? null;
if (!$id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID requis']);
    exit;
}

$pdo = getDBConnection();
$stmt = $pdo->prepare('
    SELECT 
        b.*,
        c.id as chauffeur_id_full,
        c.numero_permis,
        uc.nom as chauffeur_nom,
        uc.prenom as chauffeur_prenom,
        uc.telephone as chauffeur_telephone,
        r.id as responsable_id_full,
        r.zone_responsabilite,
        ur.nom as responsable_nom,
        ur.prenom as responsable_prenom,
        ur.telephone as responsable_telephone
    FROM bus b
    LEFT JOIN chauffeurs c ON b.chauffeur_id = c.id
    LEFT JOIN utilisateurs uc ON c.utilisateur_id = uc.id
    LEFT JOIN responsables_bus r ON b.responsable_id = r.id
    LEFT JOIN utilisateurs ur ON r.utilisateur_id = ur.id
    WHERE b.id = ?
');
$stmt->execute([$id]);
$bus = $stmt->fetch(PDO::FETCH_ASSOC);

if ($bus) {
    // Organiser les données de manière plus structurée
    $result = [
        'id' => $bus['id'],
        'numero' => $bus['numero'],
        'immatriculation' => $bus['immatriculation'],
        'marque' => $bus['marque'],
        'modele' => $bus['modele'],
        'annee_fabrication' => $bus['annee_fabrication'],
        'capacite' => $bus['capacite'],
        'statut' => $bus['statut'],
        'chauffeur_id' => $bus['chauffeur_id'],
        'responsable_id' => $bus['responsable_id'],
        'trajet_id' => $bus['trajet_id'],
        'date_creation' => $bus['date_creation'],
        'date_modification' => $bus['date_modification']
    ];
    
    // Ajouter les informations du chauffeur si disponible
    if ($bus['chauffeur_id']) {
        $result['chauffeur'] = [
            'id' => $bus['chauffeur_id_full'],
            'numero_permis' => $bus['numero_permis'],
            'nom' => $bus['chauffeur_nom'],
            'prenom' => $bus['chauffeur_prenom'],
            'telephone' => $bus['chauffeur_telephone']
        ];
    }
    
    // Ajouter les informations du responsable si disponible
    if ($bus['responsable_id']) {
        $result['responsable'] = [
            'id' => $bus['responsable_id_full'],
            'zone_responsabilite' => $bus['zone_responsabilite'],
            'nom' => $bus['responsable_nom'],
            'prenom' => $bus['responsable_prenom'],
            'telephone' => $bus['responsable_telephone']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'data' => $result
    ]);
} else {
    echo json_encode([
        'success' => true,
        'data' => null
    ]);
}
?>







