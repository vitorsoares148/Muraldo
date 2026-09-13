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
    assignedTo = null,
  } = {},
) {
  const response = await request(app)
    .post(`/api/columns/${columnId}/tasks`)
    .set("Cookie", cookie)
    .send({
      description,
      priority,
      dueDate,
      assignedTo,
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

async function getTasksFromDatabase(columnId) {
  const [tasks] = await db.query(
    `
    SELECT
      id,
      column_id,
      assigned_to,
      description,
      priority,
      due_date,
      position
    FROM tasks
    WHERE column_id = ?
    ORDER BY position ASC
    `,
    [columnId],
  );

  return tasks;
}

async function getTask(taskId) {
  const [tasks] = await db.query(
    `
    SELECT 
      id,
      column_id,
      assigned_to,
      description,
      priority,
      due_date,
      position,
      finished,
      finish_date
    FROM tasks
    WHERE id = ?
    `,
    [taskId],
  );

  return tasks[0];
}

// ======================================================
// SETUP
// ======================================================

beforeEach(cleanupDatabase);

afterAll(async () => {
  await db.end();
});

// ======================================================
// CRIAR TAREFA
// ======================================================

describe("Tasks - Create", () => {
  test("deve criar uma tarefa como membro do projeto", async () => {
    const ownerCookie = await registerUser(
      "Task Owner",
      "taskowner@example.com",
    );

    const projectId = await createProject(ownerCookie);
    const boardId = await createBoard(ownerCookie, projectId);
    const columnId = await createColumn(ownerCookie, boardId);

    const taskId = await createTask(ownerCookie, columnId, {
      description: "Task description",
      priority: "high",
      dueDate: "2026-12-31",
    });

    const task = await getTask(taskId);

    expect(task).toBeDefined();
    expect(task.description).toBe("Task description");
    expect(task.priority).toBe("high");
    expect(task.column_id).toBe(columnId);
    expect(task.position).toBe(0);
  });

  test("deve rejeitar criação de tarefa sem autenticação", async () => {
    const response = await request(app).post("/api/columns/1/tasks").send({
      description: "Test Description",
    });

    expect(response.statusCode).toBe(401);
  });

  test("deve rejeitar criação de tarefa por usuário que não pertence ao projeto", async () => {
    const ownerCookie = await registerUser(
      "Create Owner",
      "createowner@example.com",
    );

    const outsiderCookie = await registerUser(
      "Create Outsider",
      "createoutsider@example.com",
    );

    const projectId = await createProject(ownerCookie);
    const boardId = await createBoard(ownerCookie, projectId);
    const columnId = await createColumn(ownerCookie, boardId);

    const response = await request(app)
      .post(`/api/columns/${columnId}/tasks`)
      .set("Cookie", outsiderCookie)
      .send({
        description: "Unauthorized Task",
      });

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("FORBIDDEN");
  });

  test("deve rejeitar criação em coluna inexistente", async () => {
    const cookie = await registerUser(
      "Missing Column User",
      "missingcolumn@example.com",
    );

    const response = await request(app)
      .post("/api/columns/999999/tasks")
      .set("Cookie", cookie)
      .send({
        description: "Test Description",
      });

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("COLUMN_NOT_FOUND");
  });

  test("deve usar none como prioridade padrão", async () => {
    const cookie = await registerUser(
      "Default Priority User",
      "defaultpriority@example.com",
    );

    const projectId = await createProject(cookie);
    const boardId = await createBoard(cookie, projectId);
    const columnId = await createColumn(cookie, boardId);

    const response = await request(app)
      .post(`/api/columns/${columnId}/tasks`)
      .set("Cookie", cookie)
      .send({
        description: "Default Priority Task",
      });

    expect(response.statusCode).toBe(201);

    const task = await getTask(response.body.taskId);

    expect(task.priority).toBe("none");
    expect(task.due_date).toBeNull();
  });

  test("deve criar novas tarefas em posições consecutivas", async () => {
    const cookie = await registerUser(
      "Position Creator",
      "positioncreator@example.com",
    );

    const projectId = await createProject(cookie);
    const boardId = await createBoard(cookie, projectId);
    const columnId = await createColumn(cookie, boardId);

    const taskA = await createTask(cookie, columnId, {
      description: "Task A",
    });

    const taskB = await createTask(cookie, columnId, {
      description: "Task B",
    });

    const tasks = await getTasksFromDatabase(columnId);

    expect(tasks).toEqual([
      expect.objectContaining({
        id: taskA,
        position: 0,
      }),
      expect.objectContaining({
        id: taskB,
        position: 1,
      }),
    ]);
  });
});

test("deve rejeitar atribuição de tarefa a usuário que não pertence ao projeto", async () => {
  const ownerCookie = await registerUser(
    "Assign Owner",
    "assignowner@example.com",
  );

  const outsiderCookie = await registerUser(
    "Assign Outsider",
    "assignoutsider@example.com",
  );

  const projectId = await createProject(ownerCookie);
  const boardId = await createBoard(ownerCookie, projectId);
  const columnId = await createColumn(ownerCookie, boardId);

  const outsiderId = await getUserId("Assign Outsider");

  const response = await request(app)
    .post(`/api/columns/${columnId}/tasks`)
    .set("Cookie", ownerCookie)
    .send({
      description: "Unauthorized assignment",
      assignedTo: outsiderId,
    });

  expect(response.statusCode).toBe(403);

  expect(response.body).toEqual({
    error: "FORBIDDEN",
  });
});

// ======================================================
// CONSEGUIR TAREFAS
// ======================================================

describe("Tasks - Get", () => {
  test("deve retornar as tarefas do projeto para um membro", async () => {
    const ownerCookie = await registerUser("Get Owner", "getowner@example.com");

    const memberCookie = await registerUser(
      "Get Member",
      "getmember@example.com",
    );

    const projectId = await createProject(ownerCookie);
    const boardId = await createBoard(ownerCookie, projectId);
    const columnId = await createColumn(ownerCookie, boardId);

    await addMember(ownerCookie, projectId, "Get Member");

    await createTask(ownerCookie, columnId, {
      description: "Task A",
    });

    await createTask(ownerCookie, columnId, {
      description: "Task B",
    });

    const response = await request(app)
      .get(`/api/columns/${columnId}/tasks`)
      .set("Cookie", memberCookie);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("SUCCESS");
    expect(response.body.tasks).toHaveLength(2);

    expect(response.body.tasks[0].description).toBe("Task A");
    expect(response.body.tasks[1].description).toBe("Task B");
  });

  test("deve retornar tarefas ordenadas por posição", async () => {
    const cookie = await registerUser(
      "Get Position User",
      "getposition@example.com",
    );

    const projectId = await createProject(cookie);
    const boardId = await createBoard(cookie, projectId);
    const columnId = await createColumn(cookie, boardId);

    const taskA = await createTask(cookie, columnId, {
      description: "Task A",
    });

    const taskB = await createTask(cookie, columnId, {
      description: "Task B",
    });

    await request(app)
      .patch(`/api/tasks/${taskB}/position`)
      .set("Cookie", cookie)
      .send({
        columnId,
        position: 0,
      })
      .expect(200);

    const response = await request(app)
      .get(`/api/columns/${columnId}/tasks`)
      .set("Cookie", cookie);

    expect(response.statusCode).toBe(200);

    expect(response.body.tasks.map((task) => task.id)).toEqual([taskB, taskA]);
  });

  test("deve rejeitar acesso de usuário que não pertence ao projeto", async () => {
    const ownerCookie = await registerUser(
      "Get Access Owner",
      "getaccessowner@example.com",
    );

    const outsiderCookie = await registerUser(
      "Get Access Outsider",
      "getaccessoutsider@example.com",
    );

    const projectId = await createProject(ownerCookie);
    const boardId = await createBoard(ownerCookie, projectId);
    const columnId = await createColumn(ownerCookie, boardId);

    const response = await request(app)
      .get(`/api/columns/${columnId}/tasks`)
      .set("Cookie", outsiderCookie);

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("COLUMN_NOT_FOUND");
  });
});

// ======================================================
// DELETAR TAREFA
// ======================================================

describe("Tasks - Delete", () => {
  test("deve permitir que um membro delete uma tarefa", async () => {
    const cookie = await registerUser(
      "Delete Member",
      "deletemember@example.com",
    );

    const projectId = await createProject(cookie);
    const boardId = await createBoard(cookie, projectId);
    const columnId = await createColumn(cookie, boardId);

    const taskId = await createTask(cookie, columnId);

    const response = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set("Cookie", cookie);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("SUCCESS");

    const task = await getTask(taskId);

    expect(task).toBeUndefined();
  });

  test("deve rejeitar exclusão por usuário que não pertence ao projeto", async () => {
    const ownerCookie = await registerUser(
      "Delete Owner",
      "deleteowner@example.com",
    );

    const outsiderCookie = await registerUser(
      "Delete Outsider",
      "deleteoutsider@example.com",
    );

    const projectId = await createProject(ownerCookie);
    const boardId = await createBoard(ownerCookie, projectId);
    const columnId = await createColumn(ownerCookie, boardId);
    const taskId = await createTask(ownerCookie, columnId);

    const response = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set("Cookie", outsiderCookie);

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("FORBIDDEN");
  });

  test("deve rejeitar exclusão de tarefa inexistente", async () => {
    const cookie = await registerUser(
      "Missing Task User",
      "missingtask@example.com",
    );

    const response = await request(app)
      .delete("/api/tasks/999999")
      .set("Cookie", cookie);

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("TASK_NOT_FOUND");
  });

  test("deve atualizar as posições após excluir uma tarefa", async () => {
    const cookie = await registerUser(
      "Delete Position User",
      "deleteposition@example.com",
    );

    const projectId = await createProject(cookie);
    const boardId = await createBoard(cookie, projectId);
    const columnId = await createColumn(cookie, boardId);

    const taskA = await createTask(cookie, columnId, {
      description: "Task A",
    });

    const taskB = await createTask(cookie, columnId, {
      description: "Task B",
    });

    const taskC = await createTask(cookie, columnId, {
      description: "Task C",
    });

    await request(app)
      .delete(`/api/tasks/${taskB}`)
      .set("Cookie", cookie)
      .expect(200);

    const tasks = await getTasksFromDatabase(columnId);

    expect(tasks).toEqual([
      expect.objectContaining({
        id: taskA,
        position: 0,
      }),
      expect.objectContaining({
        id: taskC,
        position: 1,
      }),
    ]);
  });
});

// ======================================================
// TERMINAR TAREFA
// ======================================================

describe("Tasks - Finish", () => {
  let cookie;
  let projectId;
  let boardId;
  let columnId;
  let taskId;

  beforeEach(async () => {
    cookie = await registerUser("finishTaskUser", "finishtask@test.com");

    projectId = await createProject(cookie);
    boardId = await createBoard(cookie, projectId);
    columnId = await createColumn(cookie, boardId);
    taskId = await createTask(cookie, columnId);
  });

  it("deve terminar uma tarefa", async () => {
    const response = await request(app)
      .put(`/api/tasks/${taskId}/finish`)
      .set("Cookie", cookie);

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual({
      message: "SUCCESS",
    });

    const [tasks] = await db.query(
      `
      SELECT finished, finish_date
      FROM tasks
      WHERE id = ?
      `,
      [taskId],
    );

    expect(tasks).toHaveLength(1);
    expect(tasks[0].finished).toBe(1);
    expect(tasks[0].finish_date).not.toBeNull();
  });

  it("deve retornar 404 quando uma tarefa não existe", async () => {
    const response = await request(app)
      .put("/api/tasks/999999/finish")
      .set("Cookie", cookie);

    expect(response.statusCode).toBe(404);

    expect(response.body).toEqual({
      error: "TASK_NOT_FOUND",
    });
  });

  it("deve retornar 409 quando a tarefa já terminou", async () => {
    await request(app)
      .put(`/api/tasks/${taskId}/finish`)
      .set("Cookie", cookie)
      .expect(200);

    const response = await request(app)
      .put(`/api/tasks/${taskId}/finish`)
      .set("Cookie", cookie);

    expect(response.statusCode).toBe(409);

    expect(response.body).toEqual({
      error: "TASK_ALREADY_FINISHED",
    });
  });

  it("deve definir finish_date quando a tarefa terminar", async () => {
    const before = Math.floor(Date.now() / 1000);

    await request(app)
      .put(`/api/tasks/${taskId}/finish`)
      .set("Cookie", cookie)
      .expect(200);

    const after = Math.floor(Date.now() / 1000);

    const task = await getTask(taskId);

    expect(task.finished).toBe(1);
    expect(task.finish_date).not.toBeNull();

    const finishDate = Math.floor(new Date(task.finish_date).getTime() / 1000);

    expect(finishDate).toBeGreaterThanOrEqual(before);
    expect(finishDate).toBeLessThanOrEqual(after);
  });
});

it("deve rejeitar término de tarefa por usuário que não pertence ao projeto", async () => {
  const ownerCookie = await registerUser(
    "Finish Owner",
    "finishowner@example.com",
  );

  const outsiderCookie = await registerUser(
    "Finish Outsider",
    "finishoutsider@example.com",
  );

  const projectId = await createProject(ownerCookie);
  const boardId = await createBoard(ownerCookie, projectId);
  const columnId = await createColumn(ownerCookie, boardId);
  const taskId = await createTask(ownerCookie, columnId);

  const response = await request(app)
    .put(`/api/tasks/${taskId}/finish`)
    .set("Cookie", outsiderCookie);

  expect(response.statusCode).toBe(403);

  expect(response.body).toEqual({
    error: "FORBIDDEN",
  });

  const task = await getTask(taskId);

  expect(task.finished).toBe(0);
  expect(task.finish_date).toBeNull();
});

// ======================================================
// ATUALIZAR POSIÇÃO
// ======================================================

describe("Tasks - Position", () => {
  test("deve mover uma tarefa para baixo na mesma coluna", async () => {
    const cookie = await registerUser("Move Down User", "movedown@example.com");

    const projectId = await createProject(cookie);
    const boardId = await createBoard(cookie, projectId);
    const columnId = await createColumn(cookie, boardId);

    const taskA = await createTask(cookie, columnId, {
      description: "Task A",
    });

    const taskB = await createTask(cookie, columnId, {
      description: "Task B",
    });

    const taskC = await createTask(cookie, columnId, {
      description: "Task C",
    });

    const response = await request(app)
      .patch(`/api/tasks/${taskA}/position`)
      .set("Cookie", cookie)
      .send({
        columnId,
        position: 2,
      });

    expect(response.statusCode).toBe(200);

    const tasks = await getTasksFromDatabase(columnId);

    expect(tasks).toEqual([
      expect.objectContaining({
        id: taskB,
        position: 0,
      }),
      expect.objectContaining({
        id: taskC,
        position: 1,
      }),
      expect.objectContaining({
        id: taskA,
        position: 2,
      }),
    ]);
  });

  test("deve mover uma tarefa para cima na mesma coluna", async () => {
    const cookie = await registerUser("Move Up User", "moveup@example.com");

    const projectId = await createProject(cookie);
    const boardId = await createBoard(cookie, projectId);
    const columnId = await createColumn(cookie, boardId);

    const taskA = await createTask(cookie, columnId, {
      description: "Task A",
    });

    const taskB = await createTask(cookie, columnId, {
      description: "Task B",
    });

    const taskC = await createTask(cookie, columnId, {
      description: "Task C",
    });

    const response = await request(app)
      .patch(`/api/tasks/${taskC}/position`)
      .set("Cookie", cookie)
      .send({
        columnId,
        position: 0,
      });

    expect(response.statusCode).toBe(200);

    const tasks = await getTasksFromDatabase(columnId);

    expect(tasks).toEqual([
      expect.objectContaining({
        id: taskC,
        position: 0,
      }),
      expect.objectContaining({
        id: taskA,
        position: 1,
      }),
      expect.objectContaining({
        id: taskB,
        position: 2,
      }),
    ]);
  });

  test("deve mover uma tarefa para outra coluna", async () => {
    const cookie = await registerUser(
      "Move Column User",
      "movecolumn@example.com",
    );

    const projectId = await createProject(cookie);
    const boardId = await createBoard(cookie, projectId);

    const sourceColumnId = await createColumn(cookie, boardId, "Source Column");

    const targetColumnId = await createColumn(cookie, boardId, "Target Column");

    const taskA = await createTask(cookie, sourceColumnId, {
      description: "Task A",
    });

    const taskB = await createTask(cookie, sourceColumnId, {
      description: "Task B",
    });

    const taskC = await createTask(cookie, targetColumnId, {
      description: "Task C",
    });

    const response = await request(app)
      .patch(`/api/tasks/${taskA}/position`)
      .set("Cookie", cookie)
      .send({
        columnId: targetColumnId,
        position: 0,
      });

    expect(response.statusCode).toBe(200);

    const sourceTasks = await getTasksFromDatabase(sourceColumnId);
    const targetTasks = await getTasksFromDatabase(targetColumnId);

    expect(sourceTasks).toEqual([
      expect.objectContaining({
        id: taskB,
        position: 0,
      }),
    ]);

    expect(targetTasks).toEqual([
      expect.objectContaining({
        id: taskA,
        position: 0,
      }),
      expect.objectContaining({
        id: taskC,
        position: 1,
      }),
    ]);
  });

  test("deve inserir uma tarefa no meio de outra coluna e ajustar as posições", async () => {
    const cookie = await registerUser(
      "Move Middle User",
      "movemiddle@example.com",
    );

    const projectId = await createProject(cookie);
    const boardId = await createBoard(cookie, projectId);

    const sourceColumnId = await createColumn(cookie, boardId, "Source");

    const targetColumnId = await createColumn(cookie, boardId, "Target");

    const taskA = await createTask(cookie, sourceColumnId, {
      description: "Task A",
    });

    const taskB = await createTask(cookie, targetColumnId, {
      description: "Task B",
    });

    const taskC = await createTask(cookie, targetColumnId, {
      description: "Task C",
    });

    const taskD = await createTask(cookie, targetColumnId, {
      description: "Task D",
    });

    await request(app)
      .patch(`/api/tasks/${taskA}/position`)
      .set("Cookie", cookie)
      .send({
        columnId: targetColumnId,
        position: 1,
      })
      .expect(200);

    const targetTasks = await getTasksFromDatabase(targetColumnId);

    expect(targetTasks).toEqual([
      expect.objectContaining({
        id: taskB,
        position: 0,
      }),
      expect.objectContaining({
        id: taskA,
        position: 1,
      }),
      expect.objectContaining({
        id: taskC,
        position: 2,
      }),
      expect.objectContaining({
        id: taskD,
        position: 3,
      }),
    ]);
  });

  test("deve permitir mover uma tarefa para a posição em que ela já está", async () => {
    const cookie = await registerUser(
      "Same Position User",
      "sameposition@example.com",
    );

    const projectId = await createProject(cookie);
    const boardId = await createBoard(cookie, projectId);
    const columnId = await createColumn(cookie, boardId);

    const taskA = await createTask(cookie, columnId);
    const taskB = await createTask(cookie, columnId);

    const response = await request(app)
      .patch(`/api/tasks/${taskB}/position`)
      .set("Cookie", cookie)
      .send({
        columnId,
        position: 1,
      });

    expect(response.statusCode).toBe(200);

    const tasks = await getTasksFromDatabase(columnId);

    expect(tasks).toEqual([
      expect.objectContaining({
        id: taskA,
        position: 0,
      }),
      expect.objectContaining({
        id: taskB,
        position: 1,
      }),
    ]);
  });

  test("deve rejeitar posição inválida", async () => {
    const cookie = await registerUser(
      "Invalid Position User",
      "invalidposition@example.com",
    );

    const projectId = await createProject(cookie);
    const boardId = await createBoard(cookie, projectId);
    const columnId = await createColumn(cookie, boardId);

    const taskId = await createTask(cookie, columnId);

    const response = await request(app)
      .patch(`/api/tasks/${taskId}/position`)
      .set("Cookie", cookie)
      .send({
        columnId,
        position: 10,
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("INVALID_POSITION");
  });

  test("deve rejeitar coluna alvo de outro projeto", async () => {
    const cookie = await registerUser(
      "Different Project User",
      "differentproject@example.com",
    );

    const projectA = await createProject(cookie, "Project A");
    const boardA = await createBoard(cookie, projectA);
    const sourceColumnId = await createColumn(cookie, boardA);

    const projectB = await createProject(cookie, "Project B");
    const boardB = await createBoard(cookie, projectB);
    const targetColumnId = await createColumn(cookie, boardB);

    const taskId = await createTask(cookie, sourceColumnId);

    const response = await request(app)
      .patch(`/api/tasks/${taskId}/position`)
      .set("Cookie", cookie)
      .send({
        columnId: targetColumnId,
        position: 0,
      });

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("TARGET_COLUMN_NOT_FOUND");
  });

  test("deve rejeitar movimentação por usuário que não pertence ao projeto", async () => {
    const ownerCookie = await registerUser(
      "Move Access Owner",
      "moveaccessowner@example.com",
    );

    const outsiderCookie = await registerUser(
      "Move Access Outsider",
      "moveaccessoutsider@example.com",
    );

    const projectId = await createProject(ownerCookie);
    const boardId = await createBoard(ownerCookie, projectId);
    const columnId = await createColumn(ownerCookie, boardId);

    const taskId = await createTask(ownerCookie, columnId);

    const response = await request(app)
      .patch(`/api/tasks/${taskId}/position`)
      .set("Cookie", outsiderCookie)
      .send({
        columnId,
        position: 0,
      });

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe("FORBIDDEN");
  });

  test("deve rejeitar movimentação de tarefa inexistente", async () => {
    const cookie = await registerUser(
      "Move Missing Task",
      "movemissing@example.com",
    );

    const projectId = await createProject(cookie);
    const boardId = await createBoard(cookie, projectId);
    const columnId = await createColumn(cookie, boardId);

    const response = await request(app)
      .patch("/api/tasks/999999/position")
      .set("Cookie", cookie)
      .send({
        columnId,
        position: 0,
      });

    expect(response.statusCode).toBe(404);
    expect(response.body.error).toBe("TASK_NOT_FOUND");
  });
});
