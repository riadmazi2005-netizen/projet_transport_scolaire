<?php
// Script pour générer les hash bcrypt pour les mots de passe des comptes de test
// Exécutez ce fichier avec: php generate_password_hashes.php

$passwords = [
    'admin123' => 'admin',
    'respo123' => 'responsable_bus',
    'chauffeur123' => 'chauffeur'
];

echo "=== Hash bcrypt pour les comptes de test ===\n\n";

foreach ($passwords as $password => $role) {
    $hash = password_hash($password, PASSWORD_DEFAULT);
    echo "-- Hash pour $role ($password):\n";
    echo "\$hash_{$role} = '$hash';\n\n";
}

echo "\n=== SQL à utiliser ===\n\n";
echo "SET @password_admin = '" . password_hash('admin123', PASSWORD_DEFAULT) . "';\n";
echo "SET @password_respo = '" . password_hash('respo123', PASSWORD_DEFAULT) . "';\n";
echo "SET @password_chauffeur = '" . password_hash('chauffeur123', PASSWORD_DEFAULT) . "';\n";
?>

