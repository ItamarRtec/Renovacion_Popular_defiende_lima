const STEPS = [
  {
    title: "Regístrate",
    description: "Tus datos, un minuto, y ya estás dentro.",
  },
  {
    title: "Capacítate",
    description: "3 videitos cortos desde el celu y listo.",
  },
  {
    title: "Recibe tu mesa",
    description:
      "Tu local se confirma la primera semana de septiembre por WhatsApp",
  },
  {
    title: "Defiende tu mesa",
    description: "Preséntate 7 am en tu local de votación",
  },
  {
    title: "Cobra por Yape o Plin",
    description:
      "Cobras por Yape o Plin al entregar el acta de escrutinio de tu mesa de votación en físico a tu coordinador distrital",
  },
] as const;

export function ComoFunciona() {
  return (
    <section
      id="como-funciona"
      aria-labelledby="como-funciona-heading"
      className="scroll-mt-16 border-t border-border"
    >
      <div className="dl-container dl-section">
        <div className="mx-auto max-w-2xl text-center">
          <p className="dl-kicker">El proceso</p>
          <h2
            id="como-funciona-heading"
            className="dl-title mt-3 text-[clamp(2rem,4vw,2.75rem)]"
          >
            ¿Cómo funciona?
          </h2>
          <p className="mx-auto mt-4 dl-lede">
            Cinco pasos. Sin vueltas. Te capacitas, cuidas tu mesa y cobras.
          </p>
        </div>

        <ol className="mx-auto mt-14 max-w-3xl list-none space-y-0 p-0">
          {STEPS.map((step, index) => {
            const number = String(index + 1).padStart(2, "0");
            const isLast = index === STEPS.length - 1;

            return (
              <li
                key={step.title}
                className={`grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 py-7 sm:gap-x-8 sm:py-8 ${
                  isLast ? "" : "border-b border-border"
                }`}
              >
                <span
                  aria-hidden
                  className="pt-1 font-[family-name:var(--font-data)] text-sm font-medium tracking-tight text-zinc-500"
                >
                  {number}
                </span>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                    <span className="sr-only">{index + 1}. </span>
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-xl text-[0.975rem] leading-relaxed text-muted">
                    {step.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
