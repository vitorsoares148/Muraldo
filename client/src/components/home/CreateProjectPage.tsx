import { useState } from "react";
import { GrReturn } from "react-icons/gr";
import { MdLeaderboard } from "react-icons/md";
import { cn } from "../../utils/cn";

import InputInfo from "../login/InputInfo";
import { createProject } from "../../services/projects.service";

type CreateProjectPageProps = {
  setCreating: React.Dispatch<React.SetStateAction<boolean>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function CreateProjectPage({
  setCreating,
  setLoading,
}: CreateProjectPageProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState(false);
  const [descError, setDescError] = useState(false);

  function validateProject() {
    if (name.trim().length === 0) {
      setNameError(true);
      return false;
    }

    if (description.trim().length === 0) {
      setDescError(true);
      return false;
    }

    return true;
  }

  async function handleCreatePage() {
    if (!validateProject()) {
      return;
    }

    try {
      setLoading(true);
      const result = await createProject(name, description);

      if (result.message !== "SUCCESS") {
        return;
      }

      setCreating(false);
    } catch (error) {
      console.error("Create project error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-155 w-full rotate-1 flex-col items-center justify-center gap-4 pb-6">
      <button
        onClick={() => {
          setLoading(true);
          setCreating(false);
        }}
      >
        <GrReturn className="absolute top-5 left-5 h-15 w-15 cursor-pointer rounded-xl border-5 border-black transition-all duration-200 hover:bg-black hover:text-[#FFF4DE]" />
      </button>

      <MdLeaderboard className="mb-4 h-45 w-45 rounded-sm border-5 text-black" />

      <div>
        <InputInfo
          value={name}
          onChange={setName}
          onErrorReset={() => setNameError(false)}
          placeholder="Nome"
          className="w-120"
          type={"text"}
          error={nameError}
          maxLength={40}
        />

        {nameError && (
          <div className="mt-1 text-center font-semibold text-red-500">
            Campo Obrigatório.
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <InputInfo
            value={description}
            onChange={setDescription}
            onErrorReset={() => setDescError(false)}
            placeholder="Descrição"
            className="w-120"
            type={"text"}
            maxLength={200}
            error={descError}
          />

          {descError && (
            <div className="mt-1 text-center font-semibold text-red-500">
              Campo Obrigatório.
            </div>
          )}

          <div className="absolute top-3.5 -right-24 w-22 text-start text-xl font-bold">
            {description.length}/200
          </div>
        </div>
      </div>

      <button
        className={cn(
          "absolute bottom-11 cursor-pointer rounded-xl",
          "p-2 px-10",
          "text-2xl font-bold",
          "border-5 hover:border-black hover:bg-black hover:text-[#FFF4DE]",
          "transition-all duration-200",
        )}
        onClick={handleCreatePage}
      >
        Criar
      </button>
    </div>
  );
}
