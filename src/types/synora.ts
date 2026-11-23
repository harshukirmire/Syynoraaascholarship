import type { Timestamp } from 'firebase/firestore';

export type EducationLevel =
  | 'Class 10'
  | 'Class 12'
  | 'Diploma'
  | 'Undergraduate'
  | 'Postgraduate'
  | 'PhD'
  | 'Other';

export type VerificationStatus = 'Verified' | 'Needs Review' | 'Requirement Not Verified';

export type ExamRequirementCategory =
  | 'Scholarship-specific examination'
  | 'University admission examination'
  | 'Language proficiency test'
  | 'Course-specific examination'
  | 'Aptitude or selection test'
  | 'No separate scholarship examination'
  | 'Conditional requirement';

export type ExamRequirementStatus =
  | 'Scholarship-specific examination required'
  | 'University admission examination'
  | 'Language proficiency test'
  | 'Aptitude or selection test'
  | 'No separate scholarship examination required'
  | 'Depends on university/program'
  | 'Requirement not verified';

export type ExamCategory = 'National' | 'State' | 'Board' | 'International / Language' | 'Custom';

export type ApplicationStatus =
  | 'Saved'
  | 'Planning'
  | 'In Progress'
  | 'Submitted'
  | 'Under Review'
  | 'Accepted'
  | 'Rejected'
  | 'Withdrawn';

export interface PersonalInfo {
  fullName: string;
  dob: string;
  gender: string;
  nationality: string;
  country: string;
  state: string;
  city: string;
}

export interface EligibilityInfo {
  annualFamilyIncome: string;
  incomeCategory: string;
  category: string;
  domicile: string;
  disabilityStatus: string;
  additionalNotes: string;
}

export interface EducationInfo {
  level: EducationLevel | '';
  classOrYear: string;
  degree: string;
  course: string;
  branch: string;
  institution: string;
  currentYearOfStudy: string;
  passingYear: string;
  percentage: string;
  cgpa: string;
}

export interface ReminderPreferences {
  defaultDaysBefore: number[];
  deliveryChannelStatus: 'Pending external notification configuration';
}

export const SCHOLARSHIP_SEARCH_CATEGORIES = [
  'After 10th',
  'After 12th',
  'Diploma',
  'Undergraduate',
  'Postgraduate',
  'Research',
  'Exam-based scholarships',
  'International scholarships',
  'Need-based scholarships',
  'Merit-based scholarships',
] as const;

export type ScholarshipSearchCategory = (typeof SCHOLARSHIP_SEARCH_CATEGORIES)[number];

export interface UserProfile {
  uid: string;
  email: string;
  role: 'user';
  profileCompleted: boolean;
  personal: PersonalInfo;
  eligibility: EligibilityInfo;
  education: EducationInfo;
  searchPreferences?: string[];
  reminderPreferences?: ReminderPreferences;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ExamResult {
  id: string;
  uid: string;
  examName: string;
  examCategory: ExamCategory;
  attemptLabel: string;
  year: string;
  testDate: string;
  fields: Record<string, string>;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface SavedScholarship {
  uid: string;
  scholarshipId: string;
  scholarshipName: string;
  provider: string;
  country: string;
  deadline: string;
  reminderDays: number[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ApplicationRecord {
  id: string;
  uid: string;
  scholarshipId: string;
  scholarshipName: string;
  provider: string;
  deadline: string;
  applicationDate: string;
  status: ApplicationStatus;
  referenceNumber: string;
  notes: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ScholarshipEligibility {
  minPercentage?: number;
  minCgpa?: number;
  maxIncomeInr?: number;
  incomeDetails: string;
  categories: string[];
  domicile: string;
  nationalities: string[];
  academicRequirements: string;
  summary: string;
}

export interface ScholarshipExamRequirement {
  status: ExamRequirementStatus;
  category: ExamRequirementCategory;
  examName: string;
  examId?: string;
  purpose: string;
  minimumScore: string;
  examDeadline: string;
  officialExamWebsite: string;
}

export interface Scholarship {
  id: string;
  name: string;
  provider: string;
  country: string;
  state?: string;
  university?: string;
  scope: 'India' | 'International';
  providerType: string;
  studyLevels: string[];
  degrees: string[];
  fields: string[];
  fundingType: string;
  fundingDetails: string;
  duration: string;
  deadline: string;
  deadlineStatus: string;
  eligibility: ScholarshipEligibility;
  examRequirement: ScholarshipExamRequirement;
  requiredDocuments: string[];
  applicationProcedure: string[];
  officialWebsite: string;
  officialPortal: string;
  officialSource: string;
  sourceUrl?: string;
  verificationStatus: VerificationStatus;
  lastVerifiedDate: string;
  updatedBy?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ExamInfo {
  id: string;
  name: string;
  shortName: string;
  category: string;
  countryOrRegion: string;
  purpose: string;
  whoTakesIt: string;
  relatedPrograms: string[];
  officialWebsite: string;
  requirementsNote: string;
  verificationStatus: VerificationStatus;
  lastVerifiedDate: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type EligibilityMatchStatus =
  | 'Matches provided criteria'
  | 'Does not match a known requirement'
  | 'More information required'
  | 'Eligibility could not be verified';

export interface MatchEvaluation {
  scholarship: Scholarship;
  matchStatus: EligibilityMatchStatus;
  matchedCriteria: string[];
  unmetCriteria: string[];
  missingInformation: string[];
  matchedPreferences: string[];
  explanation: string;
}
