type IpoStatus = "approved" | "collecting" | "upcoming" | "completed" | "trading" | "postponed";

type IpoRow = {
  id: string;
  slug: string;
  company_name: string;
  ticker: string | null;
  status: IpoStatus;
  price: number | null;
  source_payload: Record<string, unknown>;
};

type CommentRow = {
  id: string;
  ipo_id: string;
  user_id: string;
  body: string;
  moderation_status: "pending" | "approved" | "rejected";
};

const exampleIpo: IpoRow = {
  id: "00000000-0000-0000-0000-000000000000",
  slug: "ornek",
  company_name: "Örnek",
  ticker: null,
  status: "approved",
  price: null,
  source_payload: {},
};

const exampleComment: CommentRow = {
  id: "00000000-0000-0000-0000-000000000000",
  ipo_id: exampleIpo.id,
  user_id: "00000000-0000-0000-0000-000000000000",
  body: "Kaynaklı değerlendirme",
  moderation_status: "pending",
};

void exampleComment;
export {};
