export const ERROR_FORM = {
  NONE: 0,
  INVALID_NUM: 1,
  INVALID_SPACE: 2,
  INVALID: 3,
  REQUIRED: 4,
  VALID: 5,
  TOO_MANY_LOGIN_ATTEMPTS: 6,
  TOO_MANY_REGISTERS: 7,
  NOTHING: 8,
};

export const nameFormErrorMessages = {
  [ERROR_FORM.INVALID_NUM]:
    "Nome de usuário precisa ter entre 4 e 32 caracteres.",
  [ERROR_FORM.INVALID_SPACE]:
    "Nome de usuário não pode ter espaços ou caracteres especiais.",
  [ERROR_FORM.INVALID]: "Nome de usuário já existe.",
  [ERROR_FORM.REQUIRED]: "Campo obrigatório.",
  [ERROR_FORM.NOTHING]: "",
};

export const emailFormErrorMessages = {
  [ERROR_FORM.INVALID_NUM]: "Email inválido.",
  [ERROR_FORM.INVALID]: "Uma conta já existe com este email.",
  [ERROR_FORM.REQUIRED]: "Campo obrigatório.",
  [ERROR_FORM.NOTHING]: "",
};

export const passwordFormErrorMessages = {
  [ERROR_FORM.INVALID_NUM]: "Senha precisa ter entre 8 e 32 caracteres.",
  [ERROR_FORM.INVALID_SPACE]: "Senha não pode ter espaços.",
  [ERROR_FORM.REQUIRED]: "Campo obrigatório.",
  [ERROR_FORM.INVALID]: "Nome/senha errado(s).",
  [ERROR_FORM.TOO_MANY_LOGIN_ATTEMPTS]:
    "Muitas tentativas de login, tente novamente mais tarde.",
  [ERROR_FORM.TOO_MANY_REGISTERS]:
    "Muitas contas registradas, tente novamente mais tarde",
};

export function validateName(value: string) {
  if (value.length === 0) {
    return ERROR_FORM.NONE;
  }

  if (value.length < 4 || value.length > 32) {
    return ERROR_FORM.INVALID_NUM;
  }

  if (/[^a-zA-Z0-9]/.test(value)) {
    return ERROR_FORM.INVALID_SPACE;
  }

  return ERROR_FORM.VALID;
}

export function validatePassword(value: string) {
  if (value.length === 0) {
    return ERROR_FORM.NONE;
  }

  if (value.length < 8 || value.length > 32) {
    return ERROR_FORM.INVALID_NUM;
  }

  if (value.includes(" ")) {
    return ERROR_FORM.INVALID_SPACE;
  }

  return ERROR_FORM.VALID;
}

export function validateEmail(value: string) {
  if (value.length === 0) {
    return ERROR_FORM.NONE;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(value) ? ERROR_FORM.VALID : ERROR_FORM.INVALID_NUM;
}

export function hasError(error: number) {
  return error !== ERROR_FORM.NONE && error !== ERROR_FORM.VALID;
}
