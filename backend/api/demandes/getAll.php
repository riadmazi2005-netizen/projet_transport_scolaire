<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

try {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare('
        SELECT d.*, 
               u.nom as tuteur_nom, 
               u.prenom as tuteur_prenom,
               u.email as tuteur_email,
               e.nom as eleve_nom,
               e.prenom as eleve_prenom,
               e.adresse as eleve_adresse,
               e.classe as eleve_classe,
               e.statut as eleve_statut
        FROM demandes d
        LEFT JOIN tuteurs t ON d.tuteur_id = t.id
        LEFT JOIN utilisateurs u ON t.utilisateur_id = u.id
        LEFT JOIN eleves e ON d.eleve_id = e.id
        ORDER BY d.date_creation DESC
    ');
    $stmt->execute();
    $demandes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Parser la description JSON pour extraire les champs supplémentaires
    foreach ($demandes as &$demande) {
        if ($demande['description']) {
            $desc = json_decode($demande['description'], true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($desc)) {
                // Fusionner les champs de description dans la demande
                foreach ($desc as $key => $value) {
                    if (!isset($demande[$key])) {
                        $demande[$key] = $value;
                    }
                }
            }
        }
        // Créer demandeur_nom et demandeur_type pour compatibilité
        if (!isset($demande['demandeur_nom']) && $demande['tuteur_nom']) {
            $demande['demandeur_nom'] = $demande['tuteur_prenom'] . ' ' . $demande['tuteur_nom'];
            $demande['demandeur_type'] = 'tuteur';
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => $demandes
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la récupération des demandes: ' . $e->getMessage()]);
}
?>

