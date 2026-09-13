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

beforeEach(cleanupDatabase);

afterAll(async () => {
  await db.end();
});

describe("Projects", () => {
  test("deve criar um projeto", async () => {
    const cookie = await registerUser("Test User", "test@example.com");

    const response = await request(app)
      .post("/api/projects")
      .set("Cookie", cookie)
      .send({
        name: "My Project",
        description: "My project description",
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe("SUCCESS");
    expect(response.body.projectId).toBeDefined();
  });

  test("deve rejeitar criação de projeto sem autenticação", async () => {
    const response = await request(app).post("/api/projects").send({
      name: "My Project",
      description: "My project description",
    });

    expect(response.statusCode).toBe(401);
  });

  test("deve retornar os projetos do usuário", async () => {
    const cookie = await registerUser("Test User", "test@example.com");

    await createProject(cookie, "Project One");
    await createProject(cookie, "Project Two");

    const response = await request(app)
      .get("/api/projects")
      .set("Cookie", cookie);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("SUCCESS");
    expect(response.body.projects).toHaveLength(2);
  });

  test("deve atualizar um projeto como dono", async () => {
    const cookie = await registerUser("Test User", "test@example.com");

    const projectId = await createProject(cookie);

    const response = await request(app)
      .put(`/api/projects/${projectId}`)
      .set("Cookie", cookie)
      .send({
        name: "Updated Project",
        description: "Updated description",
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("SUCCESS");
  });

  test("deve rejeitar atualização de projeto por membro", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const memberCookie = await registerUser("Member", "member@example.com");

    const projectId = await createProject(ownerCookie);

    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set("Cookie", ownerCookie)
      .send({
        username: "Member",
      });

    const response = await request(app)
      .put(`/api/projects/${projectId}`)
      .set("Cookie", memberCookie)
      .send({
        name: "Hacked Project",
        description: "Should not work",
      });

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("FORBIDDEN");
  });

  test("deve permitir que o dono adicione um membro", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    await registerUser("Member", "member@example.com");

    const projectId = await createProject(ownerCookie);

    const response = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set("Cookie", ownerCookie)
      .send({
        username: "Member",
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe("SUCCESS");
    expect(response.body.user.username).toBe("Member");
  });

  test("deve rejeitar adicionar um membro que já pertence ao projeto", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    await registerUser("Member", "member@example.com");

    const projectId = await createProject(ownerCookie);

    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set("Cookie", ownerCookie)
      .send({
        username: "Member",
      })
      .expect(201);

    const response = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set("Cookie", ownerCookie)
      .send({
        username: "Member",
      });

    expect(response.statusCode).toBe(409);
    expect(response.body.error).toBe("ALREADY_MEMBER");
  });

  test("deve permitir que o dono remova um membro", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const memberCookie = await registerUser("Member", "member@example.com");

    const projectId = await createProject(ownerCookie);

    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set("Cookie", ownerCookie)
      .send({
        username: "Member",
      });

    const [users] = await db.query("SELECT id FROM users WHERE username = ?", [
      "Member",
    ]);

    const memberId = users[0].id;

    const response = await request(app)
      .delete(`/api/projects/${projectId}/members/${memberId}`)
      .set("Cookie", ownerCookie);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("SUCCESS");
  });

  test("deve impedir que o dono seja adicionado como membro", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const projectId = await createProject(ownerCookie);

    const response = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set("Cookie", ownerCookie)
      .send({
        username: "Owner",
      });

    expect(response.statusCode).toBe(409);
    expect(response.body.error).toBe("ALREADY_MEMBER");
  });

  test("deve impedir que o membro acesse um projeto do qual não faz parte", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const memberCookie = await registerUser("Member", "member@example.com");

    const projectId = await createProject(ownerCookie);

    const response = await request(app)
      .get(`/api/projects/${projectId}`)
      .set("Cookie", memberCookie);

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("PROJECT_NOT_FOUND");
  });

  test("deve permitir que um membro acesse o projeto", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const memberCookie = await registerUser("Member", "member@example.com");

    const projectId = await createProject(ownerCookie);

    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set("Cookie", ownerCookie)
      .send({
        username: "Member",
      });

    const response = await request(app)
      .get(`/api/projects/${projectId}`)
      .set("Cookie", memberCookie);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("SUCCESS");
    expect(response.body.project.name).toBe("Test Project");
    expect(response.body.project.owner.username).toBe("Owner");
  });

  test("deve permitir que o dono delete o projeto", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const projectId = await createProject(ownerCookie);

    const response = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set("Cookie", ownerCookie);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("SUCCESS");

    const [projects] = await db.query("SELECT id FROM projects WHERE id = ?", [
      projectId,
    ]);

    expect(projects).toHaveLength(0);
  });

  test("deve impedir que um membro delete o projeto", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const memberCookie = await registerUser("Member", "member@example.com");

    const projectId = await createProject(ownerCookie);

    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set("Cookie", ownerCookie)
      .send({
        username: "Member",
      });

    const response = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set("Cookie", memberCookie);

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("PROJECT_NOT_FOUND");
  });

  test("deve permitir que o dono promova um membro para admin", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    await registerUser("Member", "member@example.com");

    const projectId = await createProject(ownerCookie);

    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set("Cookie", ownerCookie)
      .send({
        username: "Member",
      });

    const [users] = await db.query("SELECT id FROM users WHERE username = ?", [
      "Member",
    ]);

    const memberId = users[0].id;

    const response = await request(app)
      .patch(`/api/projects/${projectId}/members/${memberId}/role`)
      .set("Cookie", ownerCookie);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("SUCCESS");

    const [members] = await db.query(
      `
    SELECT role
    FROM project_members
    WHERE project_id = ?
      AND user_id = ?
    `,
      [projectId, memberId],
    );

    expect(members[0].role).toBe("admin");
  });

  test("deve permitir que o dono rebaixe um admin para membro", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    await registerUser("Member", "member@example.com");

    const projectId = await createProject(ownerCookie);

    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set("Cookie", ownerCookie)
      .send({
        username: "Member",
      });

    const [users] = await db.query("SELECT id FROM users WHERE username = ?", [
      "Member",
    ]);

    const memberId = users[0].id;

    // Promover para admin.
    await request(app)
      .patch(`/api/projects/${projectId}/members/${memberId}/role`)
      .set("Cookie", ownerCookie);

    // Rebaixar para member.
    const response = await request(app)
      .patch(`/api/projects/${projectId}/members/${memberId}/role`)
      .set("Cookie", ownerCookie);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("SUCCESS");

    const [members] = await db.query(
      `
    SELECT role
    FROM project_members
    WHERE project_id = ?
      AND user_id = ?
    `,
      [projectId, memberId],
    );

    expect(members[0].role).toBe("member");
  });

  test("deve impedir que um membro altere o cargo de outro membro", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const memberCookie = await registerUser("Member", "member@example.com");

    await registerUser("Other", "other@example.com");

    const projectId = await createProject(ownerCookie);

    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set("Cookie", ownerCookie)
      .send({
        username: "Member",
      });

    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set("Cookie", ownerCookie)
      .send({
        username: "Other",
      });

    const [users] = await db.query("SELECT id FROM users WHERE username = ?", [
      "Other",
    ]);

    const otherId = users[0].id;

    const response = await request(app)
      .patch(`/api/projects/${projectId}/members/${otherId}/role`)
      .set("Cookie", memberCookie);

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("FORBIDDEN");
  });

  test("deve rejeitar alteração de cargo de usuário que não é membro", async () => {
    const ownerCookie = await registerUser(
      "Role Owner",
      "roleowner@example.com",
    );

    await registerUser("Role Outsider", "roleoutsider@example.com");

    const [users] = await db.query("SELECT id FROM users WHERE username = ?", [
      "Role Outsider",
    ]);

    const outsiderId = users[0].id;

    const projectId = await createProject(ownerCookie);

    const response = await request(app)
      .patch(`/api/projects/${projectId}/members/${outsiderId}/role`)
      .set("Cookie", ownerCookie)
      .send({
        role: "admin",
      });

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("MEMBER_NOT_FOUND");
  });

  test("deve impedir alteração do cargo do dono do projeto", async () => {
    const ownerCookie = await registerUser(
      "Role Project Owner",
      "roleprojectowner@example.com",
    );

    const projectId = await createProject(ownerCookie);

    const [users] = await db.query(
      "SELECT owner_id FROM projects WHERE id = ?",
      [projectId],
    );

    const ownerId = users[0].owner_id;

    const response = await request(app)
      .patch(`/api/projects/${projectId}/members/${ownerId}/role`)
      .set("Cookie", ownerCookie)
      .send({
        role: "admin",
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("CANNOT_CHANGE_OWNER");
  });

  test("deve impedir que um membro remova outro membro", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const memberCookie = await registerUser("Member", "member@example.com");

    await registerUser("Other", "other@example.com");

    const projectId = await createProject(ownerCookie);

    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set("Cookie", ownerCookie)
      .send({
        username: "Member",
      });

    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set("Cookie", ownerCookie)
      .send({
        username: "Other",
      });

    const [users] = await db.query("SELECT id FROM users WHERE username = ?", [
      "Other",
    ]);

    const otherId = users[0].id;

    const response = await request(app)
      .delete(`/api/projects/${projectId}/members/${otherId}`)
      .set("Cookie", memberCookie);

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("FORBIDDEN");
  });

  test("deve impedir que um membro remova a si mesmo pelo endpoint de remoção", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const memberCookie = await registerUser("Member", "member@example.com");

    const projectId = await createProject(ownerCookie);

    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set("Cookie", ownerCookie)
      .send({
        username: "Member",
      });

    const [users] = await db.query("SELECT id FROM users WHERE username = ?", [
      "Member",
    ]);

    const memberId = users[0].id;

    const response = await request(app)
      .delete(`/api/projects/${projectId}/members/${memberId}`)
      .set("Cookie", memberCookie);

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("CANNOT_REMOVE_SELF");
  });

  test("deve rejeitar remoção de usuário que não é membro", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const otherCookie = await registerUser("Other", "other@example.com");

    const [users] = await db.query("SELECT id FROM users WHERE username = ?", [
      "Other",
    ]);

    const otherId = users[0].id;

    const projectId = await createProject(ownerCookie);

    const response = await request(app)
      .delete(`/api/projects/${projectId}/members/${otherId}`)
      .set("Cookie", ownerCookie);

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("MEMBER_NOT_FOUND");

    expect(otherCookie).toBeDefined();
  });

  test("deve impedir a remoção do dono do projeto", async () => {
    const ownerCookie = await registerUser(
      "Cannot Remove Owner",
      "cannotremoveowner@example.com",
    );

    const projectId = await createProject(ownerCookie);

    const [users] = await db.query(
      "SELECT owner_id FROM projects WHERE id = ?",
      [projectId],
    );

    const ownerId = users[0].owner_id;

    const response = await request(app)
      .delete(`/api/projects/${projectId}/members/${ownerId}`)
      .set("Cookie", ownerCookie);

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("CANNOT_REMOVE_OWNER");
  });

  test("deve permitir que um membro saia do projeto", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const memberCookie = await registerUser("Member", "member@example.com");

    const projectId = await createProject(ownerCookie);

    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set("Cookie", ownerCookie)
      .send({
        username: "Member",
      });

    const response = await request(app)
      .delete(`/api/projects/${projectId}/leave`)
      .set("Cookie", memberCookie);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("SUCCESS");
  });

  test("deve impedir que o dono saia do projeto", async () => {
    const ownerCookie = await registerUser("Owner", "owner@example.com");

    const projectId = await createProject(ownerCookie);

    const response = await request(app)
      .delete(`/api/projects/${projectId}/leave`)
      .set("Cookie", ownerCookie);

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("OWNER_CANNOT_LEAVE");
  });

  test("deve rejeitar saída de usuário que não pertence ao projeto", async () => {
    const ownerCookie = await registerUser(
      "Leave Owner",
      "leaveowner@example.com",
    );

    const outsiderCookie = await registerUser(
      "Leave Outsider",
      "leaveoutsider@example.com",
    );

    const projectId = await createProject(ownerCookie);

    const response = await request(app)
      .delete(`/api/projects/${projectId}/leave`)
      .set("Cookie", outsiderCookie);

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("FORBIDDEN");
  });
});
