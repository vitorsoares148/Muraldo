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

beforeEach(cleanupDatabase);

afterAll(async () => {
  await db.end();
});

// ======================================================
// INFORMAÇÕES DO USUÁRIO
// ======================================================

describe("User - Get Info", () => {
  test("deve retornar as informações do usuário autenticado", async () => {
    const cookie = await registerUser("Info User", "infouser@example.com");

    const userId = await getUserId("Info User");

    const response = await request(app)
      .get("/api/user/info")
      .set("Cookie", cookie);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("SUCCESS");

    expect(response.body.user).toEqual({
      username: "Info User",
      id: userId,
    });
  });

  test("deve rejeitar acesso sem autenticação", async () => {
    const response = await request(app).get("/api/user/info");

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe("NOT_AUTHENTICATED");
  });

  test("deve retornar USER_NOT_FOUND quando o usuário autenticado não existe", async () => {
    const cookie = await registerUser(
      "Deleted User",
      "deleteduser@example.com",
    );

    const userId = await getUserId("Deleted User");

    await db.query(
      `
    DELETE FROM users
    WHERE id = ?
    `,
      [userId],
    );

    const response = await request(app)
      .get("/api/user/info")
      .set("Cookie", cookie);

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("USER_NOT_FOUND");
  });
});
