const CounterClauseSuggestion = ({ suggestion }: { suggestion: string }): JSX.Element => (
  <section className="card">
    <h2>Counter-Clause</h2>
    <p>{suggestion}</p>
  </section>
);

export default CounterClauseSuggestion;

