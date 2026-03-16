import { useState } from "react";
import { simulateContractOutcome } from "../services/api";
import type { OutcomeMessage } from "../types";

const initialMessages: OutcomeMessage[] = [
  {
    role: "assistant",
    content:
      "Hello! I've mapped out the potential scenarios for this contract. Ask me anything like: What happens if I resign after 6 months to join a competitor?",
  },
  {
    role: "user",
    content: "What is the scenario if the company is acquired?",
  },
  {
    role: "assistant",
    content:
      "Under the successors clause, obligations transfer to the acquiring entity. However, equity and acceleration treatment may depend on negotiated trigger language.",
  },
];

const OutcomeSimulatorChat = ({ contractId }: { contractId?: string }): JSX.Element => {
  const [messages, setMessages] = useState<OutcomeMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (): Promise<void> => {
    const question = draft.trim();

    if (!question) {
      return;
    }

    const nextMessages: OutcomeMessage[] = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    setDraft("");

    if (!contractId) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant" as const,
          content:
            "This scenario needs final legal review, but based on the current clause set the likely outcome is manageable if assignment, termination, and change-of-control wording stay balanced.",
        },
      ]);
      return;
    }

    setIsLoading(true);
    try {
      const result = await simulateContractOutcome(contractId, nextMessages);
      setMessages([
        ...nextMessages,
        {
          role: "assistant" as const,
          content: `${result.reply} Confidence: ${Math.round(result.confidence * 100)}%.`,
        },
      ]);
    } catch {
      setMessages([
        ...nextMessages,
        {
          role: "assistant" as const,
          content:
            "Outcome simulation is temporarily unavailable. Please verify the backend and AI service are both running.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="simulator-card">
      <header className="simulator-card__header">
        <h2>Outcome Simulator</h2>
        <span>AI Model: L4-Legal-Specialist</span>
      </header>
      <div className="chat-thread">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`chat-bubble chat-bubble--${message.role}`}>
            {message.content}
          </div>
        ))}
      </div>
      <div className="simulator-card__composer">
        <input
          type="text"
          placeholder="Simulate a scenario..."
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void handleSend();
            }
          }}
        />
        <button type="button" className="button button--primary" onClick={() => void handleSend()} disabled={isLoading}>
          {isLoading ? "Running..." : "Send"}
        </button>
      </div>
    </section>
  );
};

export default OutcomeSimulatorChat;
