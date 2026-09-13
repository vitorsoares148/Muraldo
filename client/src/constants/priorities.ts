export type PriorityLevel = "none" | "low" | "medium" | "high" | "urgent";

export type Priority = {
  level: PriorityLevel;
  label: string;
  pinColor: string;
  pageColor: string;
};

export const priorityConfig: Record<
  PriorityLevel,
  { label: string; pinColor: string; pageColor: string }
> = {
  none: {
    label: "Nenhuma",
    pinColor: "bg-gray-400",
    pageColor: "#FFF4DE",
  },
  low: {
    label: "Baixa",
    pinColor: "bg-green-500",
    pageColor: "#c3ffc1",
  },
  medium: {
    label: "Média",
    pinColor: "bg-yellow-500",
    pageColor: "#fffec1",
  },
  high: {
    label: "Alta",
    pinColor: "bg-red-500",
    pageColor: "#ffc1c1",
  },
  urgent: {
    label: "Urgente",
    pinColor: "bg-purple-500",
    pageColor: "#e5c1ff",
  },
};

export const PRIORITIES: Priority[] = Object.entries(priorityConfig).map(
  ([level, config]) => ({
    level: level as PriorityLevel,
    ...config,
  }),
);
