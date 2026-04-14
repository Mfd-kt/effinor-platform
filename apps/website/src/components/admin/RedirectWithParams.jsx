/**
 * Composant pour rediriger avec des paramètres de route
 */
import { useParams, Navigate } from 'react-router-dom';

export default function RedirectWithParams({ to, replace = true }) {
  const params = useParams();
  const newPath = Object.keys(params).reduce((path, key) => {
    return path.replace(`:${key}`, params[key]);
  }, to);
  
  return <Navigate to={newPath} replace={replace} />;
}



















