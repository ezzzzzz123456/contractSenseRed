from dataclasses import dataclass


@dataclass
class OCRTextBlock:
    page_number: int
    x0: float
    y0: float
    x1: float
    y1: float
    text: str
    confidence: float


class TextBlockBuilder:
    def order_blocks(self, blocks: list[OCRTextBlock]) -> list[OCRTextBlock]:
        return sorted(blocks, key=lambda block: (block.page_number, round(block.y0, 1), round(block.x0, 1)))

    def build_text(self, blocks: list[OCRTextBlock]) -> str:
        ordered = self.order_blocks(blocks)
        return "\n".join(block.text.strip() for block in ordered if block.text.strip())


text_block_builder = TextBlockBuilder()
