<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$tuteurId = isset($_GET['tuteur_id']) ? intval($_GET['tuteur_id']) : null;

if (!$tuteurId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'tuteur_id est requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // 1. Récupérer les paiements mensuels via les inscriptions
    $stmt = $pdo->prepare('
        SELECT p.*,
               i.eleve_id,
               i.bus_id,
               i.montant_mensuel,
               e.nom as eleve_nom,
               e.prenom as eleve_prenom,
               e.classe as eleve_classe,
               b.numero as bus_numero
        FROM paiements p
        INNER JOIN inscriptions i ON p.inscription_id = i.id
        INNER JOIN eleves e ON i.eleve_id = e.id
        LEFT JOIN bus b ON i.bus_id = b.id
        WHERE e.tuteur_id = ?
        ORDER BY p.date_paiement DESC, p.date_creation DESC
    ');
    $stmt->execute([$tuteurId]);
    $paiementsTable = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 2. Récupérer les paiements initiaux depuis les demandes payées qui n'existent PAS déjà dans la table paiements
    // Pour éviter les doublons, on exclut les paiements initiaux qui ont déjà été créés dans la table paiements
    // Récupérer les IDs des inscriptions qui ont déjà des paiements dans la table paiements
    $inscriptionsIdsAvecPaiements = [];
    if (!empty($paiementsTable)) {
        foreach ($paiementsTable as $p) {
            if ($p['inscription_id']) {
                $inscriptionsIdsAvecPaiements[] = intval($p['inscription_id']);
            }
        }
    }
    
    $paiementsInitiaux = [];
    if (empty($inscriptionsIdsAvecPaiements)) {
        // Si aucun paiement dans la table, récupérer tous les paiements initiaux depuis les demandes
        $stmt = $pdo->prepare('
            SELECT d.id,
                   d.montant_facture as montant,
                   d.date_traitement as date_paiement,
                   d.date_creation,
                   d.statut,
                   d.code_verification,
                   e.id as eleve_id,
                   e.nom as eleve_nom,
                   e.prenom as eleve_prenom,
                   e.classe as eleve_classe,
                   i.id as inscription_id,
                   i.bus_id,
                   b.numero as bus_numero
            FROM demandes d
            INNER JOIN eleves e ON d.eleve_id = e.id
            LEFT JOIN inscriptions i ON i.eleve_id = e.id AND i.statut = "Active"
            LEFT JOIN bus b ON i.bus_id = b.id
            WHERE d.tuteur_id = ? 
              AND d.type_demande = "inscription"
              AND d.statut = "Payée"
              AND d.montant_facture IS NOT NULL
            ORDER BY d.date_traitement DESC, d.date_creation DESC
        ');
        $stmt->execute([$tuteurId]);
        $paiementsInitiaux = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } else {
        // Exclure les inscriptions qui ont déjà des paiements dans la table paiements
        $placeholders = str_repeat('?,', count($inscriptionsIdsAvecPaiements) - 1) . '?';
        $stmt = $pdo->prepare("
            SELECT d.id,
                   d.montant_facture as montant,
                   d.date_traitement as date_paiement,
                   d.date_creation,
                   d.statut,
                   d.code_verification,
                   e.id as eleve_id,
                   e.nom as eleve_nom,
                   e.prenom as eleve_prenom,
                   e.classe as eleve_classe,
                   i.id as inscription_id,
                   i.bus_id,
                   b.numero as bus_numero
            FROM demandes d
            INNER JOIN eleves e ON d.eleve_id = e.id
            LEFT JOIN inscriptions i ON i.eleve_id = e.id AND i.statut = 'Active'
            LEFT JOIN bus b ON i.bus_id = b.id
            WHERE d.tuteur_id = ? 
              AND d.type_demande = 'inscription'
              AND d.statut = 'Payée'
              AND d.montant_facture IS NOT NULL
              AND (i.id IS NULL OR i.id NOT IN ($placeholders))
            ORDER BY d.date_traitement DESC, d.date_creation DESC
        ");
        $params = array_merge([$tuteurId], $inscriptionsIdsAvecPaiements);
        $stmt->execute($params);
        $paiementsInitiaux = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Formater les paiements initiaux
    $paiementsInitiauxFormates = array_map(function($d) {
        $datePaiementStr = $d['date_paiement'] ?? $d['date_creation'] ?? date('Y-m-d');
        if (strpos($datePaiementStr, ' ') !== false) {
            $datePaiementStr = explode(' ', $datePaiementStr)[0];
        }
        
        $datePaiement = new DateTime($datePaiementStr);
        
        return [
            'id' => 'demande_' . $d['id'],
            'inscription_id' => $d['inscription_id'],
            'montant' => floatval($d['montant']),
            'mois' => intval($datePaiement->format('n')),
            'annee' => intval($datePaiement->format('Y')),
            'date_paiement' => $datePaiementStr,
            'mode_paiement' => 'Espèces',
            'statut' => 'Payé',
            'date_creation' => $d['date_creation'],
            'eleve_id' => $d['eleve_id'],
            'eleve_nom' => $d['eleve_nom'],
            'eleve_prenom' => $d['eleve_prenom'],
            'eleve_classe' => $d['eleve_classe'],
            'bus_id' => $d['bus_id'],
            'bus_numero' => $d['bus_numero'],
            'type_paiement' => 'initial'
        ];
    }, $paiementsInitiaux);
    
    // Formater les paiements de la table paiements
    $paiementsTableFormates = array_map(function($p) {
        // Déterminer le type de paiement : si c'est le premier paiement pour cette inscription, c'est initial, sinon mensuel
        // On utilisera le type_paiement si disponible, sinon on déterminera par logique
        $typePaiement = $p['type_paiement'] ?? 'mensuel';
        
        return [
            'id' => $p['id'],
            'inscription_id' => $p['inscription_id'],
            'montant' => floatval($p['montant']),
            'mois' => intval($p['mois']),
            'annee' => intval($p['annee']),
            'date_paiement' => $p['date_paiement'],
            'mode_paiement' => $p['mode_paiement'] ?? 'Espèces',
            'statut' => $p['statut'],
            'date_creation' => $p['date_creation'],
            'eleve_id' => $p['eleve_id'],
            'eleve_nom' => $p['eleve_nom'],
            'eleve_prenom' => $p['eleve_prenom'],
            'eleve_classe' => $p['eleve_classe'],
            'bus_id' => $p['bus_id'],
            'bus_numero' => $p['bus_numero'],
            'type_paiement' => $typePaiement
        ];
    }, $paiementsTable);
    
    // Combiner et trier
    $tousLesPaiements = array_merge($paiementsTableFormates, $paiementsInitiauxFormates);
    
    // Trier par date de paiement (plus récent en premier)
    usort($tousLesPaiements, function($a, $b) {
        $dateA = strtotime($a['date_paiement'] ?? 0);
        $dateB = strtotime($b['date_paiement'] ?? 0);
        return $dateB - $dateA;
    });
    
    echo json_encode([
        'success' => true,
        'data' => $tousLesPaiements
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la récupération des paiements: ' . $e->getMessage()
    ]);
}



