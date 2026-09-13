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
  const [users] = await db.query(
    `
    SELECT id
    FROM users
    WHERE username = ?
    `,
    [username],
  );

  const userId = users[0].id;

  const response = await request(app)
    .patch(`/api/projects/${projectId}/members/${userId}/role`)
    .set("Cookie", cookie);

  expect(response.statusCode).toBe(200);
}

async function createBoard(cookie, projectId) {
  const response = await request(app)
    .post(`/api/projects/${projectId}/boards`)
    .set("Cookie", cookie)
    .send({
      name: "Test Board",
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

// ======================================================
// CLEANUP
// ======================================================

beforeEach(async () => {
  await cleanupDatabase();
});

afterAll(async () => {
  await cleanupDatabase();
  await db.end();
});

// ======================================================
// TESTES
// ======================================================

describe("Columns", () => {
  // ======================================================
  // CRIAR
  // ======================================================

  test("deve permitir que o dono crie uma coluna", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const projectId = await createProject(ownerCookie);
    const boardId = await createBoard(ownerCookie, projectId);

    const response = await request(app)
      .post(`/api/boards/${boardId}/columns`)
      .set("Cookie", ownerCookie)
      .send({
        name: "Test Column",
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe("SUCCESS");
    expect(response.body.columnId).toBeDefined();

    const [columns] = await db.query(
      `
      SELECT id, board_id, name, position
      FROM columns
      WHERE id = ?
      `,
      [response.body.columnId],
    );

    expect(columns).toHaveLength(1);
    expect(columns[0].board_id).toBe(boardId);
    expect(columns[0].name).toBe("Test Column");
    expect(columns[0].position).toBe(0);
  });

  test("deve permitir que um admin crie uma coluna", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const adminCookie = await registerUser("Admin", "admin@example.com");

    const projectId = await createProject(ownerCookie);
    const boardId = await createBoard(ownerCookie, projectId);

    await addMember(ownerCookie, projectId, "Admin");

    await changeMemberRole(ownerCookie, projectId, "Admin");

    const response = await request(app)
      .post(`/api/boards/${boardId}/columns`)
      .set("Cookie", adminCookie)
      .send({
        name: "Admin Column",
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe("SUCCESS");
    expect(response.body.columnId).toBeDefined();
  });

  test("deve impedir que um usuário não autenticado crie uma coluna", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const projectId = await createProject(ownerCookie);
    const boardId = await createBoard(ownerCookie, projectId);

    const response = await request(app)
      .post(`/api/boards/${boardId}/columns`)
      .send({
        name: "Unauthorized Column",
      });

    expect(response.statusCode).toBe(401);
  });

  // ======================================================
  // CONSEGUIR
  // ======================================================

  test("deve permitir que um membro consiga as colunas do quadro", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const memberCookie = await registerUser("Member", "member@example.com");

    const projectId = await createProject(ownerCookie);
    const boardId = await createBoard(ownerCookie, projectId);

    await addMember(ownerCookie, projectId, "Member");

    await createColumn(ownerCookie, boardId, "Column A");

    await createColumn(ownerCookie, boardId, "Column B");

    const response = await request(app)
      .get(`/api/boards/${boardId}/columns`)
      .set("Cookie", memberCookie);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("SUCCESS");

    expect(response.body.columns).toHaveLength(2);

    expect(response.body.columns[0].name).toBe("Column A");
    expect(response.body.columns[0].position).toBe(0);

    expect(response.body.columns[1].name).toBe("Column B");
    expect(response.body.columns[1].position).toBe(1);
  });

  test("deve impedir que um usuário não membro consiga as colunas", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const outsiderCookie = await registerUser(
      "Outsider",
      "outsider@example.com",
    );

    const projectId = await createProject(ownerCookie);
    const boardId = await createBoard(ownerCookie, projectId);

    await createColumn(ownerCookie, boardId, "Test Column");

    const response = await request(app)
      .get(`/api/boards/${boardId}/columns`)
      .set("Cookie", outsiderCookie);

    /*
     * getColumns() currently returns BOARD_NOT_FOUND
     * when the user isn't authorized to access the board.
     */
    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("BOARD_NOT_FOUND");
  });

  test("deve impedir que um usuário não autenticado consiga as colunas", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const projectId = await createProject(ownerCookie);
    const boardId = await createBoard(ownerCookie, projectId);

    const response = await request(app).get(`/api/boards/${boardId}/columns`);

    expect(response.statusCode).toBe(401);
  });

  // ======================================================
  // DELETAR
  // ======================================================

  test("deve permitir que o dono delete uma coluna", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const projectId = await createProject(ownerCookie);
    const boardId = await createBoard(ownerCookie, projectId);

    const columnId = await createColumn(ownerCookie, boardId);

    const response = await request(app)
      .delete(`/api/columns/${columnId}`)
      .set("Cookie", ownerCookie);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("SUCCESS");

    const [columns] = await db.query(
      `
      SELECT id
      FROM columns
      WHERE id = ?
      `,
      [columnId],
    );

    expect(columns).toHaveLength(0);
  });

  test("deve permitir que um admin delete uma coluna", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const adminCookie = await registerUser("Admin", "admin@example.com");

    const projectId = await createProject(ownerCookie);
    const boardId = await createBoard(ownerCookie, projectId);

    await addMember(ownerCookie, projectId, "Admin");

    await changeMemberRole(ownerCookie, projectId, "Admin");

    const columnId = await createColumn(ownerCookie, boardId);

    const response = await request(app)
      .delete(`/api/columns/${columnId}`)
      .set("Cookie", adminCookie);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("SUCCESS");

    const [columns] = await db.query(
      `
      SELECT id
      FROM columns
      WHERE id = ?
      `,
      [columnId],
    );

    expect(columns).toHaveLength(0);
  });

  test("deve impedir que um membro delete uma coluna", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const memberCookie = await registerUser("Member", "member@example.com");

    const projectId = await createProject(ownerCookie);
    const boardId = await createBoard(ownerCookie, projectId);

    await addMember(ownerCookie, projectId, "Member");

    const columnId = await createColumn(ownerCookie, boardId);

    const response = await request(app)
      .delete(`/api/columns/${columnId}`)
      .set("Cookie", memberCookie);

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("FORBIDDEN");
  });

  // ======================================================
  // POSIÇÃO
  // ======================================================

  test("deve mover uma coluna para a direita e atualizar as posições", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const projectId = await createProject(ownerCookie);
    const boardId = await createBoard(ownerCookie, projectId);

    const columnA = await createColumn(ownerCookie, boardId, "Column A");

    const columnB = await createColumn(ownerCookie, boardId, "Column B");

    const columnC = await createColumn(ownerCookie, boardId, "Column C");

    const response = await request(app)
      .patch(`/api/columns/${columnA}/position`)
      .set("Cookie", ownerCookie)
      .send({
        position: 2,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("SUCCESS");

    const [columns] = await db.query(
      `
      SELECT id, position
      FROM columns
      WHERE board_id = ?
      ORDER BY position ASC
      `,
      [boardId],
    );

    expect(columns).toEqual([
      {
        id: columnB,
        position: 0,
      },
      {
        id: columnC,
        position: 1,
      },
      {
        id: columnA,
        position: 2,
      },
    ]);
  });

  test("deve mover uma coluna para a esquerda e atualizar as posições", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const projectId = await createProject(ownerCookie);
    const boardId = await createBoard(ownerCookie, projectId);

    const columnA = await createColumn(ownerCookie, boardId, "Column A");

    const columnB = await createColumn(ownerCookie, boardId, "Column B");

    const columnC = await createColumn(ownerCookie, boardId, "Column C");

    const response = await request(app)
      .patch(`/api/columns/${columnC}/position`)
      .set("Cookie", ownerCookie)
      .send({
        position: 0,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("SUCCESS");

    const [columns] = await db.query(
      `
      SELECT id, position
      FROM columns
      WHERE board_id = ?
      ORDER BY position ASC
      `,
      [boardId],
    );

    expect(columns).toEqual([
      {
        id: columnC,
        position: 0,
      },
      {
        id: columnA,
        position: 1,
      },
      {
        id: columnB,
        position: 2,
      },
    ]);
  });

  test("deve atualizar a posição da coluna sem alterar as outras quando a posição for a mesma", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const projectId = await createProject(ownerCookie);
    const boardId = await createBoard(ownerCookie, projectId);

    const columnA = await createColumn(ownerCookie, boardId, "Column A");

    const columnB = await createColumn(ownerCookie, boardId, "Column B");

    const response = await request(app)
      .patch(`/api/columns/${columnB}/position`)
      .set("Cookie", ownerCookie)
      .send({
        position: 1,
      });

    expect(response.statusCode).toBe(200);

    const [columns] = await db.query(
      `
      SELECT id, position
      FROM columns
      WHERE board_id = ?
      ORDER BY position ASC
      `,
      [boardId],
    );

    expect(columns).toEqual([
      {
        id: columnA,
        position: 0,
      },
      {
        id: columnB,
        position: 1,
      },
    ]);
  });

  test("deve rejeitar uma posição inválida", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const projectId = await createProject(ownerCookie);
    const boardId = await createBoard(ownerCookie, projectId);

    const columnId = await createColumn(ownerCookie, boardId);

    const response = await request(app)
      .patch(`/api/columns/${columnId}/position`)
      .set("Cookie", ownerCookie)
      .send({
        position: 1,
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("INVALID_POSITION");
  });

  // ======================================================
  // DELETAR ORDENAR POSIÇÕES
  // ======================================================

  test("deve atualizar automaticamente as posições após deletar uma coluna", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const projectId = await createProject(ownerCookie);
    const boardId = await createBoard(ownerCookie, projectId);

    const columnA = await createColumn(ownerCookie, boardId, "Column A");

    const columnB = await createColumn(ownerCookie, boardId, "Column B");

    const columnC = await createColumn(ownerCookie, boardId, "Column C");

    const columnD = await createColumn(ownerCookie, boardId, "Column D");

    const response = await request(app)
      .delete(`/api/columns/${columnB}`)
      .set("Cookie", ownerCookie);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("SUCCESS");

    const [columns] = await db.query(
      `
      SELECT id, position
      FROM columns
      WHERE board_id = ?
      ORDER BY position ASC
      `,
      [boardId],
    );

    expect(columns).toEqual([
      {
        id: columnA,
        position: 0,
      },
      {
        id: columnC,
        position: 1,
      },
      {
        id: columnD,
        position: 2,
      },
    ]);
  });
});
