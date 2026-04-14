import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { Combobox } from "@/components/ui/combobox";
import { departements } from '@/lib/departements';
import { useNavigate } from 'react-router-dom';

// Configuration Web3Forms - Email de secours si Airtable échoue
const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || '5e19aa32-226b-4798-9027-b0bef7c66478';
const BACKUP_EMAIL = import.meta.env.VITE_BACKUP_EMAIL || 'leads.effinor@gmail.com';

const FormField = ({ children }) => <div className="mb-3 md:mb-4">{children}</div>;

const Label = ({ children, htmlFor, required }) => (
	<label htmlFor={htmlFor} className="block text-sm font-semibold text-gray-700 mb-2">
		{children} {required && <span className="text-red-500">*</span>}
	</label>
);

const Input = (props) => (
	<input
		{...props}
		className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
	/>
);

const RadioPill = ({ children, ...props }) => (
	<button
		type="button"
		{...props}
		className={`choice-pill block w-full text-center px-3 py-2 border rounded-lg cursor-pointer transition-colors bg-white hover:bg-gray-100 ${props.className || ''}`}
	>
		<span className="text-sm font-medium pointer-events-none">{children}</span>
	</button>
);

const MultiStepForm = () => {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		telephone: '',
		surface: '',
		departement: '',
		nom: '',
		societe: '',
		email: '',
		clientType: 'Site industriel / logistique', // Site industriel / logistique / Collectivité / Tertiaire
		// Honeypot (anti-spam) — doit rester vide
		website: ''
	});
	const [hasConsent, setHasConsent] = useState(false);
	const [showParticulierError, setShowParticulierError] = useState(false);

	const handleChoiceClick = (group, value) => {
		setFormData(prev => ({ ...prev, [group]: value }));
		if (group === 'clientType' && value === 'Particulier') {
			setShowParticulierError(true);
		} else if (group === 'clientType') {
			setShowParticulierError(false);
		}
	};
	
	const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
	const handleSelectChange = (name, value) => setFormData(prev => ({ ...prev, [name]: value }));

	// EMAIL DE SECOURS (envoyé si Airtable échoue)
	const sendEmailNotification = async (data) => {
		try {
			console.log('📧 Envoi email de secours...');

			const emailBody = `
🚨 NOUVEAU LEAD - DESTRATIFICATEUR (Airtable KO)

⚠️⚠️⚠️ ALERTE : CE LEAD N'EST PAS DANS AIRTABLE ⚠️⚠️⚠️

═══════════════════════════════════════
📋 INFORMATIONS DE CONTACT
═══════════════════════════════════════

👤 Nom          : ${data.nom || 'Non renseigné'}
🏢 Société      : ${data.societe || 'Non renseigné'}
📧 Email        : ${data.email || 'Non renseigné'}
📞 Téléphone    : ${data.telephone}
📍 Département  : ${data.departement}
🏭 Type client  : ${data.clientType}

═══════════════════════════════════════
🏗️ CARACTÉRISTIQUES DU BÂTIMENT
═══════════════════════════════════════

📐 Surface              : ${data.surface}

═══════════════════════════════════════
ℹ️ INFORMATIONS COMPLÉMENTAIRES
═══════════════════════════════════════

🕐 Date   : ${new Date().toISOString()}

🚨 Ce lead N'A PAS été enregistré dans Airtable.
⚠️ VOUS DEVEZ LE CRÉER MANUELLEMENT.
      `;

			const response = await fetch('https://api.web3forms.com/submit', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					access_key: WEB3FORMS_ACCESS_KEY,
					subject: `🚨 [ÉCHEC Airtable] Lead Destrat - ${data.nom || data.telephone}`,
					from_name: 'Landing Destrat Effinor',
					email: BACKUP_EMAIL,
					message: emailBody,
					'Nom': data.nom,
					'Société': data.societe,
					'Email': data.email,
					'Téléphone': data.telephone,
					'Département': data.departement,
					'Surface': data.surface,
					'Type client': data.clientType
				})
			});

			const result = await response.json();

			if (result.success) {
				console.log('✅ Email de secours envoyé');
				return true;
			} else {
				console.error('❌ Erreur Web3Forms:', result);
				return false;
			}
		} catch (error) {
			console.error('❌ Échec email secours:', error);
			return false;
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		// Vérifier le type de client
		if (formData.clientType === 'Particulier') {
			toast({
				variant: "destructive",
				title: "Solution réservée aux professionnels",
				description: "Solution réservée aux professionnels dans le cadre du dispositif CEE.",
			});
			setShowParticulierError(true);
			return;
		}

		// Validation des champs obligatoires
		const need = (name, label) => {
			if (!formData[name]) {
				toast({
					variant: "destructive",
					title: "Champ requis",
					description: `Merci de renseigner : ${label}`
				});
				return false;
			}
			return true;
		};

		if (!need("telephone", "Téléphone") || 
			!need("surface", "Surface chauffée") || 
			!need("departement", "Département")) {
			return;
		}

		// Validation email si fourni
		if (formData.email) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(formData.email)) {
				toast({
					variant: "destructive",
					title: "Email invalide",
					description: "Merci de renseigner un email valide"
				});
				return;
			}
		}

		// Validation consentement RGPD
		if (!hasConsent) {
			toast({
				variant: "destructive",
				title: "Consentement requis",
				description: "Merci d'accepter la politique de confidentialité pour envoyer la demande."
			});
			return;
		}

		setIsSubmitting(true);

		// Event tracking: début de soumission
		if (window.gtag) {
			window.gtag('event', 'form_submit_start', {
				'event_category': 'form_destratificateur',
				'event_label': 'devis_destratificateur'
			});
		}

		const dataToSend = {
			telephone: formData.telephone,
			surface: formData.surface,
			departement: formData.departement,
			nom: formData.nom || '',
			societe: formData.societe || '',
			email: formData.email || '',
			clientType: formData.clientType,
			// Honeypot
			website: formData.website
		};

		let airtableSuccess = false;

		// Mode dev: simuler le succès si on est en localhost (PHP ne tourne pas)
		const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

		if (isLocalDev) {
			console.log('🧪 MODE DEV: simulation envoi Airtable (PHP non disponible en local)');
			console.log('📤 Données qui seraient envoyées:', dataToSend);
			airtableSuccess = true; // Simuler le succès en dev

			if (window.gtag) {
				window.gtag('event', 'form_submit_success', {
					'event_category': 'form_destratificateur',
					'event_label': 'devis_destratificateur',
					'method': 'airtable_dev_mock'
				});
			}
		} else {
			// PRODUCTION: Envoi à l'API PHP (Airtable)
		try {
				console.log('📤 Envoi à Airtable via /api/lead.php:', dataToSend);

				const response = await fetch('/api/lead.php', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(dataToSend),
				signal: AbortSignal.timeout(15000)
			});

				const result = await response.json();
				console.log('📨 Réponse Airtable:', response.status, result);

				if (response.ok && result.ok) {
					console.log('✅ Airtable SUCCESS !');
					airtableSuccess = true;

				if (window.gtag) {
					window.gtag('event', 'form_submit_success', {
						'event_category': 'form_destratificateur',
						'event_label': 'devis_destratificateur',
							'method': 'airtable'
					});
				}

			} else {
					console.error('❌ Airtable erreur:', result.error || response.status);
					throw new Error(result.error || `Airtable ${response.status}`);
			}
		} catch (error) {
				console.error('❌ Erreur Airtable:', error);
				airtableSuccess = false;

			if (window.gtag) {
					window.gtag('event', 'form_submit_airtable_error', {
					'event_category': 'form_destratificateur',
					'event_label': 'devis_destratificateur',
					'error_type': error.name || 'unknown'
				});
			}
			}
		}

		// EMAIL DE SECOURS (seulement si Airtable a échoué)
		let emailSent = false;
		if (!airtableSuccess) {
			console.log('📧 Envoi email de secours (Airtable KO)...');
			emailSent = await sendEmailNotification(dataToSend);

		if (emailSent) {
			console.log('✅ Email de secours envoyé');
		} else {
			console.warn('⚠️ Email de secours échoué');
		}
		}

		// Redirection vers /merci (si Airtable OK ou email OK)
		if (airtableSuccess || emailSent) {
			// Stocker les données dans sessionStorage pour la page /merci
			const thankYouData = {
				nom: formData.nom || '',
				societe: formData.societe || '',
				surface: formData.surface || '',
				departement: formData.departement || '',
			};
			sessionStorage.setItem('thankYouData', JSON.stringify(thankYouData));

			// Déclencher les conversions UNIQUEMENT après succès confirmé
			if (window.gtag) {
				// Google Ads conversion (lead)
				if (window.gtag_report_conversion) {
					window.gtag_report_conversion();
				}

				// GA4 generate_lead
				window.gtag('event', 'generate_lead', {
					'event_category': 'form',
					'event_label': 'devis_destratificateur'
				});

				// DataLayer pour compatibilité
				if (window.dataLayer) {
					window.dataLayer.push({
						'event': 'generate_lead',
						'event_category': 'form',
						'event_label': 'devis_destratificateur'
					});
				}
			}

			toast({
				title: "✅ Demande envoyée !",
				description: "Merci ! Un conseiller vous contactera sous 24h.",
			});

			setTimeout(() => {
				navigate('/merci');
			}, 1500);

		} else {
			console.error('❌ ÉCHEC TOTAL : Airtable ET Email');

			if (window.gtag) {
				window.gtag('event', 'form_submit_total_failure', {
					'event_category': 'form_destratificateur',
					'event_label': 'devis_destratificateur'
				});
			}

			toast({
				variant: "destructive",
				title: "❌ Erreur d'envoi",
				description: "Une erreur est survenue. Veuillez réessayer.",
			});

			setIsSubmitting(false);
		}
};

	return (
		<div id="multi-step-form-container" className="bg-white p-6 md:p-8 rounded-xl shadow-2xl">
			<form onSubmit={handleSubmit}>
				{/* Honeypot anti-spam (invisible) */}
				<input
					type="text"
					name="website"
					value={formData.website}
					onChange={handleInputChange}
					autoComplete="off"
					tabIndex={-1}
					style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
					aria-hidden="true"
				/>

				<h3 className="font-bold text-lg md:text-xl mb-2 text-center">Demandez votre estimation</h3>
				<p className="text-xs text-gray-600 text-center mb-5">
					Un expert vous rappelle sous 24h pour qualifier votre projet, sans engagement.
				</p>

				<div className="space-y-6 md:space-y-7">
					{/* Étape 1 – Organisation */}
					<section aria-labelledby="form-step-organisation">
						<p
							id="form-step-organisation"
							className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1"
						>
							Étape 1 · Votre organisation
						</p>
						<p className="text-sm text-gray-600 mb-3">
							Indiquez le type de structure concernée par l’installation.
						</p>

						<FormField>
							<Label htmlFor="clientType" required>Type d’organisation</Label>
							<div className="grid grid-cols-3 gap-2">
								<RadioPill
									onClick={() => handleChoiceClick('clientType', 'Site industriel / logistique')}
									className={formData.clientType === 'Site industriel / logistique' ? 'on border-orange-500 bg-orange-50' : ''}
								>
									Site industriel / logistique
								</RadioPill>
								<RadioPill
									onClick={() => handleChoiceClick('clientType', 'Collectivité')}
									className={formData.clientType === 'Collectivité' ? 'on border-orange-500 bg-orange-50' : ''}
								>
									Collectivité
								</RadioPill>
								<RadioPill
									onClick={() => handleChoiceClick('clientType', 'Tertiaire')}
									className={formData.clientType === 'Tertiaire' ? 'on border-orange-500 bg-orange-50' : ''}
								>
									Tertiaire
								</RadioPill>
							</div>

							<AnimatePresence>
								{showParticulierError && (
									<motion.div
										initial={{ opacity: 0, height: 0, marginTop: 0 }}
										animate={{ opacity: 1, height: 'auto', marginTop: '10px' }}
										exit={{ opacity: 0, height: 0, marginTop: 0 }}
										className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-r-lg text-sm flex items-start gap-2"
									>
										<AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
										<p>Solution réservée aux professionnels dans le cadre du dispositif CEE.</p>
									</motion.div>
								)}
							</AnimatePresence>
						</FormField>
					</section>

					{/* Étape 2 – Votre bâtiment */}
					<section aria-labelledby="form-step-batiment" className="pt-4 border-t border-gray-100">
						<p
							id="form-step-batiment"
							className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1"
						>
							Étape 2 · Votre bâtiment
						</p>
						<FormField>
							<Label htmlFor="surface" required>Surface chauffée</Label>
							<div className="grid grid-cols-3 gap-2">
								<RadioPill
									onClick={() => handleChoiceClick('surface', '800-2000 m²')}
									className={formData.surface === '800-2000 m²' ? 'on' : ''}
								>
									800–2000 m²
								</RadioPill>
								<RadioPill
									onClick={() => handleChoiceClick('surface', '2000-5000 m²')}
									className={formData.surface === '2000-5000 m²' ? 'on' : ''}
								>
									2000–5000 m²
								</RadioPill>
								<RadioPill
									onClick={() => handleChoiceClick('surface', '5000+ m²')}
									className={formData.surface === '5000+ m²' ? 'on' : ''}
								>
									5000+ m²
								</RadioPill>
							</div>
						</FormField>

						<FormField>
							<Label htmlFor="departement" required>Zone (département ou code postal)</Label>
							<Combobox
								options={departements}
								value={formData.departement}
								onSelect={(value) => handleSelectChange('departement', value)}
								placeholder="Ex : 75 – Paris ou 69000"
								searchPlaceholder="Tapez un numéro ou un nom…"
								notFoundMessage="Aucun département trouvé."
							/>
							<p className="mt-1 text-xs text-gray-500">
								Cela nous permet d’orienter votre demande vers le bon interlocuteur régional.
							</p>
						</FormField>
					</section>

					{/* Étape 3 – Vos coordonnées */}
					<section aria-labelledby="form-step-coordonnees" className="pt-4 border-t border-gray-100">
						<p
							id="form-step-coordonnees"
							className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1"
						>
							Étape 3 · Vos coordonnées
						</p>
						<p className="text-sm text-gray-600 mb-3">
							Nous utilisons ces informations uniquement pour vous rappeler et vous envoyer votre estimation.
						</p>

						<FormField>
							<Label htmlFor="nom">Nom & prénom</Label>
							<Input
								id="nom"
								name="nom"
								value={formData.nom}
								onChange={handleInputChange}
								autoComplete="name"
								placeholder="Jean Dupont"
							/>
						</FormField>

						<FormField>
							<Label htmlFor="societe">Société</Label>
							<Input
								id="societe"
								name="societe"
								value={formData.societe}
								onChange={handleInputChange}
								autoComplete="organization"
								placeholder="Nom de votre entreprise"
							/>
						</FormField>

						<div className="grid md:grid-cols-2 gap-3 md:gap-4">
							<FormField>
								<Label htmlFor="telephone" required>Téléphone</Label>
								<Input
									id="telephone"
									type="tel"
									name="telephone"
									value={formData.telephone}
									onChange={handleInputChange}
									required
									autoComplete="tel"
									inputMode="tel"
									placeholder="06 12 34 56 78"
								/>
								<p className="mt-1 text-xs text-gray-500">
									Pour être rappelé rapidement par un expert.
								</p>
							</FormField>

							<FormField>
								<Label htmlFor="email">Email pro</Label>
								<Input
									type="email"
									id="email"
									name="email"
									value={formData.email}
									onChange={handleInputChange}
									autoComplete="email"
									placeholder="jean.dupont@entreprise.fr"
								/>
								<p className="mt-1 text-xs text-gray-500">
									Facultatif, mais pratique pour vous envoyer le récapitulatif.
								</p>
							</FormField>
						</div>
					</section>
				</div>

				{/* Consentement RGPD */}
				<div className="mt-4 mb-6 text-xs text-gray-600">
					<label className="flex items-start gap-2">
						<input
							type="checkbox"
							className="mt-0.5"
							checked={hasConsent}
							onChange={(e) => setHasConsent(e.target.checked)}
				required
						/>
						<span>
							En envoyant ce formulaire, vous acceptez notre{' '}
							<a className="underline" href="/politique-de-confidentialite" target="_blank" rel="noreferrer">
								politique de confidentialité
							</a>{' '}
							et le traitement de vos données pour répondre à votre demande.
						</span>
					</label>
				</div>

				{/* Bouton submit */}
				<Button
					type="submit"
					disabled={isSubmitting}
					className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg py-6"
				>
					{isSubmitting ? (
						<Loader2 className="w-6 h-6 animate-spin mx-auto" />
					) : (
						"Vérifier mon éligibilité CEE ⚡"
					)}
				</Button>

				{/* Microcopy */}
				<div className="text-center text-xs text-gray-500 mt-4 space-y-1">
					<p>✅ Sans engagement</p>
					<p>✅ Réponse &lt; 24h</p>
					<p>✅ Dossier CEE géré intégralement</p>
					<p className="mt-2 text-amber-600 font-semibold">⚠️ Réservé aux professionnels</p>
				</div>
			</form>
	</div>
);
};

export default MultiStepForm;
