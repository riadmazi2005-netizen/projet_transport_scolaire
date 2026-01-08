<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

// Récupérer le tuteur_id depuis les paramètres de requête
$tuteurId = isset($_GET['tuteur_id']) ? intval($_GET['tuteur_id']) : null;

if (!$tuteurId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'tuteur_id est requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Récupérer toutes les demandes du tuteur avec les informations de l'élève
    // Utiliser une sous-requête pour obtenir uniquement l'inscription la plus récente par élève
    $stmt = $pdo->prepare('
        SELECT 
            d.*,
            e.nom as eleve_nom,
            e.prenom as eleve_prenom,
            e.date_naissance as eleve_date_naissance,
            e.classe as eleve_classe,
            e.statut as eleve_statut,
            i.id as inscription_id,
            i.bus_id,
            i.statut as inscription_statut,
            i.montant_mensuel,
            b.numero as bus_numero,
            b.marque as bus_marque,
            b.modele as bus_modele,
            a.nom as admin_nom,
            a.prenom as admin_prenom,
            t.utilisateur_id as tuteur_utilisateur_id
        FROM demandes d
        LEFT JOIN eleves e ON d.eleve_id = e.id
        LEFT JOIN (
            SELECT i1.*
            FROM inscriptions i1
            INNER JOIN (
                SELECT eleve_id, MAX(date_creation) as max_date
                FROM inscriptions
                WHERE statut = "Active"
                GROUP BY eleve_id
            ) i2 ON i1.eleve_id = i2.eleve_id 
                AND i1.date_creation = i2.max_date 
                AND i1.statut = "Active"
        ) i ON i.eleve_id = e.id
        LEFT JOIN bus b ON i.bus_id = b.id
        LEFT JOIN administrateurs adm ON d.traite_par = adm.id
        LEFT JOIN utilisateurs a ON adm.utilisateur_id = a.id
        LEFT JOIN tuteurs t ON d.tuteur_id = t.id
        WHERE d.tuteur_id = ?
        GROUP BY d.id
        ORDER BY d.date_creation DESC
    ');
    $stmt->execute([$tuteurId]);
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
    }
    
    echo json_encode([
        'success' => true,
        'data' => $demandes
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la récupération des demandes: ' . $e->getMessage()]);
}



