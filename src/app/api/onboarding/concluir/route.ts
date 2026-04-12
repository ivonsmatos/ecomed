import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { concluirOnboardingComBoasVindas } from "@/lib/coins/onboarding";

/**
 * POST /api/onboarding/concluir
 * 
 * Marca o onboarding como concluído pelo usuário e credita EcoCoins de bônus.
 * Esta rota é chamada quando o usuário termina o fluxo de onboarding.
 */
export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login para continuar." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const result = await concluirOnboardingComBoasVindas(userId);

    return NextResponse.json({ 
      success: result.ok,
      creditedSignup: result.creditedSignup,
      creditedOnboarding: result.creditedOnboarding,
      message: "Onboarding concluído com sucesso!"
    });
    
  } catch (error) {
    console.error("Erro ao concluir onboarding:", error);
    
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}