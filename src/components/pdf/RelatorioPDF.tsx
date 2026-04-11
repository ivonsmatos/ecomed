import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: "#F7F9F8",
    padding: 48,
  },
  header: {
    marginBottom: 32,
    borderBottomWidth: 2,
    borderBottomColor: "#2D7D46",
    paddingBottom: 16,
  },
  titulo: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#2D7D46",
  },
  subtitulo: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  secao: {
    marginBottom: 24,
  },
  secaoTitulo: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#1A1A1A",
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardValor: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#2D7D46",
  },
  cardLabel: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 3,
  },
  nivelBadge: {
    backgroundColor: "#2D7D46",
    color: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  rodape: {
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
  },
  rodapeTexto: {
    fontSize: 9,
    color: "#9CA3AF",
    textAlign: "center",
  },
})

interface Props {
  nome: string
  checkins: number
  impacto: { litrosAguaProtegidos: number; kgResiduoDescartado: number; co2EvitadoKg: number }
  nivel: string
}

const NIVEL_LABEL: Record<string, string> = {
  SEMENTE: "🌱 Semente",
  BROTO: "🌿 Broto",
  ARVORE: "🌳 Árvore",
  GUARDIAO: "🌍 Guardião",
  LENDA_ECO: "⭐ Lenda Eco",
}

export function RelatorioPDF({ nome, checkins, impacto, nivel }: Props) {
  const dataAtual = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.titulo}>EcoMed</Text>
          <Text style={styles.subtitulo}>Certificado de Impacto Ambiental — {dataAtual}</Text>
        </View>

        {/* Dados do usuário */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Eco-Cidadão</Text>
          <Text style={{ fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 8 }}>{nome}</Text>
          <Text style={styles.nivelBadge}>{NIVEL_LABEL[nivel] ?? nivel}</Text>
          <Text style={{ fontSize: 12, color: "#374151" }}>
            Realizou {checkins} descarte{checkins !== 1 ? "s" : ""} correto{checkins !== 1 ? "s" : ""} de medicamentos
          </Text>
        </View>

        {/* Impacto */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Seu Impacto Ambiental</Text>

          <View style={styles.cardRow}>
            <View style={[styles.card, { borderTopWidth: 3, borderTopColor: "#3B82F6" }]}>
              <Text style={[styles.cardValor, { color: "#1D4ED8" }]}>
                {impacto.litrosAguaProtegidos.toLocaleString("pt-BR")} L
              </Text>
              <Text style={styles.cardLabel}>Litros de água protegidos</Text>
            </View>

            <View style={[styles.card, { borderTopWidth: 3, borderTopColor: "#2D7D46" }]}>
              <Text style={styles.cardValor}>{impacto.kgResiduoDescartado} kg</Text>
              <Text style={styles.cardLabel}>Resíduos descartados corretamente</Text>
            </View>

            <View style={[styles.card, { borderTopWidth: 3, borderTopColor: "#D97706" }]}>
              <Text style={[styles.cardValor, { color: "#B45309" }]}>{impacto.co2EvitadoKg} kg</Text>
              <Text style={styles.cardLabel}>CO₂ evitado no meio ambiente</Text>
            </View>
          </View>
        </View>

        {/* Base científica */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Base dos Cálculos</Text>
          <Text style={{ fontSize: 10, color: "#6B7280", lineHeight: 1.6 }}>
            • 1 descarte correto evita a contaminação de ~450 litros de água{"\n"}
            • Referência: ANVISA e Programa Nacional de Resíduos Sólidos (PNRS 2020){"\n"}
            • Cada caixa representa ~15g de princípio ativo potencialmente contaminante{"\n"}
            • CO₂ evitado calculado com base na destinação ambientalmente adequada
          </Text>
        </View>

        {/* Rodapé */}
        <View style={styles.rodape}>
          <Text style={styles.rodapeTexto}>
            Este certificado foi gerado pela plataforma EcoMed — ecomed.eco.br{"\n"}
            Os cálculos são baseados em estudos científicos e dados oficiais da ANVISA.
          </Text>
        </View>
      </Page>
    </Document>
  )
}
