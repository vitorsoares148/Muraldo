import { useEffect, useRef, useState } from "react";
import { FaCrown, FaUserLarge } from "react-icons/fa6";
import { RiPencilFill } from "react-icons/ri";
import { IoHammerSharp } from "react-icons/io5";
import { IoMdArrowRoundForward } from "react-icons/io";
import axios from "axios";

import LoadingComponent from "../generic/LoadingComponent";
import InputInfo from "../login/InputInfo";

import { useProject } from "../../contexts/ProjectContext";

import {
  addProjectMember,
  changeProjectMemberRole,
  removeProjectMember,
} from "../../services/projects.service";

import { cn } from "../../utils/cn";
import { MdRemoveCircleOutline } from "react-icons/md";

const ERROR_MEMBER = {
  NONE: 0,
  INVALID: 1,
  EXIST: 2,
  VALID: 3,
};

const nameMemberErrorMessages = {
  [ERROR_MEMBER.INVALID]: "Inválido.",
  [ERROR_MEMBER.EXIST]: "Usuário já existe.",
};

export default function MemberList({
  projectIdNumber,
  isOwner,
  handleProjectPage,
}: {
  projectIdNumber: number;
  isOwner: boolean;
  handleProjectPage: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [focusInput, setFocusInput] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState(ERROR_MEMBER.NONE);

  const { projectPage } = useProject();

  const memberListRef = useRef<HTMLDivElement>(null);

  const sortedMembers = [...(projectPage?.members ?? [])].sort((a, b) => {
    if (a.role !== b.role) {
      return a.role === "admin" ? -1 : 1;
    }

    return a.username.localeCompare(b.username);
  });

  useEffect(() => {
    const handleClickOutsideMemberList = (event: MouseEvent) => {
      if (
        memberListRef.current &&
        !memberListRef.current.contains(event.target as Node)
      ) {
        setFocusInput(false);
        setName("");
        setNameError(ERROR_MEMBER.NONE);
        setEditing(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutsideMemberList);

    return () => {
      document.removeEventListener("mousedown", handleClickOutsideMemberList);
    };
  }, []);

  function validateName(value: string) {
    if (value.length === 0) {
      return ERROR_MEMBER.INVALID;
    }

    if (value.length < 4 || value.length > 32) {
      return ERROR_MEMBER.INVALID;
    }

    if (/[^a-zA-Z0-9]/.test(value)) {
      return ERROR_MEMBER.INVALID;
    }

    return ERROR_MEMBER.VALID;
  }

  async function handleAddMember() {
    if (validateName(name) !== ERROR_MEMBER.VALID) {
      setNameError(ERROR_MEMBER.INVALID);
      return;
    }

    try {
      setLoading(true);
      const result = await addProjectMember(projectIdNumber, name);

      if (result.message !== "SUCCESS") {
        return;
      }

      await handleProjectPage();

      setName("");
      setFocusInput(false);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.data.error === "ALREADY_MEMBER") {
          setNameError(ERROR_MEMBER.EXIST);
        } else {
          setNameError(ERROR_MEMBER.INVALID);
        }
      }

      console.error("Add member error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveMember(userId: number) {
    try {
      setLoading(true);
      const result = await removeProjectMember(projectIdNumber, userId);

      if (result.message !== "SUCCESS") {
        return;
      }

      await handleProjectPage();

      setName("");
      setFocusInput(false);
    } catch (error) {
      console.error("Remove member error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleChangeMemberRole(userId: number) {
    try {
      setLoading(true);
      const result = await changeProjectMemberRole(projectIdNumber, userId);

      if (result.message !== "SUCCESS") {
        return;
      }

      await handleProjectPage();

      setName("");
      setFocusInput(false);
      setShowNameInput(false);
    } catch (error) {
      console.error("Change member role error:", error);
    } finally {
      setLoading(false);
    }
  }

  function MemberListErrorMessage({ message }: { message?: string }) {
    if (!message) return null;

    return (
      <div className="absolute top-10 left-1/2 w-full -translate-x-1/2 text-center font-semibold text-red-500">
        {message}
      </div>
    );
  }

  function hasError(error: number) {
    return error !== ERROR_MEMBER.NONE && error !== ERROR_MEMBER.VALID;
  }

  return (
    <div
      ref={memberListRef}
      className="flex h-fit w-fit max-w-60 min-w-45 flex-col"
    >
      <div className="mb-2 flex items-end justify-center gap-2 border-b-4 border-black p-1 text-center text-3xl font-bold">
        Membros
        {isOwner && (
          <button
            onClick={() => {
              setEditing((prev) => !prev);
              setFocusInput(false);
              setShowNameInput(false);
            }}
          >
            <RiPencilFill
              className={cn(
                "cursor-pointer rounded-xl p-1 text-4xl transition-all duration-200",
                "hover:bg-black hover:text-[#FFF4DE]",
                editing && "bg-black text-[#FFF4DE]",
              )}
            />
          </button>
        )}
      </div>
      {loading ? (
        <LoadingComponent />
      ) : (
        <div className="projects-container max-h-111 overflow-y-auto">
          <div className="flex items-center gap-1">
            <FaCrown className="text-2xl text-yellow-400 shrink-0" />

            <div className="truncate text-2xl">
              {projectPage?.owner?.username}
            </div>
          </div>

          <ul>
            {sortedMembers.map((member) => (
              <li key={member.id} className="relative flex items-center gap-1">
                {editing && isOwner && (
                  <div className="flex">
                    <button
                      className=""
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <MdRemoveCircleOutline className="cursor-pointer text-3xl text-black/25 transition-all duration-200 hover:text-red-500" />
                    </button>

                    <button
                      className=""
                      onClick={() => handleChangeMemberRole(member.id)}
                    >
                      <IoHammerSharp
                        className={cn(
                          "cursor-pointer text-3xl transition-all duration-200",
                          member.role === "admin"
                            ? "text-purple-500"
                            : "text-black/25 hover:text-black",
                        )}
                      />
                    </button>
                  </div>
                )}

                <FaUserLarge
                  className={cn(
                    "shrink-0 text-2xl",
                    member.role === "admin" && "text-purple-500",
                  )}
                />

                <div className="truncate text-2xl">{member.username}</div>
              </li>
            ))}
          </ul>

          {(editing && showNameInput) || focusInput ? (
            <div
              className="relative mt-2 flex min-w-0 items-center pb-8"
              onPointerLeave={() => setShowNameInput(false)}
              onPointerDown={() => setFocusInput(true)}
            >
              <InputInfo
                value={name}
                onChange={setName}
                type="text"
                placeholder="Nome"
                onErrorReset={() => setNameError(ERROR_MEMBER.NONE)}
                className="h-9.5 w-30 min-w-0 flex-1 rounded-r-none border-r-0 p-3"
                error={nameError !== ERROR_MEMBER.NONE}
                maxLength={32}
              />

              <button onClick={handleAddMember}>
                <IoMdArrowRoundForward
                  className={cn(
                    "h-9.5 w-9.5 shrink-0 cursor-pointer rounded-r-xl border-5 border-black",
                    "text-3xl text-black transition-all duration-200",
                    "hover:bg-black hover:text-[#FFF4DE]",
                    nameError !== ERROR_MEMBER.NONE &&
                      "border-red-500 text-red-500 hover:bg-red-500",
                  )}
                />
              </button>

              {hasError(nameError) && (
                <MemberListErrorMessage
                  message={nameMemberErrorMessages[nameError]}
                />
              )}
            </div>
          ) : (
            editing && (
              <button
                onPointerEnter={() => setShowNameInput(true)}
                className="mt-2 w-full rounded-xl border-5 border-dashed text-center text-xl font-semibold text-black/25 transition-all duration-200 hover:border-black hover:text-black"
              >
                Adicionar
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
