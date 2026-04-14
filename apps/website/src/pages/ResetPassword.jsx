import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { logger } from "@/utils/logger";
import { Loader2 } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const hash = window.location.hash.replace(/^#/, "");
        const params = new URLSearchParams(hash);
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        const type = params.get("type");
        
        logger.log("[ResetPassword] hash params", { 
          access_token: !!access_token, 
          refresh_token: !!refresh_token, 
          type 
        });

        if (!access_token || !refresh_token || type !== "recovery") {
          setError("Lien invalide ou expiré. Merci de refaire une demande de réinitialisation.");
          setLoading(false);
          return;
        }

        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (sessionError) {
          logger.error("[ResetPassword] setSession error", sessionError);
          setError("Impossible de valider le lien. Merci de refaire une demande.");
          setLoading(false);
          return;
        }

        setLoading(false);
      } catch (e) {
        logger.error("[ResetPassword] unexpected error", e);
        setError("Erreur inattendue. Merci de réessayer.");
        setLoading(false);
      }
    };
    
    run();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!password || password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    try {
      setSubmitting(true);
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        logger.error("[ResetPassword] updateUser error", updateError);
        setError(updateError.message || "Erreur lors de la mise à jour du mot de passe.");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      toast({
        title: "Mot de passe mis à jour",
        description: "Votre mot de passe a été mis à jour avec succès. Redirection vers la page de connexion...",
      });

      // Redirection vers la page de login après quelques secondes
      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (e) {
      logger.error("[ResetPassword] unexpected error", e);
      setError("Erreur inattendue. Merci de réessayer.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-secondary-600 mx-auto mb-4" />
          <p className="text-gray-600">Validation du lien de réinitialisation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white shadow-md rounded-lg p-6">
        <div className="text-center mb-6">
          <img 
            alt="Logo Effinor" 
            className="mx-auto h-12 w-auto mb-4" 
            src="https://i.ibb.co/6rT1m18/logo-ecps.png" 
          />
          <h1 className="text-xl font-semibold">Définir un nouveau mot de passe</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center">
            <div className="mb-4 text-6xl">✅</div>
            <p className="text-sm text-green-600 mb-4">
              Votre mot de passe a bien été mis à jour.
            </p>
            <p className="text-sm text-gray-600">
              Vous allez être redirigé vers la page de connexion...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1 text-gray-700">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                id="password"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Minimum 8 caractères"
              />
            </div>

            <div>
              <label htmlFor="passwordConfirm" className="block text-sm font-medium mb-1 text-gray-700">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                id="passwordConfirm"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-500"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Répétez le mot de passe"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-secondary-600 text-white py-2 rounded hover:bg-secondary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </span>
              ) : (
                "Enregistrer mon nouveau mot de passe"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}








