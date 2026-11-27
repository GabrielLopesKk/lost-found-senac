import {
  Backpack,
  CupSoda,
  Glasses,
  IdCard,
  KeyRound,
  NotebookPen,
  Package,
  Shirt,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  eletronicos: Smartphone,
  documentos: IdCard,
  chaves: KeyRound,
  garrafas: CupSoda,
  roupas: Shirt,
  bolsas: Backpack,
  material: NotebookPen,
  acessorios: Glasses,
  outros: Package,
};
