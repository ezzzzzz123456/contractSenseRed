import ClauseCard from "../components/ClauseCard";
import OutcomeSimulatorChat from "../components/OutcomeSimulatorChat";
import PartyIntelligencePanel from "../components/PartyIntelligencePanel";
import type { Clause } from "../types";

const demoClause: Clause = {
  text: "The Supplier may terminate this Agreement at any time without cause upon five (5) days written notice.",
  simplifiedText: "The supplier can end the agreement at any time with 5 days notice.",
  riskFlag: "red",
  explanation: "This grants a one-sided termination right.",
  counterClauseSuggestion: "Either party may terminate for convenience on thirty (30) days notice.",
};

const ContractAnalysisPage = (): JSX.Element => (
  <main className="page-shell grid">
    <h1>Contract Analysis</h1>
    <ClauseCard clause={demoClause} />
    <PartyIntelligencePanel />
    <OutcomeSimulatorChat />
  </main>
);

export default ContractAnalysisPage;

