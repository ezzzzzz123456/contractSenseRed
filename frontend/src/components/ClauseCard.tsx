import type { Clause } from "../types";
import RiskFlag from "./RiskFlag";


const ClauseCard = ({ clause }: { clause: Clause }): JSX.Element => (
  <article className="card clause-card">
    <div className="clause-header">
      <div>
        <p className="eyebrow">{clause.sectionReference}</p>
        <h3>{clause.title || clause.clauseId}</h3>
      </div>
      <div className="clause-risk">
        <RiskFlag value={clause.riskFlag} />
        <strong>{Math.round(clause.riskScore)}/100</strong>
      </div>
    </div>
    <p><strong>Original:</strong> {clause.text}</p>
    <p><strong>Plain language:</strong> {clause.simplifiedText}</p>
    <p><strong>Why it matters:</strong> {clause.explanation}</p>
    <p><strong>Judge view:</strong> {clause.courtroomAssessment.judgeView}</p>
    <p><strong>Likely ruling:</strong> {clause.courtroomAssessment.likelyRuling}</p>
    <p><strong>Business impact:</strong> {clause.courtroomAssessment.businessImpact}</p>
    <p><strong>Suggested revision:</strong> {clause.counterClauseSuggestion}</p>
    {clause.improvementJustification ? <p><strong>Why this rewrite helps:</strong> {clause.improvementJustification}</p> : null}
    {clause.negotiationDraft ? <p><strong>Negotiation draft:</strong> {clause.negotiationDraft}</p> : null}
    {clause.recommendations.length ? (
      <div>
        <strong>Recommendations</strong>
        <ul>
          {clause.recommendations.map((item) => (
            <li key={`${clause.clauseId}-${item}`}>{item}</li>
          ))}
        </ul>
      </div>
    ) : null}
    {clause.courtroomAssessment.enforceabilityConcerns.length ? (
      <div>
        <strong>Enforceability concerns</strong>
        <ul>
          {clause.courtroomAssessment.enforceabilityConcerns.map((item) => (
            <li key={`${clause.clauseId}-enforce-${item}`}>{item}</li>
          ))}
        </ul>
      </div>
    ) : null}
    {clause.courtroomAssessment.claimantArguments.length ? (
      <div>
        <strong>Claimant lawyer would argue</strong>
        <ul>
          {clause.courtroomAssessment.claimantArguments.map((item) => (
            <li key={`${clause.clauseId}-claim-${item}`}>{item}</li>
          ))}
        </ul>
      </div>
    ) : null}
    {clause.courtroomAssessment.defenseArguments.length ? (
      <div>
        <strong>Defense lawyer would argue</strong>
        <ul>
          {clause.courtroomAssessment.defenseArguments.map((item) => (
            <li key={`${clause.clauseId}-defense-${item}`}>{item}</li>
          ))}
        </ul>
      </div>
    ) : null}
    {clause.loopholes.length ? (
      <div>
        <strong>Loopholes</strong>
        <ul>
          {clause.loopholes.map((item) => (
            <li key={`${clause.clauseId}-loop-${item}`}>{item}</li>
          ))}
        </ul>
      </div>
    ) : null}
    {clause.legalScenarios.length ? (
      <div>
        <strong>Courtroom simulation</strong>
        <ul>
          {clause.legalScenarios.map((scenario) => (
            <li key={`${clause.clauseId}-${scenario.scenario}`}>
              <strong>{scenario.scenario}:</strong> {scenario.likelyConsequence} {scenario.reasoning ? `(${scenario.reasoning})` : ""}
            </li>
          ))}
        </ul>
      </div>
    ) : null}
  </article>
);


export default ClauseCard;
