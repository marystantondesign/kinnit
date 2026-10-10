interface SurveySectionContainerProps {
  title: string;
  children: React.ReactNode;
}

export function SurveySectionContainer({ title, children }: SurveySectionContainerProps) {
  return (
    <section className="mb-12 p-8 border border-gray-200 rounded-lg bg-white">
      <h2 className="mb-6">{title}</h2>
      <div className="space-y-8">
        {children}
      </div>
    </section>
  );
}
