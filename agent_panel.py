import anthropic


class AgentPanel:
    def __init__(self, system_prompts: dict[str, str], model: str = "claude-sonnet-4-20250514"):
        self.client = anthropic.Anthropic()
        self.model = model
        self.system_prompts = system_prompts
        self.agent_names = list(system_prompts.keys())
        self.histories: dict[str, list[dict]] = {name: [] for name in self.agent_names}
        self.transcript: list[dict] = []

    def _call(self, agent_name: str, user_msg: str) -> str:
        self.histories[agent_name].append({"role": "user", "content": user_msg})

        response = self.client.messages.create(
            model=self.model,
            max_tokens=1024,
            system=self.system_prompts[agent_name],
            messages=self.histories[agent_name],
        )

        text = response.content[0].text
        self.histories[agent_name].append({"role": "assistant", "content": text})
        self.transcript.append({"agent": agent_name, "message": text})
        return text

    def discuss(self, topic: str, rounds: int = 3) -> list[dict]:
        # Seed the first agent with the raw topic
        first = self.agent_names[0]
        print(f"\n[{first}]")
        last_response = self._call(first, topic)
        print(last_response)

        # Rotate through all agents for N rounds
        for round_num in range(1, rounds + 1):
            for agent_name in self.agent_names:
                if round_num == 1 and agent_name == first:
                    continue
                previous_agent = self.transcript[-1]["agent"]
                prompt = f"[Round {round_num} - {previous_agent}]: {last_response}"
                print(f"\n[{agent_name}] (round {round_num})")
                last_response = self._call(agent_name, prompt)
                print(last_response)

        return self.transcript


if __name__ == "__main__":
    prompts = {
        "Skeptic": (
            "You are the Skeptic. You question assumptions, flag risks, and push back "
            "on ideas that lack evidence or safety guarantees. Be direct and concise. "
            "Keep responses under 150 words."
        ),
        "Builder": (
            "You are the Builder. You focus on practical implementation, engineering "
            "trade-offs, and shipping working systems. You value pragmatism over "
            "perfection. Be direct and concise. Keep responses under 150 words."
        ),
        "Synthesizer": (
            "You are the Synthesizer. You find common ground, reconcile opposing views, "
            "and propose balanced frameworks. You look for the best parts of each "
            "argument. Be direct and concise. Keep responses under 150 words."
        ),
    }

    panel = AgentPanel(prompts)
    transcript = panel.discuss(
        "Should AI agents autonomously execute code in production environments?",
        rounds=2,
    )
