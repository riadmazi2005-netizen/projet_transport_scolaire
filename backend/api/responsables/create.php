<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

try {
    $pdo = getDBConnection();
    
    // Vérifier si l'email existe déjà
    $stmt = $pdo->prepare('SELECT id FROM utilisateurs WHERE LOWER(email) = LOWER(?)');
    $stmt->execute([$data['email']]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Cet email est déjà utilisé']);
        exit;
    }
    
    // Vérifier si le téléphone existe déjà (si fourni)
    if (isset($data['telephone']) && !empty(trim($data['telephone']))) {
        $stmt = $pdo->prepare('SELECT id FROM utilisateurs WHERE telephone = ?');
        $stmt->execute([trim($data['telephone'])]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Ce numéro de téléphone est déjà utilisé']);
            exit;
        }
    }
    
    // Hasher le mot de passe
    $motDePasse = $data['mot_de_passe'] ?? '';
    if (!empty($motDePasse)) {
        $hashedPassword = password_hash($motDePasse, PASSWORD_DEFAULT);
    } else {
        // Générer un mot de passe par défaut si non fourni
        $hashedPassword = password_hash('password123', PASSWORD_DEFAULT);
    }
    
    $motDePassePlain = !empty($motDePasse) ? $motDePasse : 'password123';
    
    // Créer l'utilisateur
    $stmt = $pdo->prepare('
        INSERT INTO utilisateurs (nom, prenom, email, telephone, mot_de_passe, mot_de_passe_plain, statut)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ');
    $stmt->execute([
        $data['nom'],
        $data['prenom'],
        $data['email'],
        $data['telephone'] ?? null,
        $hashedPassword,
        $motDePassePlain,
        $data['statut'] ?? 'Actif'
    ]);
    
    $utilisateurId = $pdo->lastInsertId();
    
    // Créer le responsable
    $salaire = isset($data['salaire']) ? floatval($data['salaire']) : 0;
    
    $stmt = $pdo->prepare('
        INSERT INTO responsables_bus (utilisateur_id, zone_responsabilite, statut, salaire)
        VALUES (?, ?, ?, ?)
    ');
    $stmt->execute([
        $utilisateurId,
        $data['zone_responsabilite'] ?? null,
        $data['statut'] ?? 'Actif',
        $salaire
    ]);
    
    $responsableId = $pdo->lastInsertId();
    
    // Récupérer le responsable créé avec les infos utilisateur
    $stmt = $pdo->prepare('
        SELECT 
            r.*,
            u.nom,
            u.prenom,
            u.email,
            u.telephone,
            u.mot_de_passe,
            u.mot_de_passe_plain,
            u.statut as user_statut
        FROM responsables_bus r
        LEFT JOIN utilisateurs u ON r.utilisateur_id = u.id
        WHERE r.id = ?
    ');
    $stmt->execute([$responsableId]);
    $responsable = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $responsable
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la création: ' . $e->getMessage()]);
}



