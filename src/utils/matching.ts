import type {
  EligibilityMatchStatus,
  ExamResult,
  MatchEvaluation,
  Scholarship,
  UserProfile,
} from '../types/synora.ts';

function parseNumeric(value?: string): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function summarizeExamMetrics(exam: ExamResult): string {
  const parts: string[] = [];
  if (exam.year) parts.push(`Year ${exam.year}`);
  if (exam.attemptLabel) parts.push(exam.attemptLabel);
  for (const [k, v] of Object.entries(exam.fields || {})) {
    if (v && v.trim()) {
      parts.push(`${k}: ${v.trim()}`);
    }
  }
  return parts.length > 0 ? `${exam.examName} (${parts.join(', ')})` : exam.examName;
}

function getPreferenceMatches(
  scholarship: Scholarship,
  preferences: string[]
): string[] {
  if (!preferences || preferences.length === 0) return [];
  const matched: string[] = [];
  const levels = scholarship.studyLevels.map((l) => l.toLowerCase());
  const hasExamReq =
    scholarship.examRequirement &&
    scholarship.examRequirement.category !== 'No separate scholarship examination';

  for (const pref of preferences) {
    switch (pref) {
      case 'After 10th':
        if (levels.some((l) => l.includes('10') || l.includes('diploma') || l.includes('12'))) {
          matched.push(pref);
        }
        break;
      case 'After 12th':
        if (levels.some((l) => l.includes('undergraduate') || l.includes('diploma') || l.includes('12'))) {
          matched.push(pref);
        }
        break;
      case 'Diploma':
        if (levels.some((l) => l.includes('diploma'))) {
          matched.push(pref);
        }
        break;
      case 'Undergraduate':
        if (levels.some((l) => l.includes('undergraduate'))) {
          matched.push(pref);
        }
        break;
      case 'Postgraduate':
        if (levels.some((l) => l.includes('master') || l.includes('postgraduate'))) {
          matched.push(pref);
        }
        break;
      case 'Research':
        if (
          levels.some((l) => l.includes('phd') || l.includes('research')) ||
          scholarship.degrees.some((d) => d.toLowerCase().includes('phd') || d.toLowerCase().includes('research'))
        ) {
          matched.push(pref);
        }
        break;
      case 'Exam-based scholarships':
        if (hasExamReq) {
          matched.push(pref);
        }
        break;
      case 'International scholarships':
        if (scholarship.scope === 'International') {
          matched.push(pref);
        }
        break;
      case 'Need-based scholarships':
        if (
          typeof scholarship.eligibility?.maxIncomeInr === 'number' ||
          scholarship.eligibility?.incomeDetails?.toLowerCase().includes('need') ||
          scholarship.eligibility?.incomeDetails?.toLowerCase().includes('income')
        ) {
          matched.push(pref);
        }
        break;
      case 'Merit-based scholarships':
        if (
          typeof scholarship.eligibility?.minPercentage === 'number' ||
          scholarship.eligibility?.academicRequirements?.toLowerCase().includes('merit') ||
          scholarship.eligibility?.summary?.toLowerCase().includes('merit') ||
          scholarship.fundingType === 'Full Funding'
        ) {
          matched.push(pref);
        }
        break;
    }
  }

  return matched;
}

export function evaluateScholarshipMatch(
  scholarship: Scholarship,
  profile: UserProfile | null,
  examResults: ExamResult[]
): MatchEvaluation {
  const matchedCriteria: string[] = [];
  const unmetCriteria: string[] = [];
  const missingInformation: string[] = [];

  const preferences = profile?.searchPreferences || [];
  const matchedPreferences = getPreferenceMatches(scholarship, preferences);

  if (scholarship.verificationStatus === 'Requirement Not Verified') {
    return {
      scholarship,
      matchStatus: 'Eligibility could not be verified',
      matchedCriteria: [],
      unmetCriteria: [],
      missingInformation: ['Official scholarship eligibility requirements are not yet verified'],
      matchedPreferences,
      explanation:
        'Official eligibility requirements for this scholarship are marked as not verified. Check the official portal before applying.',
    };
  }

  if (!profile) {
    return {
      scholarship,
      matchStatus: 'More information required',
      matchedCriteria: [],
      unmetCriteria: [],
      missingInformation: ['Add your country, state, search categories, or exam records to check fit'],
      matchedPreferences: [],
      explanation:
        'Your profile currently has no saved details. Add your basic location, scholarship preferences, or exam records to check alignment.',
    };
  }

  // 1. Selected scholarship search preferences (preference alignment, never rejects)
  if (matchedPreferences.length > 0) {
    matchedCriteria.push(`Matches selected search preferences: ${matchedPreferences.join(', ')}`);
  }

  // 2. Education level (evaluate ONLY if scholarship defines studyLevels AND student provided level or level preferences)
  const userLevel = profile.education?.level?.trim();
  const levelPreferences = preferences.filter((p) =>
    ['After 10th', 'After 12th', 'Diploma', 'Undergraduate', 'Postgraduate', 'Research'].includes(p)
  );
  if (scholarship.studyLevels && scholarship.studyLevels.length > 0) {
    if (userLevel) {
      const levelCompatibility: Record<string, string[]> = {
        'Class 10': ['Class 10', 'Class 12', 'Diploma'],
        'Class 12': ['Class 12', 'Diploma', 'Undergraduate'],
        Diploma: ['Diploma', 'Undergraduate'],
        Undergraduate: ['Undergraduate', "Master's", 'Postgraduate'],
        Postgraduate: ['Postgraduate', "Master's", 'PhD'],
        PhD: ['PhD'],
        Other: ['Undergraduate', "Master's", 'Postgraduate', 'Diploma', 'PhD'],
      };
      const targets = levelCompatibility[userLevel] || [userLevel];
      const hasMatch = scholarship.studyLevels.some(
        (lvl) =>
          lvl.toLowerCase() === userLevel.toLowerCase() ||
          targets.some((t) => lvl.toLowerCase().includes(t.toLowerCase()))
      );
      if (hasMatch) {
        matchedCriteria.push(`Education level aligns (${scholarship.studyLevels.join(', ')})`);
      } else {
        unmetCriteria.push(
          `Targets ${scholarship.studyLevels.join(', ')} (your selected current level: ${userLevel})`
        );
      }
    } else if (levelPreferences.length > 0) {
      if (
        levelPreferences.some((pref) => matchedPreferences.includes(pref))
      ) {
        matchedCriteria.push(`Education stage preference aligns (${scholarship.studyLevels.join(', ')})`);
      } else {
        unmetCriteria.push(
          `Targets ${scholarship.studyLevels.join(', ')} (differs from selected stage preferences: ${levelPreferences.join(', ')})`
        );
      }
    } else {
      missingInformation.push(`Education level or target stage (${scholarship.studyLevels.join(', ')})`);
    }
  }

  // 3. Required entrance, qualifying, or language exam + score/percentile/rank
  const reqExam = scholarship.examRequirement;
  if (reqExam && reqExam.category !== 'No separate scholarship examination') {
    const examKeywords = reqExam.examName
      .toLowerCase()
      .split(/[/,&()]+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 2 && !['or', 'and', 'for', 'the', 'track', 'based', 'depending', 'on', 'program'].includes(s));

    const matchingExams = examResults.filter((rec) =>
      examKeywords.some(
        (kw) =>
          rec.examName.toLowerCase().includes(kw) ||
          kw.includes(rec.examName.toLowerCase())
      )
    );

    if (matchingExams.length > 0) {
      const summaries = matchingExams.map(summarizeExamMetrics).join('; ');
      matchedCriteria.push(`Relevant exam on file: ${summaries}`);
      const hasScoreInfo = matchingExams.some((rec) =>
        Object.values(rec.fields || {}).some((v) => Boolean(v && v.trim()))
      );
      if (!hasScoreInfo) {
        missingInformation.push(
          `Score, percentile, or rank for ${matchingExams[0].examName} (optional to verify cutoffs)`
        );
      }
    } else {
      missingInformation.push(
        `Exam record for ${reqExam.examName} (${reqExam.category}) — add if you have appeared`
      );
    }
  } else if (reqExam) {
    matchedCriteria.push('No separate scholarship examination required');
  }

  // 4. Country / Nationality (evaluate ONLY when scholarship restricts scope/nationalities)
  const country = (profile.personal?.country || '').trim();
  const nationality = (profile.personal?.nationality || '').trim();
  const locationSignal = nationality || country;

  if (scholarship.scope === 'India') {
    if (!locationSignal) {
      missingInformation.push('Country / Nationality (Indian eligibility required)');
    } else if (locationSignal.toLowerCase().includes('india')) {
      matchedCriteria.push('Country / Nationality matches India scope');
    } else {
      unmetCriteria.push(`Restricted to Indian nationals (profile: ${locationSignal})`);
    }
  } else if (scholarship.eligibility?.nationalities?.length) {
    if (!locationSignal) {
      missingInformation.push('Country / Nationality');
    } else {
      matchedCriteria.push(`International eligibility open to ${locationSignal}`);
    }
  }

  // 5. State / Domicile (evaluate ONLY when scholarship specifies a state/region other than All India)
  const userState = (profile.eligibility?.domicile || profile.personal?.state || '').trim();
  if (scholarship.scope === 'India' && scholarship.state && scholarship.state !== 'All India') {
    if (!userState) {
      missingInformation.push(`State / Domicile (${scholarship.state} required)`);
    } else if (
      scholarship.state.toLowerCase().includes(userState.toLowerCase()) ||
      userState.toLowerCase().includes(scholarship.state.toLowerCase())
    ) {
      matchedCriteria.push(`State / domicile matches (${scholarship.state})`);
    } else {
      unmetCriteria.push(`Requires domicile in ${scholarship.state} (profile: ${userState})`);
    }
  }

  // 6. Academic marks (% or CGPA) — evaluate ONLY if scholarship specifies a numeric threshold
  const minPct = scholarship.eligibility?.minPercentage;
  const minCgpa = scholarship.eligibility?.minCgpa;
  if (typeof minPct === 'number' || typeof minCgpa === 'number') {
    const userPct = parseNumeric(profile.education?.percentage);
    const userCgpa = parseNumeric(profile.education?.cgpa);
    const effectivePct = userPct ?? (userCgpa !== null && userCgpa <= 10 ? userCgpa * 9.5 : null);

    if (effectivePct === null) {
      missingInformation.push(
        `Academic percentage or CGPA (scholarship reference: ${minPct ? `${minPct}%+` : `${minCgpa}+ CGPA`})`
      );
    } else if (typeof minPct === 'number' && effectivePct >= minPct) {
      matchedCriteria.push(`Academic marks meet ${minPct}% reference benchmark`);
    } else if (typeof minCgpa === 'number' && userCgpa !== null && userCgpa >= minCgpa) {
      matchedCriteria.push(`CGPA meets ${minCgpa} reference benchmark`);
    } else {
      unmetCriteria.push(
        `Academic marks below ${minPct ? `${minPct}%` : `${minCgpa} CGPA`} reference benchmark`
      );
    }
  }

  // 7. Family income — evaluate ONLY if scholarship specifies an income cap
  const maxIncome = scholarship.eligibility?.maxIncomeInr;
  if (typeof maxIncome === 'number') {
    const userIncome = parseNumeric(profile.eligibility?.annualFamilyIncome);
    if (userIncome === null) {
      missingInformation.push(
        `Annual family income (scholarship cap: INR ${maxIncome.toLocaleString('en-IN')})`
      );
    } else if (userIncome <= maxIncome) {
      matchedCriteria.push(
        `Family income within INR ${maxIncome.toLocaleString('en-IN')} threshold`
      );
    } else {
      unmetCriteria.push(
        `Family income exceeds INR ${maxIncome.toLocaleString('en-IN')} guideline`
      );
    }
  }

  // 8. Category — evaluate ONLY if scholarship restricts beyond 'All'
  const restrictedCategories = (scholarship.eligibility?.categories || []).filter(
    (c) => c !== 'All' && !c.toLowerCase().includes('female')
  );
  if (restrictedCategories.length > 0 && !restrictedCategories.includes('General')) {
    const userCat = (profile.eligibility?.category || '').trim();
    if (!userCat) {
      missingInformation.push(`Category (${restrictedCategories.join(', ')})`);
    } else if (
      restrictedCategories.some((c) => c.toLowerCase().includes(userCat.toLowerCase()))
    ) {
      matchedCriteria.push(`Category aligns (${userCat})`);
    } else {
      unmetCriteria.push(
        `Restricted to ${restrictedCategories.join(', ')} (profile category: ${userCat})`
      );
    }
  }

  // 9. Scholarship-specific criteria (e.g., female-only technical scheme)
  if (scholarship.id === 'aicte-pragati-girl') {
    const gender = (profile.personal?.gender || '').trim().toLowerCase();
    if (!gender) {
      missingInformation.push('Gender (scholarship is specifically for female students)');
    } else if (gender === 'female' || gender === 'woman') {
      matchedCriteria.push('Scholarship-specific requirement met (Female student scheme)');
    } else {
      unmetCriteria.push('Scholarship is restricted to female students');
    }
  }

  // Determine exact eligibility status
  let matchStatus: EligibilityMatchStatus;
  let explanation: string;

  if (unmetCriteria.length > 0) {
    matchStatus = 'Does not match a known requirement';
    explanation = `Does not satisfy ${unmetCriteria.length} listed requirement(s): ${unmetCriteria[0]}.`;
  } else if (missingInformation.length > 0) {
    matchStatus = 'More information required';
    explanation =
      matchedCriteria.length > 0
        ? `Matches ${matchedCriteria.length} provided criteria, with ${missingInformation.length} additional detail(s) needed to verify full eligibility.`
        : `No disqualifying criteria found. Add ${missingInformation[0]} to verify eligibility.`;
  } else if (matchedCriteria.length > 0) {
    matchStatus = 'Matches provided criteria';
    explanation =
      'Matches all evaluated criteria based on the information you have provided. Always confirm final terms on the official portal.';
  } else {
    matchStatus = 'Eligibility could not be verified';
    explanation =
      'Eligibility depends on program-specific or university rules that could not be verified from profile data alone.';
  }

  return {
    scholarship,
    matchStatus,
    matchedCriteria,
    unmetCriteria,
    missingInformation,
    matchedPreferences,
    explanation,
  };
}
