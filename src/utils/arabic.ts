/**
 * Arabic Text Normalization & Fuzzy Search Utilities
 * Implements the SQL equivalent of normalize_arabic(text) and pg_trgm similarity
 */

// Tashkeel / Diacritics unicode range (\u064B to \u065F, \u0670)
const TASHKEEL_REGEX = /[\u064B-\u065F\u0670]/g;
const TATWEEL_REGEX = /\u0640/g;

/**
 * Normalizes an Arabic string for resilient fuzzy and typo-tolerant search.
 * Mimics PostgreSQL normalize_arabic(text) trigger function.
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';

  let normalized = text.trim().toLowerCase();

  // 1. Remove Tashkeel (diacritics) & Tatweel (kashida)
  normalized = normalized.replace(TASHKEEL_REGEX, '');
  normalized = normalized.replace(TATWEEL_REGEX, '');

  // 2. Standardize Alefs: أ, إ, آ, ٱ -> ا
  normalized = normalized.replace(/[أإآٱ]/g, 'ا');

  // 3. Standardize Taa Marbuta: ة -> ه
  normalized = normalized.replace(/ة/g, 'ه');

  // 4. Standardize Alef Maqsura / Yaa: ى -> ي
  normalized = normalized.replace(/ى/g, 'ي');

  // 5. Standardize Hamza variants: ؤ -> و, ئ -> ي
  normalized = normalized.replace(/ؤ/g, 'و');
  normalized = normalized.replace(/ئ/g, 'ي');

  // 6. Clean extra spaces
  normalized = normalized.replace(/\s+/g, ' ');

  return normalized;
}

/**
 * Computes character 3-grams (trigrams) of a string, mirroring PostgreSQL pg_trgm.
 */
function getTrigrams(str: string): Set<string> {
  const padded = `  ${str} `;
  const trigrams = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) {
    trigrams.add(padded.slice(i, i + 3));
  }
  return trigrams;
}

/**
 * Calculates Trigram Similarity between two strings (0.0 to 1.0).
 * Mirror of PostgreSQL `similarity(a, b)` in pg_trgm.
 */
export function trigramSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeArabic(str1);
  const norm2 = normalizeArabic(str2);

  if (!norm1 || !norm2) return 0;
  if (norm1 === norm2) return 1;
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    return 0.85 + (Math.min(norm1.length, norm2.length) / Math.max(norm1.length, norm2.length)) * 0.15;
  }

  const tg1 = getTrigrams(norm1);
  const tg2 = getTrigrams(norm2);

  let intersection = 0;
  tg1.forEach(tg => {
    if (tg2.has(tg)) intersection++;
  });

  const union = tg1.size + tg2.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Checks if a member name matches query either exactly, normalized substring, or fuzzy trigram.
 */
export function matchesArabicSearch(fullName: string, query: string, threshold = 0.3): { matches: boolean; score: number } {
  if (!query.trim()) return { matches: true, score: 1.0 };

  const normTarget = normalizeArabic(fullName);
  const normQuery = normalizeArabic(query);

  // Exact substring match on normalized form
  if (normTarget.includes(normQuery)) {
    return { matches: true, score: 0.95 };
  }

  // Token-by-token check
  const queryTokens = normQuery.split(' ').filter(Boolean);
  const targetTokens = normTarget.split(' ').filter(Boolean);

  let tokenMatchCount = 0;
  for (const qToken of queryTokens) {
    const found = targetTokens.some(tToken => tToken.includes(qToken) || trigramSimilarity(tToken, qToken) >= 0.5);
    if (found) tokenMatchCount++;
  }

  if (tokenMatchCount === queryTokens.length) {
    return { matches: true, score: 0.8 };
  }

  // Full trigram similarity check
  const sim = trigramSimilarity(normTarget, normQuery);
  return {
    matches: sim >= threshold,
    score: sim,
  };
}
