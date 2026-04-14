import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Loader2 } from 'lucide-react';

const SignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (!email || !password || !confirmPassword) {
        throw new Error('Veuillez remplir tous les champs');
      }
      if (password !== confirmPassword) {
        throw new Error('Les mots de passe ne correspondent pas');
      }
      if (password.length < 8) {
        throw new Error('Le mot de passe doit contenir au moins 8 caractères');
      }

      // Vérifier que le profil existe
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (profileError || !profile) {
        throw new Error('Aucun profil trouvé pour cet email. Contactez un administrateur.');
      }

      // Créer le compte auth
      const { error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (signUpError) {
        throw signUpError;
      }
      
      // La trigger 'handle_new_auth_user' va lier le profil existant

      toast({
        title: '✅ Compte créé avec succès !',
        description: "Vous allez recevoir un email de confirmation. Veuillez cliquer sur le lien pour activer votre compte avant de vous connecter.",
      });
      navigate('/login');

    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Créer un compte | EFFINOR Admin</title></Helmet>
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4" style={{ background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)' }}>
        <div className="bg-white p-10 rounded-xl shadow-2xl w-full max-w-md">
          <div className="text-center mb-8">
            <img alt="Logo EFFINOR" className="mx-auto h-16 w-auto" src="https://i.ibb.co/6rT1m18/logo-ecps.png" />
            <h1 className="mt-6 text-3xl font-extrabold text-gray-900">
              Créer votre compte EFFINOR
            </h1>
            <p className="mt-2 text-sm text-gray-600">Finalisez votre inscription</p>
          </div>
            <form onSubmit={handleSignUp} className="space-y-6">
              <div>
                <Label htmlFor="signup-email" className="font-medium text-gray-700">Email (fourni par l'administrateur)</Label>
                <Input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                  placeholder="votre.email@effinor.fr"
                />
              </div>
              <div>
                <Label htmlFor="signup-password">Mot de passe (min. 8 caractères)</Label>
                <Input
                  id="signup-password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <Input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1"
                  placeholder="••••••••"
                />
              </div>

              {errorMsg && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm">
                  {errorMsg}
                </div>
              )}

              <div>
                <Button type="submit" className="w-full bg-secondary-600 hover:bg-secondary-700 text-base py-3" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Créer mon compte'}
                </Button>
              </div>
            </form>
            <div className="text-sm text-center mt-6">
                <Link to="/login" className="font-medium text-secondary-600 hover:underline">
                  Déjà un compte ? Se connecter
                </Link>
              </div>
        </div>
      </div>
    </>
  );
};

export default SignUp;