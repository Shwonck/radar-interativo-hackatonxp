import assert from "node:assert/strict";
import test from "node:test";
import { clients } from "../lib/mock-data";
import {
  calculateSimulatedScore,
  getMockClientAnalyses,
  getMockMaturities,
} from "../lib/mock-analyses";
import { getMockPositions } from "../lib/mock-positions";

test("as posições pertencem aos clientes existentes e fecham patrimônio e alocação", () => {
  for (const client of clients) {
    const positions = getMockPositions(client.id);
    assert.ok(positions.length > 0, client.name);
    assert.equal(
      positions.reduce((sum, position) => sum + position.amount, 0),
      client.assets,
    );
    for (const allocation of client.allocation) {
      const categoryTotal = positions
        .filter((position) => position.category === allocation.label)
        .reduce((sum, position) => sum + position.amount, 0);
      assert.equal(categoryTotal, Math.round((client.assets * allocation.value) / 100));
    }
  }
});

test("simulação mostra três perfis contrastantes sem pontuar dados ausentes", () => {
  assert.equal(getMockClientAnalyses(3).creditAssessment?.totalScore, 88);
  assert.equal(getMockClientAnalyses(1).creditAssessment?.totalScore, 73);
  assert.equal(getMockClientAnalyses(2).creditAssessment?.totalScore, 32);
  assert.equal(getMockClientAnalyses(4).creditAssessment?.totalScore, null);
  assert.equal(
    calculateSimulatedScore({
      paymentCapacityScore: null,
      leverageScore: 80,
      liquidityScore: 80,
      creditHistoryScore: 80,
      externalRatingScore: 80,
      guaranteesScore: 80,
    }),
    null,
  );
});

test("FGC considera apenas saldos elegíveis e agrupa por conglomerado", () => {
  const moderate = getMockClientAnalyses(1).fgcAnalysis!;
  assert.equal(moderate.isComplete, true);
  assert.deepEqual(moderate.summary, {
    eligibleExposure: 700000,
    estimatedCoverage: 430000,
    estimatedExcess: 270000,
  });
  assert.equal(moderate.groups?.length, 2);
  assert.ok(moderate.pendingChecks?.some((check) => check.includes("titularidade")));
  assert.ok(
    moderate.groups?.some((group) =>
      group.positions?.some((position) => position.name.includes("Gama")),
    ),
  );
  assert.ok(moderate.excludedProducts?.includes("Debênture"));
  assert.ok(moderate.excludedProducts?.includes("Tesouro Direto"));
  assert.ok(moderate.excludedProducts?.includes("Fundo"));
  assert.ok(moderate.excludedProducts?.includes("Ações"));

  const low = getMockClientAnalyses(3).fgcAnalysis!;
  assert.equal(low.summary?.estimatedExcess, 0);
  const high = getMockClientAnalyses(2).fgcAnalysis!;
  assert.equal(high.summary?.estimatedExcess, 70000);
});

test("dados incompletos não produzem cobertura conclusiva", () => {
  const analysis = getMockClientAnalyses(5);
  assert.equal(analysis.fgcAnalysis?.isComplete, false);
  assert.equal(analysis.creditAssessment?.totalScore, null);
  assert.ok(analysis.alerts?.some((alert) => alert.id === "data-5"));
});

test("alertas têm contexto e respeitam o limite de concentração configurado", () => {
  assert.equal(getMockClientAnalyses(3, 0.15, "2026-10-10").alerts?.length, 0);
  const moderate = getMockClientAnalyses(1, 0.15, "2026-10-10");
  assert.ok(moderate.alerts?.some((alert) => alert.id === "concentration-1"));
  assert.ok(moderate.alerts?.some((alert) => alert.id === "fgc-1"));
  assert.ok(moderate.alerts?.some((alert) => alert.id === "maturity-1-debenture"));
  assert.ok(
    moderate.alerts?.every((alert) => alert.asOf && alert.source && alert.action && alert.trigger),
  );
  assert.ok(
    moderate.alerts
      ?.find((alert) => alert.id === "fgc-1")
      ?.description.includes("Não é perda prevista"),
  );
  assert.ok(!getMockClientAnalyses(1, 0.2).alerts?.some((alert) => alert.id === "concentration-1"));
});

test("vencimentos mudam com a data de cálculo e continuam ordenados", () => {
  const positions = getMockPositions(1);
  const onBaseDate = getMockMaturities(positions, "2026-10-10");
  const tenDaysLater = getMockMaturities(positions, "2026-10-20");
  assert.equal(onBaseDate.find((item) => item.positionId === "1-debenture")?.daysUntil, 15);
  assert.equal(tenDaysLater.find((item) => item.positionId === "1-debenture")?.daysUntil, 5);
  assert.ok(
    tenDaysLater.every(
      (item, index) => index === 0 || item.daysUntil >= tenDaysLater[index - 1].daysUntil,
    ),
  );
  assert.equal(getMockClientAnalyses(1, 0.15, "2026-10-20").calculatedOn, "2026-10-20");
});
