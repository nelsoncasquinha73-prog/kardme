export type InfoDetailsBlockType = {
  type: "info_details";
  title?: string;
  layout?: "list" | "soft-cards";
  density?: "compact" | "normal";
  items: InfoItem[];
};

type InfoItem = {
  id: string;
  kind:
    | "text"
    | "keyValue"
    | "link"
    | "address"
    | "hours"
    | "wifi"
    | "highlights";
  icon?: string;
  label?: string;
  value?: string;
  note?: string;
  action?: {
    type: "copy" | "link" | "scroll";
    label?: string;
    value?: string;
  };
  data?: any;
};
