import { useEffect, useState } from "react";
import { IoEye, IoEyeOff } from "react-icons/io5";

import { useAuth } from "../../contexts/AuthContext";
import { cn } from "../../utils/cn";

import InputInfo from "./InputInfo";

import {
  emailFormErrorMessages,
  ERROR_FORM,
  hasError,
  nameFormErrorMessages,
  passwordFormErrorMessages,
  validateEmail,
  validateName,
  validatePassword,
} from "../../utils/authValidation";

interface AuthFormProps {
  registering: boolean;
  onSuccess: () => void;
}

export default function AuthForm({ registering, onSuccess }: AuthFormProps) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [nameFormError, setNameFormError] = useState(ERROR_FORM.NONE);
  const [emailFormError, setEmailFormError] = useState(ERROR_FORM.NONE);
  const [passwordFormError, setPasswordFormError] = useState(ERROR_FORM.NONE);

  const { login, register } = useAuth();

  useEffect(() => {
    setEmail("");
    setName("");
    setPassword("");

    setEmailFormError(ERROR_FORM.NONE);
    setNameFormError(ERROR_FORM.NONE);
    setPasswordFormError(ERROR_FORM.NONE);
  }, [registering]);

  function validateRequiredFields() {
    let valid = true;

    if (name.length === 0) {
      setNameFormError(ERROR_FORM.REQUIRED);
      valid = false;
    }

    if (password.length === 0) {
      setPasswordFormError(ERROR_FORM.REQUIRED);
      valid = false;
    }

    if (registering && email.length === 0) {
      setEmailFormError(ERROR_FORM.REQUIRED);
      valid = false;
    }

    return valid;
  }

  function isFormValid() {
    return (
      nameFormError === ERROR_FORM.VALID &&
      passwordFormError === ERROR_FORM.VALID &&
      (!registering || emailFormError === ERROR_FORM.VALID)
    );
  }

  function handleNameError(reset: boolean) {
    if (reset) {
      setNameFormError(ERROR_FORM.NONE);
    } else {
      setNameFormError(validateName(name));
    }
  }

  function handleEmailError(reset: boolean) {
    if (reset) {
      setEmailFormError(ERROR_FORM.NONE);
    } else {
      setEmailFormError(validateEmail(email));
    }
  }

  function handlePasswordError(reset: boolean) {
    if (reset) {
      setPasswordFormError(ERROR_FORM.NONE);
    } else {
      setPasswordFormError(validatePassword(password));
    }
  }

  async function handleRegister() {
    if (!isFormValid()) {
      validateRequiredFields();
      return;
    }

    const result = await register(name, email, password);

    if (result === "USERNAME_TAKEN") {
      setNameFormError(ERROR_FORM.INVALID);
    } else if (result === "EMAIL_TAKEN") {
      setEmailFormError(ERROR_FORM.INVALID);
    } else if (result === "TOO_MANY_REGISTER_ATTEMPTS") {
      setEmailFormError(ERROR_FORM.NOTHING);
      setNameFormError(ERROR_FORM.NOTHING);
      setPasswordFormError(ERROR_FORM.TOO_MANY_REGISTERS);
    } else if (result === "SUCCESS") {
      onSuccess();
    }
  }

  async function handleLogin() {
    if (!isFormValid()) {
      validateRequiredFields();
      return;
    }

    const result = await login(name, password);

    if (result === "SUCCESS") {
      onSuccess();
    } else if (result === "TOO_MANY_LOGIN_ATTEMPTS") {
      setNameFormError(ERROR_FORM.NOTHING);
      setPasswordFormError(ERROR_FORM.TOO_MANY_LOGIN_ATTEMPTS);
    } else {
      setNameFormError(ERROR_FORM.NOTHING);
      setPasswordFormError(ERROR_FORM.INVALID);
    }
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (registering) {
      await handleRegister();
    } else {
      await handleLogin();
    }
  }

  function FormErrorMessage({ message }: { message?: string }) {
    if (!message) return null;

    return (
      <div className="mt-1 text-center font-semibold text-red-500">
        {message}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-20 flex flex-col items-center gap-y-5"
    >
      {/* Email input */}
      {registering && (
        <div>
          <InputInfo
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="Email"
            onErrorReset={handleEmailError}
            error={hasError(emailFormError)}
            className="w-120"
            maxLength={255}
          />

          {hasError(emailFormError) && (
            <FormErrorMessage
              message={emailFormErrorMessages[emailFormError]}
            />
          )}
        </div>
      )}

      {/* Nome input */}
      <div>
        <InputInfo
          value={name}
          onChange={setName}
          type="text"
          placeholder="Nome de usuário"
          onErrorReset={handleNameError}
          error={hasError(nameFormError)}
          className="w-120"
          maxLength={32}
        />

        {hasError(nameFormError) && (
          <FormErrorMessage message={nameFormErrorMessages[nameFormError]} />
        )}
      </div>

      {/* Senha input */}
      <div>
        <div className="relative">
          <InputInfo
            value={password}
            onChange={setPassword}
            type={showPassword ? "text" : "password"}
            placeholder="Senha"
            onErrorReset={handlePasswordError}
            error={hasError(passwordFormError)}
            className="w-120"
            maxLength={32}
          />

          {/* Mostrar senha */}
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute top-4.25 right-4.25 cursor-pointer"
          >
            {showPassword ? (
              <IoEye className="text-2xl bg-[#FFF4DE]" />
            ) : (
              <IoEyeOff className="text-2xl bg-[#FFF4DE]" />
            )}
          </button>
        </div>

        {hasError(passwordFormError) && (
          <FormErrorMessage
            message={passwordFormErrorMessages[passwordFormError]}
          />
        )}
      </div>

      {/* Botão submit */}
      <button
        type="submit"
        className={cn(
          "cursor-pointer rounded-xl border-4 border-black",
          "bg-[#FFF4DE] px-8 py-2 text-2xl font-bold text-black",
          "transition-colors duration-200",
          "hover:bg-black hover:text-[#FFF4DE]",
        )}
      >
        {registering ? "Criar conta" : "Entrar"}
      </button>
    </form>
  );
}
