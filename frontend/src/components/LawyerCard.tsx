import { useNavigate } from "react-router-dom";
import type { Lawyer } from "../types";

const LawyerCard = ({ lawyer }: { lawyer: Lawyer }): JSX.Element => {
  const navigate = useNavigate();

  return (
    <article className="portal-card portal-card--lawyer lift-card">
      <div className="portal-card__media portal-card__media--lawyer" />
      <div className="portal-card__topline">
        <span className="portal-card__tag">PROFESSIONAL</span>
        <span className="portal-card__price">Custom</span>
      </div>
      <h3>{lawyer.isVerified ? "I am a Lawyer" : "Legal Review"}</h3>
      <p>Advanced review, collaboration, and trust workflows for firms handling higher-stakes agreements.</p>
      <ul className="portal-card__list">
        <li>{lawyer.specializations[0] ?? "Commercial contract review"}</li>
        <li>{lawyer.specializations[1] ?? "Secure collaboration"}</li>
        <li>${lawyer.feePerReview} fee per review</li>
      </ul>
      <button type="button" className="button button--primary button--block" onClick={() => navigate("/lawyers/dashboard")}>
        Select Firm Portal
      </button>
    </article>
  );
};

export default LawyerCard;
