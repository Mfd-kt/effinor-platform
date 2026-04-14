import { Button } from "@effinor/ui";

export default function App() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>Landing — PAC air/eau</h1>
      <p>Port dev : 3003 — déployer sur le sous-domaine dédié (ex. pac.effinor.fr)</p>
      <Button>Demander une étude</Button>
    </main>
  );
}
