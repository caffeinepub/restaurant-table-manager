import { Button } from "@/components/ui/button";
import { ChefHat, Loader2, UtensilsCrossed } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background flex">
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ background: "oklch(0.22 0.06 15)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-accent-foreground" />
          </div>
          <span
            className="font-display text-xl font-semibold"
            style={{ color: "oklch(0.92 0.02 60)" }}
          >
            Tavola
          </span>
        </div>

        <div className="space-y-6">
          <h2
            className="font-display text-5xl font-bold leading-tight"
            style={{ color: "oklch(0.92 0.02 60)" }}
          >
            Gestisci il tuo
            <br />
            <span style={{ color: "oklch(0.65 0.13 40)" }}>ristorante</span>
            <br />
            con eleganza.
          </h2>
          <p className="text-lg" style={{ color: "oklch(0.72 0.04 55)" }}>
            Piantina interattiva, prenotazioni in tempo reale e panoramica
            giornaliera.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Sale", desc: "Gestione multisala" },
            { label: "Tavoli", desc: "Drag & drop" },
            { label: "Prenotazioni", desc: "In tempo reale" },
          ].map((f) => (
            <div
              key={f.label}
              className="p-4 rounded-lg"
              style={{ background: "oklch(0.30 0.06 15)" }}
            >
              <UtensilsCrossed
                className="w-5 h-5 mb-2"
                style={{ color: "oklch(0.65 0.13 40)" }}
              />
              <p
                className="font-display font-semibold text-sm"
                style={{ color: "oklch(0.92 0.02 60)" }}
              >
                {f.label}
              </p>
              <p className="text-xs" style={{ color: "oklch(0.60 0.04 55)" }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-semibold">Tavola</span>
          </div>

          <div className="space-y-3">
            <h1 className="font-display text-3xl font-bold">Accedi</h1>
            <p className="text-muted-foreground">
              Usa la tua identità digitale per accedere al pannello di gestione.
            </p>
          </div>

          <Button
            data-ocid="login.primary_button"
            className="w-full h-12 text-base font-medium"
            onClick={login}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accesso in corso...
              </>
            ) : (
              "Accedi con Internet Identity"
            )}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            Internet Identity garantisce un accesso sicuro e anonimo senza
            password.
          </p>
        </div>
      </div>
    </div>
  );
}
