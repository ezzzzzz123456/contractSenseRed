def chunk_text(text: str, size: int = 1000) -> list[str]:
    if size <= 0:
        return [text]
    return [text[index : index + size] for index in range(0, len(text), size)] or [text]

