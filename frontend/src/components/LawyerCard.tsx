import type { Lawyer } from "../types";

const LawyerCard = ({ lawyer }: { lawyer: Lawyer }): JSX.Element => (
  <article className="card">
    <h3>{lawyer.specializations.join(" · ")}</h3>
    <p>Rating: {lawyer.ratings}</p>
    <p>Fee per review: ${lawyer.feePerReview}</p>
    <p>{lawyer.isVerified ? "Verified lawyer" : "Verification pending"}</p>
  </article>
);

export default LawyerCard;

