import { Unit, KpiDaily, CommitteeMember, CommitteeProgress, MemberProgressCalculated } from '../types';

/**
 * Calculates weighted KPI rollup across a unit subtree.
 * Directly implements:
 * SELECT ROUND(100.0 * SUM(numerator) / NULLIF(SUM(denominator), 0), 1) AS pct
 * FROM kpi_daily k JOIN units u ON u.id = k.unit_id
 * WHERE u.path LIKE :parent_path || '%' AND k.kpi_code = :kpi_code AND k.day = :day;
 */
export function calculateSubtreeRollup(
  parentPath: string,
  units: Unit[],
  kpis: KpiDaily[],
  kpiCode: string,
  targetDay: string
): {
  totalNumerator: number;
  totalDenominator: number;
  weightedPct: number;
  naiveAveragePct: number;
  participatingUnitsCount: number;
} {
  // Find all units whose path starts with parentPath
  const descendantUnitIds = new Set(
    units.filter(u => u.path.startsWith(parentPath)).map(u => u.id)
  );

  let sumNumerator = 0;
  let sumDenominator = 0;
  const unitPercentages: number[] = [];

  kpis.forEach(entry => {
    if (
      entry.kpi_code === kpiCode &&
      entry.day === targetDay &&
      descendantUnitIds.has(entry.unit_id)
    ) {
      sumNumerator += entry.numerator;
      sumDenominator += entry.denominator;
      if (entry.denominator > 0) {
        unitPercentages.push((entry.numerator / entry.denominator) * 100);
      }
    }
  });

  const weightedPct = sumDenominator > 0 ? (sumNumerator / sumDenominator) * 100 : 0;
  const naiveAveragePct = unitPercentages.length > 0
    ? unitPercentages.reduce((a, b) => a + b, 0) / unitPercentages.length
    : 0;

  return {
    totalNumerator: Math.round(sumNumerator),
    totalDenominator: Math.round(sumDenominator),
    weightedPct: Number(weightedPct.toFixed(1)),
    naiveAveragePct: Number(naiveAveragePct.toFixed(1)),
    participatingUnitsCount: unitPercentages.length,
  };
}

/**
 * Simulates SQL Window functions:
 * percentage - LAG(percentage, 1) OVER (PARTITION BY member_id ORDER BY day) AS daily_velocity,
 * AVG(percentage) OVER (PARTITION BY member_id ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS moving_avg_7d
 */
export function computeMemberProgressMetrics(
  member: CommitteeMember,
  progressRecords: CommitteeProgress[],
  committeeName: string,
  locationName: string,
  beneficiaryName: string
): MemberProgressCalculated {
  const memberHistory = progressRecords
    .filter(p => p.member_id === member.id)
    .sort((a, b) => a.day.localeCompare(b.day));

  if (memberHistory.length === 0) {
    return {
      member,
      committeeName,
      locationName,
      beneficiaryName,
      currentPercentage: 0,
      dailyVelocity: 0,
      movingAvg7d: 0,
      estimatedDaysToCompletion: null,
      status: 'stalled',
      history: [],
    };
  }

  const enrichedHistory = memberHistory.map((item, idx) => {
    const prev = idx > 0 ? memberHistory[idx - 1] : null;
    const velocity = prev ? Number((item.percentage - prev.percentage).toFixed(1)) : 0;
    return {
      day: item.day,
      percentage: item.percentage,
      velocity,
    };
  });

  const latest = enrichedHistory[enrichedHistory.length - 1];
  const last7Days = enrichedHistory.slice(-7);
  const movingAvg7d = Number(
    (last7Days.reduce((acc, curr) => acc + curr.percentage, 0) / last7Days.length).toFixed(1)
  );

  const dailyVelocity = latest.velocity;

  let estimatedDaysToCompletion: number | null = null;
  if (latest.percentage >= 100) {
    estimatedDaysToCompletion = 0;
  } else if (dailyVelocity > 0) {
    estimatedDaysToCompletion = Math.ceil((100 - latest.percentage) / dailyVelocity);
  }

  let status: 'completed' | 'on_track' | 'lagging' | 'stalled' = 'on_track';
  if (latest.percentage >= 100) {
    status = 'completed';
  } else if (dailyVelocity <= 0) {
    status = 'stalled';
  } else if (dailyVelocity < 1.0) {
    status = 'lagging';
  }

  return {
    member,
    committeeName,
    locationName,
    beneficiaryName,
    currentPercentage: latest.percentage,
    dailyVelocity,
    movingAvg7d,
    estimatedDaysToCompletion,
    status,
    history: enrichedHistory,
  };
}

/**
 * Computes Cosine Similarity between two numerical vectors of same dimension.
 * Used for simulated 1024-dim BGE-M3 embeddings.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Generates a deterministic normalized 1024-dim pseudo-embedding vector for text
 * using character seed hashing, enabling client-side semantic similarity comparison.
 */
export function generateConceptVector(text: string, dimension = 1024): number[] {
  const clean = text.toLowerCase();
  const vector = new Array(dimension).fill(0);

  // Concept dictionary triggers
  const concepts: { [key: string]: number[] } = {
    manpower: [10, 25, 40, 150],
    recruitment: [10, 26, 42, 150],
    staff: [10, 25, 41, 150],
    موارد: [10, 25, 40, 150],
    توظيف: [10, 26, 42, 150],
    كادر: [10, 25, 41, 150],
    
    vehicle: [50, 75, 120, 310],
    fleet: [50, 76, 121, 310],
    مركبات: [50, 75, 120, 310],
    اسطول: [50, 76, 121, 310],
    
    delay: [80, 85, 200, 410],
    risk: [80, 86, 201, 410],
    تأخير: [80, 85, 200, 410],
    مخاطر: [80, 86, 201, 410],
    
    budget: [90, 95, 250, 520],
    expense: [90, 96, 251, 520],
    ميزانية: [90, 95, 250, 520],
    انفاق: [90, 96, 251, 520],
    
    digital: [110, 130, 300, 600],
    transformation: [110, 131, 301, 600],
    تحول: [110, 130, 300, 600],
    رقمي: [110, 131, 301, 600],
  };

  // Base hash distribution
  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i);
    const pos = (code * 37 + i * 19) % dimension;
    vector[pos] += 1;
  }

  // Inject concept weights
  for (const [key, indices] of Object.entries(concepts)) {
    if (clean.includes(key)) {
      indices.forEach(idx => {
        vector[idx % dimension] += 3.5;
        vector[(idx + 1) % dimension] += 2.0;
      });
    }
  }

  // Normalize to unit vector
  let sumSq = 0;
  for (let i = 0; i < dimension; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq) || 1;
  return vector.map(val => val / norm);
}
