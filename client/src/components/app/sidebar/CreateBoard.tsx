import { useEffect, useRef, useState } from "react";
import { IoMdArrowRoundForward } from "react-icons/io";

import { useProject } from "../../../contexts/ProjectContext";
import { createBoard } from "../../../services/board.service";
import { cn } from "../../../utils/cn";

import InputInfo from "../../login/InputInfo";

interface CreateBoardProps {
  projectIdNumber: number;
}

export default function CreateBoard({ projectIdNumber }: CreateBoardProps) {
  const createBoardRef = useRef<HTMLDivElement>(null);
  const { getProjectPage } = useProject();

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [showBoardInput, setShowBoardInput] = useState(false);
  const [focusInput, setFocusInput] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const handleClickOutsideCreateBoard = (event: MouseEvent) => {
      if (
        createBoardRef.current &&
        !createBoardRef.current.contains(event.target as Node)
      ) {
        setName("");
        setFocusInput(false);
        setNameError(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutsideCreateBoard);

    return () => {
      document.removeEventListener("mousedown", handleClickOutsideCreateBoard);
    };
  }, []);

  function validateName() {
    if (!name.trim()) {
      setNameError(true);
      return false;
    }

    return true;
  }

  async function handleCreateBoard() {
    if (creating || !validateName()) {
      return;
    }

    try {
      setCreating(true);
      const result = await createBoard(projectIdNumber, name);

      if (result.message !== "SUCCESS") {
        setNameError(true);
        return;
      }

      await getProjectPage(projectIdNumber);

      setName("");
      setFocusInput(false);
    } catch (error) {
      console.error("Create board error:", error);
    } finally {
      setCreating(false);
    }
  }

  if (showBoardInput || focusInput) {
    return (
      <div
        ref={createBoardRef}
        className="relative mt-4 mb-4 flex w-[95%] min-w-0 items-center"
        onPointerLeave={() => setShowBoardInput(false)}
        onClick={() => setFocusInput(true)}
      >
        <InputInfo
          value={name}
          onChange={setName}
          type="text"
          placeholder="Nome"
          onErrorReset={() => setNameError(false)}
          className={cn(
            "h-11.5 min-w-0 flex-1 rounded-r-none border-4 border-r-0",
            "p-3 text-[#FFF4DE] placeholder:text-[#FFF4DE]/50",
            !nameError && "border-[#FFF4DE]",
          )}
          maxLength={40}
          error={nameError}
        />

        <button onClick={() => handleCreateBoard()} disabled={creating}>
          <IoMdArrowRoundForward
            className={cn(
              "h-11.5 w-11.5 shrink-0 cursor-pointer rounded-r-xl border-4 border-[#FFF4DE]",
              "text-3xl text-[#FFF4DE] transition-colors duration-200",
              "hover:bg-[#FFF4DE] hover:text-[#28251e]",
              nameError && "border-red-500 text-red-500 hover:bg-red-500",
            )}
          />
        </button>

        {nameError && (
          <div className="absolute top-10 left-1/2 mt-2 w-full -translate-x-1/2 text-center font-semibold text-red-500">
            Inválido.
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onPointerEnter={() => setShowBoardInput(true)}
      className="mt-4 mb-4 w-[95%] cursor-pointer rounded-xl border-5 border-dashed p-1 text-center text-xl font-bold text-[#FFF4DE]/50 transition-colors duration-200"
    >
      Criar novo quadro
    </button>
  );
}
