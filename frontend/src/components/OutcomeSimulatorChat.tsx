import { useState } from "react";
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

const OutcomeSimulatorChat = (): JSX.Element => {
  const [messages, setMessages] = useState<OutcomeMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");

  const handleSend = (): void => {
    const question = draft.trim();

    if (!question) {
      return;
    }

    setMessages((current) => [
      ...current,
      { role: "user", content: question },
      {
        role: "assistant",
        content:
          "This scenario needs final legal review, but based on the current clause set the likely outcome is manageable if assignment, termination, and change-of-control wording stay balanced.",
      },
    ]);
    setDraft("");
  };

  return (
    <section className="simulator-card lift-card">
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
              handleSend();
            }
          }}
        />
        <button type="button" className="button button--primary" onClick={handleSend}>
          Send
        </button>
      </div>
    </section>
  );
};

export default OutcomeSimulatorChat;
