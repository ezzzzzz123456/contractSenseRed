def classify_contract_type(contract_text: str) -> str:
    lowered = contract_text.lower()
    if "service" in lowered:
        return "msa"
    if "employment" in lowered:
        return "employment"
    return "general"

