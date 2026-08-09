const STEPS = [
  {
    title: "Regístrate",
    description: "Completa tus datos y confirma tu inscripción.",
  },
  {
    title: "Capacítate",
    description: "Completa una capacitación breve y aprueba el cuestionario.",
  },
  {
    title: "Recibe tu asignación",
    description: "Te indicaremos tu local, mesa y coordinador.",
  },
  {
    title: "Defiende tu mesa",
    description:
      "Acompaña la jornada electoral y reporta la información requerida.",
  },
  {
    title: "Recibe tu remuneración",
    description:
      "Una vez validada tu participación, podrás recibir tu compensación.",
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
            Cinco pasos para sumarte a Defiende Lima y cuidar cada voto en 2026.
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
