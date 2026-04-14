import React from 'react';

export const EmailTemplate = ({ formData }) => {
  const { nom_prenom, email, telephone, exploitation, objectif, demarrer, surface, chauffee, departement } = formData || {};

  return (
    <div style={main}>
      <div style={container}>
        <h1 style={heading}>Merci pour votre demande d'audit CEE !</h1>
        <p style={paragraph}>Bonjour {nom_prenom || 'futur partenaire'},</p>
        <p style={paragraph}>
          Nous avons bien reçu votre demande concernant le financement CEE pour un déshumidificateur de serre. Notre équipe est déjà en train d'étudier votre projet.
        </p>
        <p style={paragraph}>
          Un de nos experts vous contactera par téléphone au <strong>{telephone}</strong> dans les 24 heures pour échanger sur vos besoins et confirmer votre éligibilité.
        </p>
        
        <div style={recapBox}>
          <h2 style={subHeading}>Récapitulatif de votre demande :</h2>
          <ul style={list}>
            {nom_prenom && <li style={listItem}><strong>Nom :</strong> {nom_prenom}</li>}
            {exploitation && <li style={listItem}><strong>Exploitation :</strong> {exploitation}</li>}
            {email && <li style={listItem}><strong>Email :</strong> {email}</li>}
            {telephone && <li style={listItem}><strong>Téléphone :</strong> {telephone}</li>}
            {departement && <li style={listItem}><strong>Département :</strong> {departement}</li>}
            {objectif && <li style={listItem}><strong>Objectif principal :</strong> {objectif}</li>}
            {demarrer && <li style={listItem}><strong>Démarrage souhaité :</strong> {demarrer}</li>}
            {surface && <li style={listItem}><strong>Surface des serres :</strong> {surface}</li>}
            {chauffee && <li style={listItem}><strong>Serre chauffée :</strong> {chauffee}</li>}
          </ul>
        </div>

        <p style={paragraph}>
          Si vous avez la moindre question en attendant, n'hésitez pas à nous contacter.
        </p>
        <p style={paragraph}>
          À très bientôt,
          <br />
          L'équipe AGRI-TH-117
        </p>
        <hr style={hr} />
        <p style={footer}>
          AGRI-TH-117 | Votre partenaire en efficacité énergétique
        </p>
      </div>
    </div>
  );
};

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  padding: '20px 0',
};

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #f0f0f0',
  borderRadius: '8px',
  margin: '0 auto',
  maxWidth: '600px',
  padding: '40px',
};

const heading = {
  color: '#0c4a6e', // primary-darker
  fontSize: '28px',
  fontWeight: 'bold',
  textAlign: 'center',
};

const subHeading = {
  color: '#1e293b',
  fontSize: '20px',
  fontWeight: 'bold',
  marginBottom: '16px',
};

const paragraph = {
  color: '#334155',
  fontSize: '16px',
  lineHeight: '26px',
  marginBottom: '16px',
};

const recapBox = {
  backgroundColor: '#f1f5f9',
  borderRadius: '8px',
  padding: '24px',
  margin: '32px 0',
};

const list = {
  listStyle: 'none',
  padding: 0,
};

const listItem = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#475569',
  marginBottom: '8px',
};

const hr = {
  borderColor: '#f0f0f0',
  margin: '20px 0',
};

const footer = {
  color: '#64748b',
  fontSize: '12px',
  textAlign: 'center',
};