export const formatDate = (value: string) => {
  const [, month, day] = value.split("T")[0].split("-");

  return `${day}/${month}`;
};

export const formatDateFull = (value: string) => {
  const [year, month, day] = value.split("T")[0].split("-");

  return `${day}/${month}/${year}`;
};

export const formatHour = (value: string) => {
  return new Date(value).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};
