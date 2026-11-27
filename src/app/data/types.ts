export type Item = {
  id: string;
  ref: string;
  name: string;
  category: string;
  color: string;
  location: string;
  dateFound: string;
  description: string;
  marks: string[];
  status: string;
  sensitive: boolean;
  hidden: boolean;
  photo: string | null;
  photoHidden: boolean;
  createdAt: string;
  autoHidden?: boolean;
  claimCount?: number;
};

export type Report = {
  id: string;
  ref: string;
  name: string;
  category: string;
  color: string;
  location: string;
  dateLost: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  photo: string | null;
  open: boolean;
  createdAt: string;
};

export type Claim = {
  id: string;
  ref: string;
  itemId: string;
  itemRef?: string;
  itemName?: string;
  itemCategory?: string;
  itemStatus?: string;
  name?: string | undefined;
  contactEmail?: string | undefined;
  contactPhone?: string | undefined;
  proof: string;
  status: string;
  codeUsed?: boolean;
  hasCode?: boolean;
  codeIssuedAt?: string | null;
  decidedAt?: string | null;
  pickedUpAt?: string | null;
  createdAt: string;
  item?: Item | undefined;
};

export type Profile = {
  id: string;
  fullName: string;
  phone: string;
  role: "staff" | "user";
};

export type Match = {
  item: Item;
  score: number;
  reasons: string[];
};

export type AdminOverview = {
  items: Item[];
  claims: Claim[];
  reports: Report[];
  matches: { report: Report; matches: Match[] }[];
};

export type PickupCodeResult = {
  itemRef: string;
  itemName: string;
  claimant: string;
};

export type CreateLostReportResult = {
  id: string;
  ref: string;
  matches: Match[];
  matchesError: boolean;
};
