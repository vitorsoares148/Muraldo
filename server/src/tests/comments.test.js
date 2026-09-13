const request = require("supertest");

const app = require("../app");
const db = require("../../db");

const cleanupDatabase = require("./helpers/cleanup");

// ======================================================
// HELPERS
// ======================================================

async function registerUser(name, email) {
  const response = await request(app).post("/api/auth/register").send({
    name,
    email,
    password: "password123",
  });

  expect(response.statusCode).toBe(201);

  return response.headers["set-cookie"];
}

async function createProject(cookie, name = "Test Project") {
  const response = await request(app)
    .post("/api/projects")
    .set("Cookie", cookie)
    .send({
      name,
      description: "Test description",
    });

  expect(response.statusCode).toBe(201);

  return response.body.projectId;
}

async function createBoard(cookie, projectId, name = "Test Board") {
  const response = await request(app)
    .post(`/api/projects/${projectId}/boards`)
    .set("Cookie", cookie)
    .send({
      name,
    });

  expect(response.statusCode).toBe(201);

  return response.body.boardId;
}

async function createColumn(cookie, boardId, name = "Test Column") {
  const response = await request(app)
    .post(`/api/boards/${boardId}/columns`)
    .set("Cookie", cookie)
    .send({
      name,
    });

  expect(response.statusCode).toBe(201);

  return response.body.columnId;
}

async function createTask(
  cookie,
  columnId,
  {
    description = "Test description",
    priority = "medium",
    dueDate = null,
  } = {},
) {
  const response = await request(app)
    .post(`/api/columns/${columnId}/tasks`)
    .set("Cookie", cookie)
    .send({
      description,
      priority,
      dueDate,
    });

  expect(response.statusCode).toBe(201);

  return response.body.taskId;
}

async function addMember(cookie, projectId, username) {
  const response = await request(app)
    .post(`/api/projects/${projectId}/members`)
    .set("Cookie", cookie)
    .send({
      username,
    });

  expect(response.statusCode).toBe(201);

  return response;
}

async function getUserId(name) {
  const [users] = await db.query(
    `
    SELECT id
    FROM users
    WHERE username = ?
    `,
    [name],
  );

  return users[0].id;
}

async function createComment(cookie, taskId, content) {
  return request(app)
    .post(`/api/tasks/${taskId}/comments`)
    .set("Cookie", cookie)
    .send({
      content,
    });
}

async function getComments(cookie, taskId) {
  return request(app)
    .get(`/api/tasks/${taskId}/comments`)
    .set("Cookie", cookie);
}

async function deleteComment(cookie, commentId) {
  return request(app)
    .delete(`/api/comments/${commentId}`)
    .set("Cookie", cookie);
}

async function getCommentsFromDatabase(taskId) {
  const [comments] = await db.query(
    `
    SELECT
      id,
      task_id,
      user_id,
      content
    FROM comments
    WHERE task_id = ?
    ORDER BY id ASC
    `,
    [taskId],
  );

  return comments;
}

async function getComment(commentId) {
  const [comments] = await db.query(
    `
    SELECT
      id,
      task_id,
      user_id,
      content
    FROM comments
    WHERE id = ?
    `,
    [commentId],
  );

  return comments[0];
}

async function giveAdminPermission(cookie, projectId, username) {
  const userId = await getUserId(username);

  const response = await request(app)
    .patch(`/api/projects/${projectId}/members/${userId}/role`)
    .set("Cookie", cookie);

  expect(response.statusCode).toBe(200);
  expect(response.body.role).toBe("admin");

  return response;
}

// ======================================================
// SETUP
// ======================================================

beforeEach(cleanupDatabase);

afterAll(async () => {
  await db.end();
});

// ======================================================
// CRIAR COMENTÁRIO
// ======================================================

describe("Comments - Create", () => {
  test("deve criar um comentário como membro do projeto", async () => {
    const cookie = await registerUser(
      "Comment Creator",
      "commentcreator@example.com",
    );

    const projectId = await createProject(cookie);
    const boardId = await createBoard(cookie, projectId);
    const columnId = await createColumn(cookie, boardId);
    const taskId = await createTask(cookie, columnId);
    const userId = await getUserId("Comment Creator");

    const response = await createComment(cookie, taskId, "Test comment");

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual({
      comment: {
        content: "Test comment",
        created_at: expect.any(String),
        id: expect.any(Number),
        task_id: taskId,
        user_id: userId,
      },
      message: "SUCCESS",
    });

    const comments = await getCommentsFromDatabase(taskId);

    expect(comments).toHaveLength(1);
    expect(comments[0].task_id).toBe(taskId);
    expect(comments[0].content).toBe("Test comment");
  });

  test("deve rejeitar criação de comentário sem autenticação", async () => {
    const response = await request(app).post("/api/tasks/1/comments").send({
      content: "Test comment",
    });

    expect(response.statusCode).toBe(401);
  });

  test("deve rejeitar criação de comentário por usuário que não pertence ao projeto", async () => {
    const ownerCookie = await registerUser(
      "Create Comment Owner",
      "createcommentowner@example.com",
    );

    const outsiderCookie = await registerUser(
      "Create Comment Outsider",
      "createcommentoutsider@example.com",
    );

    const projectId = await createProject(ownerCookie);
    const boardId = await createBoard(ownerCookie, projectId);
    const columnId = await createColumn(ownerCookie, boardId);
    const taskId = await createTask(ownerCookie, columnId);

    const response = await createComment(
      outsiderCookie,
      taskId,
      "Unauthorized comment",
    );

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("FORBIDDEN");
  });

  test("deve rejeitar criação de comentário em tarefa inexistente", async () => {
    const cookie = await registerUser(
      "Missing Comment Task",
      "missingcommenttask@example.com",
    );

    const response = await createComment(cookie, 999999, "Test comment");

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("TASK_NOT_FOUND");
  });

  test("deve rejeitar comentário sem conteúdo", async () => {
    const cookie = await registerUser(
      "Empty Comment User",
      "emptycomment@example.com",
    );

    const projectId = await createProject(cookie);
    const boardId = await createBoard(cookie, projectId);
    const columnId = await createColumn(cookie, boardId);
    const taskId = await createTask(cookie, columnId);

    const response = await createComment(cookie, taskId, "");

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("INVALID_COMMENT_CONTENT");
  });

  test("deve rejeitar comentário com conteúdo muito grande", async () => {
    const cookie = await registerUser(
      "Large Comment User",
      "largecomment@example.com",
    );

    const projectId = await createProject(cookie);
    const boardId = await createBoard(cookie, projectId);
    const columnId = await createColumn(cookie, boardId);
    const taskId = await createTask(cookie, columnId);

    const content = "a".repeat(1001);

    const response = await createComment(cookie, taskId, content);

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("INVALID_COMMENT_CONTENT");
  });
});

// ======================================================
// CONSEGUIR COMENTÁRIOS
// ======================================================

describe("Comments - Get", () => {
  test("deve retornar os comentários da tarefa para um membro", async () => {
    const ownerCookie = await registerUser(
      "Get Comment Owner",
      "getcommentowner@example.com",
    );

    const memberCookie = await registerUser(
      "Get Comment Member",
      "getcommentmember@example.com",
    );

    const projectId = await createProject(ownerCookie);
    const boardId = await createBoard(ownerCookie, projectId);
    const columnId = await createColumn(ownerCookie, boardId);
    const taskId = await createTask(ownerCookie, columnId);

    await addMember(ownerCookie, projectId, "Get Comment Member");

    await createComment(ownerCookie, taskId, "First comment");

    await createComment(memberCookie, taskId, "Second comment");

    const response = await getComments(memberCookie, taskId);

    expect(response.statusCode).toBe(200);

    expect(response.body.message).toBe("SUCCESS");
    expect(response.body.comments).toHaveLength(2);

    expect(response.body.comments[0].content).toBe("First comment");

    expect(response.body.comments[1].content).toBe("Second comment");
  });

  test("deve retornar lista vazia quando a tarefa não possui comentários", async () => {
    const cookie = await registerUser(
      "Empty Comments User",
      "emptycomments@example.com",
    );

    const projectId = await createProject(cookie);
    const boardId = await createBoard(cookie, projectId);
    const columnId = await createColumn(cookie, boardId);
    const taskId = await createTask(cookie, columnId);

    const response = await getComments(cookie, taskId);

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual({
      message: "SUCCESS",
      comments: [],
    });
  });

  test("deve rejeitar acesso de usuário que não pertence ao projeto", async () => {
    const ownerCookie = await registerUser(
      "Get Access Comment Owner",
      "getaccesscommentowner@example.com",
    );

    const outsiderCookie = await registerUser(
      "Get Access Comment Outsider",
      "getaccesscommentoutsider@example.com",
    );

    const projectId = await createProject(ownerCookie);
    const boardId = await createBoard(ownerCookie, projectId);
    const columnId = await createColumn(ownerCookie, boardId);
    const taskId = await createTask(ownerCookie, columnId);

    const response = await getComments(outsiderCookie, taskId);

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("FORBIDDEN");
  });

  test("deve rejeitar busca de comentários de tarefa inexistente", async () => {
    const cookie = await registerUser(
      "Missing Get Comment Task",
      "missinggetcommenttask@example.com",
    );

    const response = await getComments(cookie, 999999);

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("TASK_NOT_FOUND");
  });

  test("deve rejeitar busca de comentários sem autenticação", async () => {
    const response = await request(app).get("/api/tasks/1/comments");

    expect(response.statusCode).toBe(401);
  });
});

// ======================================================
// DELETAR COMENTÁRIO
// ======================================================

describe("Comments - Delete", () => {
  test("deve permitir que um membro delete seu próprio comentário", async () => {
    const cookie = await registerUser(
      "Delete Comment Member",
      "deletecommentmember@example.com",
    );

    const projectId = await createProject(cookie);
    const boardId = await createBoard(cookie, projectId);
    const columnId = await createColumn(cookie, boardId);
    const taskId = await createTask(cookie, columnId);

    await createComment(cookie, taskId, "My comment");

    const comments = await getCommentsFromDatabase(taskId);

    expect(comments).toHaveLength(1);

    const commentId = comments[0].id;

    const response = await deleteComment(cookie, commentId);

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual({
      message: "SUCCESS",
    });

    const comment = await getComment(commentId);

    expect(comment).toBeUndefined();
  });

  test("deve rejeitar exclusão por usuário que não pertence ao projeto", async () => {
    const ownerCookie = await registerUser(
      "Delete Comment Owner",
      "deletecommentowner@example.com",
    );

    const outsiderCookie = await registerUser(
      "Delete Comment Outsider",
      "deletecommentoutsider@example.com",
    );

    const projectId = await createProject(ownerCookie);
    const boardId = await createBoard(ownerCookie, projectId);
    const columnId = await createColumn(ownerCookie, boardId);
    const taskId = await createTask(ownerCookie, columnId);

    await createComment(ownerCookie, taskId, "Owner comment");

    const comments = await getCommentsFromDatabase(taskId);
    const commentId = comments[0].id;

    const response = await deleteComment(outsiderCookie, commentId);

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("FORBIDDEN");

    const comment = await getComment(commentId);

    expect(comment).toBeDefined();
  });

  test("deve rejeitar exclusão de comentário de outro membro", async () => {
    const ownerCookie = await registerUser(
      "Delete Other Owner",
      "deleteotherowner@example.com",
    );

    const memberCookie = await registerUser(
      "Delete Other Member",
      "deleteothermember@example.com",
    );

    const otherMemberCookie = await registerUser(
      "Delete Other Member Two",
      "deleteothermembertwo@example.com",
    );

    const projectId = await createProject(ownerCookie);
    const boardId = await createBoard(ownerCookie, projectId);
    const columnId = await createColumn(ownerCookie, boardId);
    const taskId = await createTask(ownerCookie, columnId);

    await addMember(ownerCookie, projectId, "Delete Other Member");

    await addMember(ownerCookie, projectId, "Delete Other Member Two");

    await createComment(otherMemberCookie, taskId, "Other member comment");

    const comments = await getCommentsFromDatabase(taskId);
    const commentId = comments[0].id;

    const response = await deleteComment(memberCookie, commentId);

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("NOT_AUTHORIZED");

    const comment = await getComment(commentId);

    expect(comment).toBeDefined();
  });

  test("deve permitir que um admin delete comentário de outro membro", async () => {
    const ownerCookie = await registerUser(
      "Admin Comment Owner",
      "admincommentowner@example.com",
    );

    const memberCookie = await registerUser(
      "Admin Comment Member",
      "admincommentmember@example.com",
    );

    const adminCookie = await registerUser(
      "Admin Comment Admin",
      "admincommentadmin@example.com",
    );

    const projectId = await createProject(ownerCookie);
    const boardId = await createBoard(ownerCookie, projectId);
    const columnId = await createColumn(ownerCookie, boardId);
    const taskId = await createTask(ownerCookie, columnId);

    await addMember(ownerCookie, projectId, "Admin Comment Member");

    await addMember(ownerCookie, projectId, "Admin Comment Admin");

    await giveAdminPermission(ownerCookie, projectId, "Admin Comment Admin");

    await createComment(memberCookie, taskId, "Member comment");

    const comments = await getCommentsFromDatabase(taskId);
    const commentId = comments[0].id;

    const response = await deleteComment(adminCookie, commentId);

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual({
      message: "SUCCESS",
    });

    const comment = await getComment(commentId);

    expect(comment).toBeUndefined();
  });

  test("deve permitir que o owner delete comentário de outro membro", async () => {
    const ownerCookie = await registerUser(
      "Owner Delete Comment",
      "ownerdeletecomment@example.com",
    );

    const memberCookie = await registerUser(
      "Member Delete Comment",
      "memberdeletecomment@example.com",
    );

    const projectId = await createProject(ownerCookie);
    const boardId = await createBoard(ownerCookie, projectId);
    const columnId = await createColumn(ownerCookie, boardId);
    const taskId = await createTask(ownerCookie, columnId);

    await addMember(ownerCookie, projectId, "Member Delete Comment");

    await createComment(memberCookie, taskId, "Member comment");

    const comments = await getCommentsFromDatabase(taskId);
    const commentId = comments[0].id;

    const response = await deleteComment(ownerCookie, commentId);

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual({
      message: "SUCCESS",
    });

    const comment = await getComment(commentId);

    expect(comment).toBeUndefined();
  });

  test("deve rejeitar exclusão de comentário inexistente", async () => {
    const cookie = await registerUser(
      "Missing Comment Delete",
      "missingcommentdelete@example.com",
    );

    const response = await deleteComment(cookie, 999999);

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("COMMENT_NOT_FOUND");
  });

  test("deve rejeitar exclusão de comentário sem autenticação", async () => {
    const response = await request(app).delete("/api/comments/999999");

    expect(response.statusCode).toBe(401);
  });
});
