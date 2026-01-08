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
    
    // Récupérer tous les élèves du tuteur avec leurs informations d'inscription
    $stmt = $pdo->prepare('
        SELECT 
            e.*,
            i.id as inscription_id,
            i.bus_id,
            i.statut as inscription_statut,
            i.date_debut,
            i.date_fin,
            i.montant_mensuel,
            d.id as demande_id,
            d.statut as demande_statut,
            d.zone_geographique,
            d.description as demande_description
        FROM eleves e
        LEFT JOIN inscriptions i ON e.id = i.eleve_id AND i.statut = "Active"
        LEFT JOIN demandes d ON e.id = d.eleve_id AND d.type_demande = "inscription"
        WHERE e.tuteur_id = ?
        ORDER BY e.nom ASC, e.prenom ASC
    ');
    $stmt->execute([$tuteurId]);
    $eleves = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Enrichir les données avec les informations de la demande
    foreach ($eleves as &$eleve) {
        // Parser la description de la demande si disponible
        if ($eleve['demande_description']) {
            try {
                $desc = json_decode($eleve['demande_description'], true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($desc)) {
                    // Ajouter les champs de la description
                    foreach ($desc as $key => $value) {
                        if (!isset($eleve[$key])) {
                            $eleve[$key] = $value;
                        }
                    }
                }
            } catch (Exception $e) {
                // Ignorer les erreurs de parsing
            }
        }
        
        // Déterminer le statut de la demande
        if ($eleve['demande_statut']) {
            $eleve['statut_demande'] = $eleve['demande_statut'];
        } else {
            $eleve['statut_demande'] = 'Non inscrit';
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => $eleves
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la récupération des élèves: ' . $e->getMessage()
    ]);
}



