import { useState } from "react";
import type { FormEvent } from "react";
import { simulateContractOutcome } from "../services/api";
import type { OutcomeMessage } from "../types";


const OutcomeSimulatorChat = ({ contractId }: { contractId?: string }): JSX.Element => {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<OutcomeMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contractId || !prompt.trim()) {
      return;
    }

    const nextMessages: OutcomeMessage[] = [...messages, { role: "user", content: prompt.trim() }];
    setMessages(nextMessages);
    setPrompt("");
    setIsLoading(true);
    setError("");
    try {
      const result = await simulateContractOutcome(contractId, nextMessages);
      setMessages([
        ...nextMessages,
        { role: "assistant", content: `${result.reply} Confidence: ${Math.round(result.confidence * 100)}%.` },
      ]);
    } catch (simulationError) {
      setError("Outcome simulation failed. Make sure the backend and AI service are available.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="card">
      <h2>Outcome simulator</h2>
      {contractId ? (
        <>
          <div className="chat-log">
            {messages.length ? messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`chat-bubble ${message.role}`}>
                {message.content}
              </div>
            )) : <p className="helper-text">Ask what happens if a party breaches, terminates, delays payment, or triggers a penalty.</p>}
          </div>
          <form className="chat-form" onSubmit={handleSubmit}>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Example: What happens if the vendor misses delivery and the client terminates immediately?"
              rows={4}
            />
            <button className="secondary-button" type="submit" disabled={isLoading}>
              {isLoading ? "Simulating..." : "Run simulation"}
            </button>
          </form>
          {error ? <p className="error-text">{error}</p> : null}
        </>
      ) : (
        <p>Upload and analyze a contract first to simulate outcomes.</p>
      )}
    </section>
  );
};


export default OutcomeSimulatorChat;
