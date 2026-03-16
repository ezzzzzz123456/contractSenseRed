import re

from app.models.schemas import ClauseSegment


HEADING_PATTERN = re.compile(
    r"^(section|article|chapter|part|schedule|appendix)\s+[\w.-]+|^chapter\s+[ivxlcdm]+|^part\s+[ivxlcdm]+$",
    re.IGNORECASE,
)
NUMBERED_PATTERN = re.compile(
    r"^(?P<marker>(\d+[A-Z]?(?:\.\d+)*|[A-Z]|[a-z]|[ivxlcdm]+)[\).]?)\s+(?P<body>.+)$"
)
INLINE_NUMBERED_PATTERN = re.compile(r"\s(?=(?:\d+[A-Z]?(?:\.\d+)*|[A-Z]|[ivxlcdm]+)[\).]\s+[A-Z])", re.IGNORECASE)
SENTENCE_SPLIT_PATTERN = re.compile(r"(?<=[.;])\s+(?=[A-Z(])")


class ClauseDetectorService:
    def detect_clauses(self, contract_text: str) -> list[str]:
        return [segment.originalText for segment in self.segment_document(contract_text)]

    def segment_document(self, contract_text: str) -> list[ClauseSegment]:
        normalized = contract_text.replace("\r\n", "\n").replace("\r", "\n")
        lines = [line.strip() for line in normalized.split("\n") if line.strip()]
        if not lines:
            return [
                ClauseSegment(
                    clauseId="clause-001",
                    sectionReference="General",
                    hierarchy=["General"],
                    originalText=contract_text.strip(),
                )
            ]

        clauses: list[ClauseSegment] = []
        current_section = "General"
        section_stack = ["General"]
        clause_counter = 1

        current_marker = ""
        current_title = ""
        current_hierarchy = list(section_stack)
        current_buffer: list[str] = []

        def flush_current() -> None:
            nonlocal clause_counter, current_marker, current_title, current_hierarchy, current_buffer
            text = " ".join(current_buffer).strip()
            current_buffer = []
            if not text:
                current_marker = ""
                current_title = ""
                current_hierarchy = list(section_stack)
                return

            for fragment in self._split_fragment(text):
                clauses.append(
                    ClauseSegment(
                        clauseId=f"clause-{clause_counter:03d}",
                        sectionReference=current_section,
                        hierarchy=list(current_hierarchy),
                        title=current_title,
                        originalText=fragment,
                    )
                )
                clause_counter += 1

            current_marker = ""
            current_title = ""
            current_hierarchy = list(section_stack)

        for line in lines:
            if self._is_heading(line):
                flush_current()
                current_section = line
                section_stack = [line]
                current_hierarchy = list(section_stack)
                continue

            numbered = NUMBERED_PATTERN.match(line)
            if numbered and self._looks_like_clause_start(line):
                flush_current()
                marker = numbered.group("marker").rstrip(".")
                body = numbered.group("body").strip()
                current_hierarchy = self._hierarchy_from_marker(marker, current_section)
                current_title = body.split(":")[0][:100] if ":" in body else ""
                current_marker = marker
                current_buffer = [body]
                continue

            if self._is_short_heading(line) and not current_buffer:
                flush_current()
                current_section = line.rstrip(":")
                section_stack = [current_section]
                current_hierarchy = list(section_stack)
                continue

            if self._looks_like_subheading(line) and current_buffer:
                flush_current()
                current_section = line
                section_stack = [line]
                current_hierarchy = list(section_stack)
                continue

            current_buffer.append(line)

        flush_current()
        return clauses or [
            ClauseSegment(
                clauseId="clause-001",
                sectionReference="General",
                hierarchy=["General"],
                originalText=normalized.strip(),
            )
        ]

    def _split_fragment(self, fragment: str) -> list[str]:
        inline_split = self._split_inline_numbered(fragment)
        if len(inline_split) > 1:
            return [piece for fragment_piece in inline_split for piece in self._split_fragment(fragment_piece)]

        parts = [piece.strip() for piece in SENTENCE_SPLIT_PATTERN.split(fragment) if piece.strip()]
        if len(parts) <= 1:
            return [fragment]
        if self._looks_like_clause_label(parts[0]):
            return [fragment]

        merged: list[str] = []
        cursor = ""
        for part in parts:
            candidate = f"{cursor} {part}".strip() if cursor else part
            if len(candidate) < 220 and not re.search(r"[.;:]$", candidate):
                cursor = candidate
                continue
            if cursor:
                merged.append(candidate)
                cursor = ""
            else:
                merged.append(part)
        if cursor:
            merged.append(cursor)
        return merged or [fragment]

    def _split_inline_numbered(self, text: str) -> list[str]:
        pieces = [piece.strip() for piece in INLINE_NUMBERED_PATTERN.split(text) if piece.strip()]
        cleaned: list[str] = []
        for piece in pieces:
            normalized = re.sub(r"^(\d+[A-Z]?(?:\.\d+)*|[A-Z]|[ivxlcdm]+)[\).]\s+", "", piece, flags=re.IGNORECASE).strip()
            if normalized:
                cleaned.append(normalized)
        return cleaned or [text]

    def _hierarchy_from_marker(self, marker: str, current_section: str) -> list[str]:
        hierarchy = [current_section]
        if "." in marker:
            prefixes = marker.split(".")
            running: list[str] = []
            for prefix in prefixes:
                running.append(prefix)
                hierarchy.append(".".join(running))
        else:
            hierarchy.append(marker)
        return hierarchy

    def _is_heading(self, line: str) -> bool:
        if HEADING_PATTERN.match(line):
            return True
        if line.isupper() and 3 <= len(line.split()) <= 14:
            return True
        return False

    def _is_short_heading(self, line: str) -> bool:
        return line.endswith(":") and len(line.split()) <= 10

    def _looks_like_subheading(self, line: str) -> bool:
        return line.isupper() and 2 <= len(line.split()) <= 12

    def _looks_like_clause_start(self, line: str) -> bool:
        lowered = line.lower()
        return not lowered.startswith(("page ", "figure ", "table "))

    def _looks_like_clause_label(self, line: str) -> bool:
        return line.endswith(".") and len(line.split()) <= 4 and line[0].isupper()


clause_detector = ClauseDetectorService()
