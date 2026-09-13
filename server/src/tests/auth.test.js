const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../app");
const db = require("../../db");

afterEach(async () => {
  await db.query("DELETE FROM users");
});

afterAll(async () => {
  await db.end();
});

describe("Authentication", () => {
  test("deve rejeitar solicitações não autenticadas", async () => {
    const response = await request(app).get("/api/projects");

    expect(response.statusCode).toBe(401);
  });
});

test("deve rejeitar o registro com dados ausentes", async () => {
  const response = await request(app).post("/api/auth/register").send({});

  expect(response.statusCode).toBe(400);
});

test("deve registrar um usuário", async () => {
  const response = await request(app).post("/api/auth/register").send({
    name: "Test User",
    email: "testuser@example.com",
    password: "password123",
  });

  expect(response.statusCode).toBe(201);
  expect(response.body.message).toBe("SUCCESS");
  expect(response.headers["set-cookie"]).toBeDefined();
});

test("deve rejeitar username duplicado", async () => {
  await request(app).post("/api/auth/register").send({
    name: "Test User",
    email: "first@example.com",
    password: "password123",
  });

  const response = await request(app).post("/api/auth/register").send({
    name: "Test User",
    email: "second@example.com",
    password: "password123",
  });

  expect(response.statusCode).toBe(409);
  expect(response.body.error).toBe("USERNAME_TAKEN");
});

test("deve rejeitar email duplicado", async () => {
  await request(app).post("/api/auth/register").send({
    name: "First User",
    email: "test@example.com",
    password: "password123",
  });

  const response = await request(app).post("/api/auth/register").send({
    name: "Second User",
    email: "test@example.com",
    password: "password123",
  });

  expect(response.statusCode).toBe(409);
  expect(response.body.error).toBe("EMAIL_TAKEN");
});

test("deve fazer login com credenciais válidas", async () => {
  await request(app).post("/api/auth/register").send({
    name: "Test User",
    email: "login@example.com",
    password: "password123",
  });

  const response = await request(app).post("/api/auth/login").send({
    name: "Test User",
    password: "password123",
  });

  expect(response.statusCode).toBe(200);
  expect(response.body.message).toBe("SUCCESS");
  expect(response.headers["set-cookie"]).toBeDefined();
});

test("deve rejeitar login com credenciais inválidas", async () => {
  await request(app).post("/api/auth/register").send({
    name: "Test User",
    email: "login@example.com",
    password: "password123",
  });

  const response = await request(app).post("/api/auth/login").send({
    name: "Test User",
    password: "wrongpassword",
  });

  expect(response.statusCode).toBe(401);
  expect(response.body.error).toBe("INVALID_CREDENTIALS");
});

test("deve rejeitar token inválido ou expirado", async () => {
  const response = await request(app)
    .get("/api/user/info")
    .set("Cookie", ["token=invalid-token"]);

  expect(response.statusCode).toBe(401);
  expect(response.body.error).toBe("INVALID_OR_EXPIRED_TOKEN");
});

test("deve rejeitar token com userId inválido", async () => {
  const token = jwt.sign(
    {
      userId: 0,
    },
    process.env.SECRET_KEY,
    {
      expiresIn: "1h",
    },
  );

  const response = await request(app)
    .get("/api/user/info")
    .set("Cookie", [`token=${token}`]);

  expect(response.statusCode).toBe(401);
  expect(response.body.error).toBe("INVALID_OR_EXPIRED_TOKEN");
});
