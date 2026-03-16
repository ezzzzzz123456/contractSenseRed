import type { TrustSeal } from "../types";

const TrustSealBadge = ({ seal }: { seal?: TrustSeal }): JSX.Element => (
  <section className={`trust-seal-banner${seal ? " trust-seal-banner--verified" : ""}`}>
    <div className="trust-seal-banner__icon">{seal ? "S" : "?"}</div>
    <div>
      <h2>{seal ? "Trust Seal Verified" : "Trust Seal Pending"}</h2>
      <p>
        {seal
          ? `Issued ${new Date(seal.issuedAt).toLocaleDateString()} · ${seal.sealHash}`
          : "This document has not undergone final human verification yet."}
      </p>
    </div>
  </section>
);

export default TrustSealBadge;
