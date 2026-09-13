const request = require("supertest");

const app = require("../app");
const db = require("../../db");

const cleanupDatabase = require("./helpers/cleanup");

async function registerUser(name, email) {
  const response = await request(app).post("/api/auth/register").send({
    name,
    email,
    password: "password123",
  });

  expect(response.statusCode).toBe(201);

  return response.headers["set-cookie"];
}

async function createProject(cookie) {
  const response = await request(app)
    .post("/api/projects")
    .set("Cookie", cookie)
    .send({
      name: "Test Project",
      description: "Test description",
    });

  expect(response.statusCode).toBe(201);

  return response.body.projectId;
}

async function addMember(cookie, projectId, username) {
  const response = await request(app)
    .post(`/api/projects/${projectId}/members`)
    .set("Cookie", cookie)
    .send({
      username,
    });

  expect(response.statusCode).toBe(201);
}

async function changeMemberRole(cookie, projectId, username) {
  const [users] = await db.query("SELECT id FROM users WHERE username = ?", [
    username,
  ]);

  const userId = users[0].id;

  const response = await request(app)
    .patch(`/api/projects/${projectId}/members/${userId}/role`)
    .set("Cookie", cookie);

  expect(response.statusCode).toBe(200);
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

beforeEach(async () => {
  await cleanupDatabase();
});

afterAll(async () => {
  await db.end();
});

describe("Boards", () => {
  // ======================================================
  // CRIAR
  // ======================================================

  test("deve permitir que o dono crie um quadro", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const projectId = await createProject(ownerCookie);

    const response = await request(app)
      .post(`/api/projects/${projectId}/boards`)
      .set("Cookie", ownerCookie)
      .send({
        name: "Test Board",
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe("SUCCESS");
    expect(response.body.boardId).toBeDefined();

    const [boards] = await db.query(
      `
      SELECT id, project_id, name, position
      FROM boards
      WHERE id = ?
      `,
      [response.body.boardId],
    );

    expect(boards).toHaveLength(1);
    expect(boards[0].project_id).toBe(projectId);
    expect(boards[0].name).toBe("Test Board");
    expect(boards[0].position).toBe(0);
  });

  test("deve permitir que um admin crie um quadro", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const adminCookie = await registerUser("Admin", "admin@example.com");

    const projectId = await createProject(ownerCookie);

    await addMember(ownerCookie, projectId, "Admin");

    await changeMemberRole(ownerCookie, projectId, "Admin");

    const response = await request(app)
      .post(`/api/projects/${projectId}/boards`)
      .set("Cookie", adminCookie)
      .send({
        name: "Admin Board",
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe("SUCCESS");
  });

  test("deve impedir que um membro crie um quadro", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const memberCookie = await registerUser("Member", "member@example.com");

    const projectId = await createProject(ownerCookie);

    await addMember(ownerCookie, projectId, "Member");

    const response = await request(app)
      .post(`/api/projects/${projectId}/boards`)
      .set("Cookie", memberCookie)
      .send({
        name: "Member Board",
      });

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("FORBIDDEN");
  });

  test("deve impedir que um usuário não membro crie um quadro", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const outsiderCookie = await registerUser(
      "Outsider",
      "outsider@example.com",
    );

    const projectId = await createProject(ownerCookie);

    const response = await request(app)
      .post(`/api/projects/${projectId}/boards`)
      .set("Cookie", outsiderCookie)
      .send({
        name: "Outsider Board",
      });

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("FORBIDDEN");
  });

  test("deve impedir que usuário não autenticado crie um quadro", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const projectId = await createProject(ownerCookie);

    const response = await request(app)
      .post(`/api/projects/${projectId}/boards`)
      .send({
        name: "Unauthorized Board",
      });

    expect(response.statusCode).toBe(401);
  });

  // ======================================================
  // DELETAR
  // ======================================================

  test("deve permitir que o dono delete um quadro", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const projectId = await createProject(ownerCookie);

    const boardId = await createBoard(ownerCookie, projectId);

    const response = await request(app)
      .delete(`/api/boards/${boardId}`)
      .set("Cookie", ownerCookie);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("SUCCESS");

    const [boards] = await db.query("SELECT id FROM boards WHERE id = ?", [
      boardId,
    ]);

    expect(boards).toHaveLength(0);
  });

  test("deve permitir que um admin delete um quadro", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const adminCookie = await registerUser("Admin", "admin@example.com");

    const projectId = await createProject(ownerCookie);

    await addMember(ownerCookie, projectId, "Admin");

    await changeMemberRole(ownerCookie, projectId, "Admin");

    const boardId = await createBoard(ownerCookie, projectId);

    const response = await request(app)
      .delete(`/api/boards/${boardId}`)
      .set("Cookie", adminCookie);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("SUCCESS");

    const [boards] = await db.query("SELECT id FROM boards WHERE id = ?", [
      boardId,
    ]);

    expect(boards).toHaveLength(0);
  });

  test("deve impedir que um membro delete um quadro", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const memberCookie = await registerUser("Member", "member@example.com");

    const projectId = await createProject(ownerCookie);

    await addMember(ownerCookie, projectId, "Member");

    const boardId = await createBoard(ownerCookie, projectId);

    const response = await request(app)
      .delete(`/api/boards/${boardId}`)
      .set("Cookie", memberCookie);

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("FORBIDDEN");
  });

  test("deve impedir que um usuário não membro delete um quadro", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const outsiderCookie = await registerUser(
      "Outsider",
      "outsider@example.com",
    );

    const projectId = await createProject(ownerCookie);

    const boardId = await createBoard(ownerCookie, projectId);

    const response = await request(app)
      .delete(`/api/boards/${boardId}`)
      .set("Cookie", outsiderCookie);

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("FORBIDDEN");
  });

  test("deve impedir que usuário não autenticado delete um quadro", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const projectId = await createProject(ownerCookie);

    const boardId = await createBoard(ownerCookie, projectId);

    const response = await request(app).delete(`/api/boards/${boardId}`);

    expect(response.statusCode).toBe(401);
  });
});
