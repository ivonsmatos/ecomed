import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { creditCoins } from "@/lib/coins";

/**
 * POST /api/onboarding/concluir
 * 
 * Marca o onboarding como concluído pelo usuário e credita EcoCoins de bônus.
 * Esta rota é chamada quando o usuário termina o fluxo de onboarding.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login para continuar." },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Creditar EcoCoins pela conclusão do onboarding
    // A função creditCoins já cria a transaction com event: "ONBOARDING_SCREENS"
    await creditCoins(userId, "ONBOARDING_SCREENS");

    return NextResponse.json({ 
      success: true, 
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