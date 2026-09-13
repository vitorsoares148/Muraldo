import { useEffect, useRef, useState } from "react";
import { IoMdArrowRoundForward } from "react-icons/io";

import { createColumn } from "../../api/columns.api";

import InputInfo from "../login/InputInfo";

import { cn } from "../../utils/cn";

export default function CreateColumn({
  boardIdNumber,
  setLoading,
  handleBoard,
}: {
  boardIdNumber: number;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  handleBoard: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [showColumnInput, setShowColumnInput] = useState(false);
  const [focusInput, setFocusInput] = useState(false);

  const columnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        columnRef.current &&
        !columnRef.current.contains(event.target as Node)
      ) {
        setFocusInput(false);
        setName("");
        setNameError(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function validateName() {
    if (name.trim().length === 0) {
      setNameError(true);
      return false;
    }

    return true;
  }

  async function handleCreateColumn() {
    if (!validateName()) {
      return;
    }

    try {
      setLoading(true);

      const result = await createColumn(boardIdNumber, name);

      if (result.message !== "SUCCESS") {
        setNameError(true);
        return;
      }

      setName("");
      setFocusInput(false);

      await handleBoard();
    } catch (error) {
      console.error("Create column error:", error);
      setLoading(false);
    }
  }

  if (showColumnInput || focusInput) {
    return (
      <div
        ref={columnRef}
        className="relative mx-5 mt-6.5 flex h-fit w-82.5 min-w-0 shrink-0 items-start"
        onPointerLeave={() => setShowColumnInput(false)}
        onPointerDown={() => setFocusInput(true)}
      >
        <InputInfo
          value={name}
          onChange={setName}
          type="text"
          placeholder="Nome"
          onErrorReset={() => setNameError(false)}
          className={cn(
            "h-14 min-w-0 flex-1 shrink-0 rounded-r-none border-5 border-r-0",
            "p-3 text-black placeholder:text-black/50",
            !nameError && "border-black",
          )}
          maxLength={20}
          error={nameError}
        />

        <button onClick={handleCreateColumn}>
          <IoMdArrowRoundForward
            className={cn(
              "h-14 w-14 shrink-0 cursor-pointer rounded-r-xl border-5 border-black",
              "text-3xl text-black transition-colors duration-200",
              nameError && "border-red-500 text-red-500 hover:bg-red-500",
            )}
          />
        </button>

        {nameError && (
          <div className="absolute top-10 left-1/2 mt-4 w-full -translate-x-1/2 text-center text-lg font-semibold text-red-500">
            Campo Obrigatório.
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onPointerEnter={() => setShowColumnInput(true)}
      className="mx-5 mt-6.5 flex h-14 w-82.5 shrink-0 flex-col items-center justify-center rounded-2xl border-5 border-dashed text-2xl font-bold text-black/50 select-none"
    >
      Criar Coluna
    </div>
  );
}
