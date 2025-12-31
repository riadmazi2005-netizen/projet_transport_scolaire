// Fonction commune pour calculer le montant de la facture
// Basée sur le type de transport et l'abonnement
export const calculerMontantFacture = (typeTransport, abonnement) => {
  const basePrice = typeTransport === 'Aller-Retour' ? 400 : 250;
  return abonnement === 'Annuel' ? basePrice * 10 : basePrice;
};

// Fonction pour formater le montant avec unité
export const formaterMontantFacture = (typeTransport, abonnement) => {
  const montant = calculerMontantFacture(typeTransport, abonnement);
  if (abonnement === 'Mensuel') {
    return `${montant} DH/mois`;
  } else {
    return `${montant} DH/an`;
  }
};

// Fonction pour extraire les infos de transport depuis une description
export const extraireInfosTransport = (description) => {
  try {
    const desc = typeof description === 'string' ? JSON.parse(description) : description;
    return {
      type_transport: desc?.type_transport || 'Aller-Retour',
      abonnement: desc?.abonnement || 'Mensuel',
      groupe: desc?.groupe || null,
      zone: desc?.zone || null,
      niveau: desc?.niveau || null,
      lien_parente: desc?.lien_parente || null,
      sexe: desc?.sexe || null
    };
  } catch (err) {
    console.warn('Erreur parsing description:', err);
    return {
      type_transport: 'Aller-Retour',
      abonnement: 'Mensuel',
      groupe: null,
      zone: null,
      niveau: null,
      lien_parente: null,
      sexe: null
    };
  }
};

