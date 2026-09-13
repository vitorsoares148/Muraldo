import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { FaTrashAlt } from "react-icons/fa";
import { IoMdArrowRoundForward } from "react-icons/io";

import { PRIORITIES, type PriorityLevel } from "../../constants/priorities";
import { useUser } from "../../contexts/UserContext";
import {
  createComment,
  deleteComment,
  getComments,
} from "../../services/comments.service";
import type { Comment, Task } from "../../types/projects";
import { formatDateFull, formatHour } from "../../utils/formatDate";
import { useCheckPermission } from "../../utils/getPermission";
import { cn } from "../../utils/cn";

import LoadingComponent from "../generic/LoadingComponent";
import InputInfo from "../login/InputInfo";

function isNewDay(currentDate: string, previousDate?: string) {
  if (!previousDate) {
    return true;
  }

  const current = new Date(currentDate);
  const previous = new Date(previousDate);

  return (
    current.getFullYear() !== previous.getFullYear() ||
    current.getMonth() !== previous.getMonth() ||
    current.getDate() !== previous.getDate()
  );
}

function getPriority(level: string) {
  return PRIORITIES.find(
    (priority) => priority.level === (level as PriorityLevel),
  );
}

export default function CommentComponent({
  task,
  setTask,
}: {
  task: Task | undefined;
  setTask: Dispatch<SetStateAction<Task | undefined>>;
}) {
  const [loading, setLoading] = useState(true);
  const [changeScroll, setChangeScroll] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [message, setMessage] = useState("");

  const commentRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLUListElement>(null);
  const isFirstRender = useRef(true);

  const { user } = useUser();
  const hasPermission = useCheckPermission();

  async function loadComments() {
    if (!task) {
      return;
    }

    try {
      const result = await getComments(task.id);

      if (result.message !== "SUCCESS") {
        return;
      }

      setComments(result.comments);
    } catch (error) {
      console.error("Get comments error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateComment() {
    if (!task || loading) {
      return;
    }

    try {
      setMessage("");

      const result = await createComment(task.id, message);

      if (result.message !== "SUCCESS") {
        return;
      }

      setComments((prevComments) => [...prevComments, result.comment]);
      setChangeScroll(true);
    } catch (error) {
      console.error("Create comment error:", error);
    }
  }

  async function handleDeleteComment(id: number) {
    if (!task) {
      return;
    }

    try {
      const result = await deleteComment(id);

      if (result.message !== "SUCCESS") {
        return;
      }

      setComments((prevComments) =>
        prevComments.filter((comment) => comment.id !== id),
      );
    } catch (error) {
      console.error("Delete comment error:", error);
    }
  }

  useEffect(() => {
    if (comments.length === 0) {
      return;
    }

    if (isFirstRender.current || changeScroll) {
      messagesRef.current?.scrollTo({
        top: messagesRef.current.scrollHeight,
      });

      isFirstRender.current = false;
      setChangeScroll(false);
    }
  }, [comments, changeScroll]);

  useEffect(() => {
    loadComments();
  }, [task]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        commentRef.current &&
        !commentRef.current.contains(event.target as Node)
      ) {
        setLoading(true);
        setTask(undefined);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={commentRef}
      className={cn(
        "absolute top-1/2 left-1/2 z-3 h-fit -translate-x-1/2 -translate-y-1/2 items-center overflow-hidden bg-[#FFF4DE] p-4",
        "flex w-[90%] max-w-201 flex-col rounded-sm border-5 border-black/25",
      )}
    >
      <div className="font-shadows w-full border-b-5 p-4 text-2xl font-bold text-black">
        <div className="projects-container mb-4 max-h-40 overflow-y-auto wrap-break-word">
          "{task?.description}"
        </div>

        {task?.assigned_to && (
          <div className="w-full truncate">
            Responsável: {task.assigned_username}
          </div>
        )}

        {task?.priority && (
          <div className="w-full truncate">
            Prioridade: {getPriority(task.priority)?.label}
          </div>
        )}

        <div className="flex flex-col justify-between sm:flex-row">
          {task?.due_date && (
            <div className="w-full truncate">
              Prazo: {formatDateFull(task.due_date)}
            </div>
          )}

          {task?.finish_date && (
            <div className="w-full truncate">
              Finalizado: {formatDateFull(task.finish_date)}
            </div>
          )}
        </div>
      </div>

      <LoadingComponent
        className={cn(loading ? "visible h-105" : "invisible h-0")}
      />

      <div className="relative flex h-full w-full flex-col">
        <div
          className={cn(
            "font-shadows invisible mt-4 h-0 w-full text-center text-xl font-bold text-black/50",
            !loading && comments.length === 0 && "visible h-105",
          )}
        >
          Nenhum comentário encontrado...
        </div>

        <ul
          ref={messagesRef}
          className={cn(
            "projects-container mt-2 flex flex-col gap-3 overflow-y-auto px-2",
            loading || comments.length === 0
              ? "invisible h-0"
              : "visible h-105",
          )}
        >
          {comments.map((comment, index) => {
            const previousComment = comments[index - 1];

            const showDate = isNewDay(
              comment.created_at,
              previousComment?.created_at,
            );

            const isOwner = comment.user_id === user?.id;

            return (
              <li key={comment.id}>
                {showDate && (
                  <div className="my-2 flex items-center gap-2 font-semibold">
                    <div className="h-0.5 flex-1 bg-black/50" />
                    <span className="font-shadows">
                      {new Date(comment.created_at).toLocaleDateString("pt-BR")}
                    </span>
                    <div className="h-0.5 flex-1 bg-black/50" />
                  </div>
                )}

                <div
                  className={cn(
                    "font-shadows relative rounded-xl p-3 overflow-hidden",
                    isOwner
                      ? "ml-42 bg-green-300/50"
                      : "mr-42 bg-yellow-300/35",
                  )}
                >
                  {(isOwner || hasPermission) && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="absolute top-4 right-4"
                    >
                      <FaTrashAlt className="h-5 w-5 transition duration-200 hover:cursor-pointer hover:text-red-500" />
                    </button>
                  )}

                  {!isOwner && (
                    <div className="w-fit text-2xl font-bold">
                      {comment.comment_username}
                    </div>
                  )}

                  <div className="w-full pr-5 text-xl wrap-break-word">
                    {comment.content}
                  </div>

                  <div className="w-full text-right font-semibold">
                    {formatHour(comment.created_at)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="bottom-0 mt-2 flex w-full">
          <InputInfo
            value={message}
            onChange={setMessage}
            type="text"
            placeholder="Digite sua mensagem aqui..."
            className={cn(
              "h-14 min-w-0 flex-1 shrink-0 rounded-r-none border-5 border-r-0",
              "p-3 text-black",
            )}
            maxLength={800}
          />

          <button
            className="group"
            disabled={message.length === 0}
            onClick={handleCreateComment}
          >
            <IoMdArrowRoundForward
              className={cn(
                "h-14 w-14 shrink-0 rounded-r-xl border-5 border-black",
                "text-3xl text-black transition-colors duration-200",
                "group-enabled:cursor-pointer group-enabled:hover:bg-black group-enabled:hover:text-[#FFF4DE]",
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
