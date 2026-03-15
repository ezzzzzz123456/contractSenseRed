import type { TrustSeal } from "../types";

const TrustSealBadge = ({ seal }: { seal?: TrustSeal }): JSX.Element => (
  <section className="card">
    <h2>Trust Seal</h2>
    {seal ? <p>Issued {new Date(seal.issuedAt).toLocaleDateString()} · {seal.sealHash}</p> : <p>No trust seal issued yet.</p>}
  </section>
);

export default TrustSealBadge;

