import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Box from "../components/generic/Box";
import AuthForm from "../components/login/AuthForm";

export default function Login() {
  const [registering, setRegistering] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="z-1 flex h-screen flex-col items-center justify-center">
      <div className="font-shadows mb-8 h-18 rotate-1 border-5 border-black/12 bg-yellow-300 p-3 px-8 text-4xl font-bold">
        Muraldo
      </div>

      <Box>
        <div className="mt-5 h-auto w-150 rotate-1 flex-col items-center pt-2">
          {/* Titulo */}
          <div className="font-shadows absolute top-0 w-full text-center text-[36px] font-bold">
            {registering ? "Registrar" : "Login"}
          </div>

          {/* Formulário */}
          <AuthForm
            onSuccess={() => navigate("/home")}
            registering={registering}
          />

          {/* Trocar página */}
          <div className="bottom-7 mt-6 mb-3 flex justify-center gap-1.5 text-[18px]">
            <div>{registering ? "Já" : "Não"} possui uma conta?</div>

            <button
              type="button"
              className="cursor-pointer text-yellow-500 underline hover:text-yellow-400"
              onClick={() => setRegistering((prev) => !prev)}
            >
              clique aqui
            </button>
            <div>para {registering ? "fazer login" : "se registrar"}.</div>
          </div>
        </div>
      </Box>
    </div>
  );
}
