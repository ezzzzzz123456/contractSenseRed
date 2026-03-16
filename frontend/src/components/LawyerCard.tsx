import { useNavigate } from "react-router-dom";
import type { Lawyer } from "../types";

const LawyerCard = ({
  lawyer,
  actionLabel = "Select Firm Portal",
  onAction,
}: {
  lawyer: Lawyer;
  actionLabel?: string;
  onAction?: (lawyer: Lawyer) => void;
}): JSX.Element => {
  const navigate = useNavigate();

  return (
    <article className="portal-card">
      <div className="portal-card__media portal-card__media--lawyer" />
      <div className="portal-card__icon">L</div>
      <h3>{lawyer.name ?? (lawyer.isVerified ? "I am a Lawyer" : "Legal Review")}</h3>
      <p>{lawyer.email ?? "Advanced tools for document review, discovery, and firm management."}</p>
      <ul className="portal-card__list">
        <li>{lawyer.specializations[0] ?? "Commercial contract review"}</li>
        <li>{lawyer.specializations[1] ?? "Secure collaboration"}</li>
        <li>{lawyer.isVerified ? "Verified profile" : "Pending verification"}</li>
        <li>${lawyer.feePerReview} fee per review</li>
      </ul>
      <button
        type="button"
        className="button button--secondary button--block"
        onClick={() => {
          if (onAction) {
            onAction(lawyer);
            return;
          }

          navigate("/lawyers/dashboard");
        }}
      >
        {actionLabel}
      </button>
    </article>
  );
};

export default LawyerCard;
