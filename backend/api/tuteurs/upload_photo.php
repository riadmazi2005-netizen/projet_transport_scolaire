<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

// Vérifier si un fichier a été uploadé
if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Aucun fichier uploadé ou erreur d\'upload']);
    exit;
}

// Récupérer l'ID du tuteur
if (!isset($_POST['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID du tuteur requis']);
    exit;
}

$tuteurId = $_POST['id'];
$file = $_FILES['photo'];

// Validation du fichier
$allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
$maxSize = 5 * 1024 * 1024; // 5MB

if (!in_array($file['type'], $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Type de fichier non autorisé. Seuls JPG et PNG sont acceptés.']);
    exit;
}

if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Fichier trop volumineux. Max 5MB.']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Vérifier que le tuteur existe
    $stmt = $pdo->prepare('SELECT id FROM tuteurs WHERE id = ?');
    $stmt->execute([$tuteurId]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Tuteur non trouvé']);
        exit;
    }
    
    // Créer le dossier d'upload s'il n'existe pas
    $uploadDir = '../../uploads/tuteurs/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    
    // Générer un nom unique pour le fichier
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'tuteur_' . $tuteurId . '_' . uniqid() . '.' . $extension;
    $targetPath = $uploadDir . $filename;
    
    // Déplacer le fichier
    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        // Chemin relatif pour la base de données (accessible via URL)
        $dbPath = '/backend/uploads/tuteurs/' . $filename;
        
        // Mettre à jour la base de données
        $stmt = $pdo->prepare('UPDATE tuteurs SET photo_identite = ? WHERE id = ?');
        $stmt->execute([$dbPath, $tuteurId]);
        
        echo json_encode([
            'success' => true, 
            'message' => 'Photo uploadée avec succès',
            'data' => [
                'photo_path' => $dbPath
            ]
        ]);
    } else {
        throw new Exception('Erreur lors de l\'enregistrement du fichier');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}


