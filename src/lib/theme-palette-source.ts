export type PaletteSource = {
  id: string
  name: string
  colorsHexOrdered: string[] // hierarchy order exactly as provided by user
}

export const PALETTE_SOURCES: PaletteSource[] = [
  {
    id: "p1",
    name: "Palette 1",
    // original: #4A90E2 #8D6E63 #3B3B3B #D9BBAE #D9BBAE #F5F5F5
    // deduped consecutive duplicate while preserving order intent
    colorsHexOrdered: ["#4A90E2", "#8D6E63", "#3B3B3B", "#D9BBAE", "#F5F5F5"],
  },
  {
    id: "p2",
    name: "Palette 2",
    colorsHexOrdered: ["#B22222", "#8B4513", "#FF4500", "#A0522D", "#2E8B57"],
  },
  {
    id: "p3",
    name: "Palette 3",
    colorsHexOrdered: ["#4C8CFF", "#FF5733", "#33FF57", "#D9D9D9", "#000000"],
  },
  {
    id: "p4",
    name: "Palette 4",
    colorsHexOrdered: ["#5B5C56", "#A7A8AA", "#4D9E6E", "#C8D9A8", "#2C2D31"],
  },
  {
    id: "p5",
    name: "Palette 5 (3-color)",
    colorsHexOrdered: ["#8B4513", "#C2B280", "#32CD32"],
  },
  {
    id: "p6",
    name: "Palette 6",
    colorsHexOrdered: ["#FF5733", "#33FF57", "#3357FF", "#F9E8B1", "#3C3C3C"],
  },
  {
    id: "p7",
    name: "Palette 7",
    colorsHexOrdered: ["#2E8B57", "#4DAF7C", "#A7D3E0", "#D3E8E0", "#1F3A30"],
  },
]
