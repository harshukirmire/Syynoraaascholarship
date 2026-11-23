import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  testConnection,
} from '../lib/firebase.ts';
import type {
  ApplicationRecord,
  ExamInfo,
  ExamResult,
  SavedScholarship,
  Scholarship,
  UserProfile,
} from '../types/synora.ts';
import {
  VERIFIED_EXAMS_CATALOG,
  VERIFIED_SCHOLARSHIPS_CATALOG,
} from '../data/verifiedCatalog.ts';
import { BLUEPRINT_LIMITS, sanitizeId, truncate } from '../utils/validation.ts';

const BOOTSTRAP_ADMIN_EMAIL = 'harshukirmire@gmail.com';

function getTimestampMillis(ts?: { toMillis?: () => number } | null): number {
  return ts && typeof ts.toMillis === 'function' ? ts.toMillis() : 0;
}

function createEmptyProfile(
  uid: string,
  email: string,
  fullName = ''
): Omit<UserProfile, 'createdAt' | 'updatedAt'> {
  return {
    uid,
    email: truncate(email, BLUEPRINT_LIMITS.EMAIL_MAX),
    role: 'user',
    profileCompleted: false,
    personal: {
      fullName: truncate(fullName, 120),
      dob: '',
      gender: '',
      nationality: '',
      country: '',
      state: '',
      city: '',
    },
    eligibility: {
      annualFamilyIncome: '',
      incomeCategory: '',
      category: '',
      domicile: '',
      disabilityStatus: 'No',
      additionalNotes: '',
    },
    education: {
      level: '',
      classOrYear: '',
      degree: '',
      course: '',
      branch: '',
      institution: '',
      currentYearOfStudy: '',
      passingYear: '',
      percentage: '',
      cgpa: '',
    },
    searchPreferences: [],
    reminderPreferences: {
      defaultDaysBefore: [30, 14, 7],
      deliveryChannelStatus: 'Pending external notification configuration',
    },
  };
}

interface AuthContextValue {
  user: User | null;
  authReady: boolean;
  profile: UserProfile | null;
  profileLoading: boolean;
  isAdmin: boolean;
  adminChecked: boolean;
  examResults: ExamResult[];
  savedScholarships: SavedScholarship[];
  applications: ApplicationRecord[];
  scholarships: Scholarship[];
  scholarshipsFromFirestore: boolean;
  exams: ExamInfo[];
  catalogLoading: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string, fullName?: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  saveProfile: (updates: {
    personal: UserProfile['personal'];
    eligibility: UserProfile['eligibility'];
    education: UserProfile['education'];
    searchPreferences?: string[];
    profileCompleted?: boolean;
    reminderPreferences?: UserProfile['reminderPreferences'];
  }) => Promise<void>;
  addExamResult: (data: Omit<ExamResult, 'id' | 'uid' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateExamResult: (id: string, data: Omit<ExamResult, 'id' | 'uid' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteExamResult: (id: string) => Promise<void>;
  toggleSaveScholarship: (scholarship: Scholarship) => Promise<boolean>;
  updateSavedReminderDays: (scholarshipId: string, reminderDays: number[]) => Promise<void>;
  upsertApplication: (data: Omit<ApplicationRecord, 'uid' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteApplication: (applicationId: string) => Promise<void>;
  saveAdminScholarship: (scholarship: Scholarship, isNew: boolean) => Promise<void>;
  deleteAdminScholarship: (scholarshipId: string) => Promise<void>;
  saveAdminExam: (exam: ExamInfo, isNew: boolean) => Promise<void>;
  deleteAdminExam: (examId: string) => Promise<void>;
  publishCatalogToFirestore: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [savedScholarships, setSavedScholarships] = useState<SavedScholarship[]>([]);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);

  const [firestoreScholarships, setFirestoreScholarships] = useState<Scholarship[]>([]);
  const [scholarshipsLoaded, setScholarshipsLoaded] = useState(false);
  const [firestoreExams, setFirestoreExams] = useState<ExamInfo[]>([]);
  const [examsLoaded, setExamsLoaded] = useState(false);

  const profileSyncPromisesRef = useRef<Map<string, Promise<void>>>(new Map());

  useEffect(() => {
    void testConnection();
  }, []);

  const syncUserProfileDoc = useCallback(
    (firebaseUser: User, preferredFullName?: string): Promise<void> => {
      const uid = firebaseUser.uid;
      const profilePath = `users/${uid}`;
      const previous = profileSyncPromisesRef.current.get(uid) ?? Promise.resolve();

      const next = previous
        .catch(() => {
          // Allow subsequent retries after a failed attempt
        })
        .then(async () => {
          const userDocRef = doc(db, 'users', uid);
          const snap = await getDoc(userDocRef);
          const resolvedEmail = truncate(firebaseUser.email || '', BLUEPRINT_LIMITS.EMAIL_MAX);
          const resolvedName = truncate(
            preferredFullName || firebaseUser.displayName || '',
            120
          );

          if (!snap.exists()) {
            const base = createEmptyProfile(uid, resolvedEmail, resolvedName);
            await setDoc(userDocRef, {
              ...base,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            return;
          }

          const existing = snap.data() as UserProfile;
          const existingName = existing.personal?.fullName?.trim() || '';
          const shouldFillName = Boolean(resolvedName && !existingName);
          const shouldUpdateEmail = Boolean(resolvedEmail && existing.email !== resolvedEmail);

          if (shouldFillName || shouldUpdateEmail) {
            await updateDoc(userDocRef, {
              email: shouldUpdateEmail ? resolvedEmail : existing.email,
              ...(shouldFillName
                ? {
                    personal: {
                      ...existing.personal,
                      fullName: resolvedName,
                    },
                  }
                : {}),
              updatedAt: serverTimestamp(),
            });
          }
        })
        .catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, profilePath);
        });

      const tracked = next.finally(() => {
        if (profileSyncPromisesRef.current.get(uid) === tracked) {
          profileSyncPromisesRef.current.delete(uid);
        }
      });

      profileSyncPromisesRef.current.set(uid, tracked);
      return tracked;
    },
    []
  );

  const clearUserScopedState = useCallback(() => {
    setProfile(null);
    setExamResults([]);
    setSavedScholarships([]);
    setApplications([]);
    setIsAdmin(false);
    setAdminChecked(false);
    setFirestoreScholarships([]);
    setFirestoreExams([]);
    setScholarshipsLoaded(false);
    setExamsLoaded(false);
  }, []);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        clearUserScopedState();
        setProfileLoading(false);
        setAuthReady(true);
        return;
      }

      setUser(firebaseUser);
      setProfileLoading(true);
      setAdminChecked(false);
      setAuthReady(true);

      // Verify trusted admin status via admins/{uid} or verified bootstrap email
      let adminStatus =
        firebaseUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL &&
        firebaseUser.emailVerified === true;

      if (!adminStatus) {
        try {
          const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));
          if (adminDoc.exists()) {
            adminStatus = true;
          }
        } catch {
          // Normal users won't have an admin doc; ignore permission denial silently
          adminStatus = false;
        }
      }
      setIsAdmin(adminStatus);
      setAdminChecked(true);
    });

    return () => unsubscribe();
  }, [clearUserScopedState]);

  // Ensure user profile exists and subscribe strictly to users/{uid}
  useEffect(() => {
    if (!user) return;

    const uid = user.uid;
    const profilePath = `users/${uid}`;
    const userDocRef = doc(db, 'users', uid);

    let active = true;

    async function ensureInitialProfile() {
      try {
        await syncUserProfileDoc(user!);
      } catch {
        // Error context already surfaced by syncUserProfileDoc via handleFirestoreError
      }
    }

    void ensureInitialProfile();

    const unsubProfile = onSnapshot(
      userDocRef,
      (snap) => {
        if (!active) return;
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        } else {
          setProfile(null);
        }
        setProfileLoading(false);
      },
      (err) => {
        if (active) {
          handleFirestoreError(err, OperationType.GET, profilePath);
        }
      }
    );

    const examPath = `users/${uid}/examResults`;
    const unsubExams = onSnapshot(
      query(collection(db, 'users', uid, 'examResults'), where('uid', '==', uid)),
      (snap) => {
        if (!active) return;
        const items = snap.docs
          .map((d) => ({ ...(d.data() as Omit<ExamResult, 'id'>), id: d.id }))
          .sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
        setExamResults(items);
      },
      (err) => {
        if (active) {
          handleFirestoreError(err, OperationType.LIST, examPath);
        }
      }
    );

    const savedPath = `users/${uid}/savedScholarships`;
    const unsubSaved = onSnapshot(
      query(collection(db, 'users', uid, 'savedScholarships'), where('uid', '==', uid)),
      (snap) => {
        if (!active) return;
        const items = snap.docs
          .map((d) => d.data() as SavedScholarship)
          .sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
        setSavedScholarships(items);
      },
      (err) => {
        if (active) {
          handleFirestoreError(err, OperationType.LIST, savedPath);
        }
      }
    );

    const appPath = `users/${uid}/applications`;
    const unsubApps = onSnapshot(
      query(collection(db, 'users', uid, 'applications'), where('uid', '==', uid)),
      (snap) => {
        if (!active) return;
        const items = snap.docs
          .map((d) => ({ ...(d.data() as Omit<ApplicationRecord, 'id'>), id: d.id }))
          .sort((a, b) => getTimestampMillis(b.updatedAt) - getTimestampMillis(a.updatedAt));
        setApplications(items);
      },
      (err) => {
        if (active) {
          handleFirestoreError(err, OperationType.LIST, appPath);
        }
      }
    );

    const unsubScholarships = onSnapshot(
      query(collection(db, 'scholarships'), where('scope', 'in', ['India', 'International'])),
      (snap) => {
        if (!active) return;
        setFirestoreScholarships(snap.docs.map((d) => d.data() as Scholarship));
        setScholarshipsLoaded(true);
      },
      (err) => {
        if (active) {
          handleFirestoreError(err, OperationType.LIST, 'scholarships');
        }
      }
    );

    const unsubExamCatalog = onSnapshot(
      query(
        collection(db, 'exams'),
        where('verificationStatus', 'in', ['Verified', 'Needs Review', 'Requirement Not Verified'])
      ),
      (snap) => {
        if (!active) return;
        setFirestoreExams(snap.docs.map((d) => d.data() as ExamInfo));
        setExamsLoaded(true);
      },
      (err) => {
        if (active) {
          handleFirestoreError(err, OperationType.LIST, 'exams');
        }
      }
    );

    return () => {
      active = false;
      unsubProfile();
      unsubExams();
      unsubSaved();
      unsubApps();
      unsubScholarships();
      unsubExamCatalog();
    };
  }, [user, syncUserProfileDoc]);

  const scholarships = useMemo(() => {
    if (firestoreScholarships.length > 0) {
      return [...firestoreScholarships].sort((a, b) => a.name.localeCompare(b.name));
    }
    return VERIFIED_SCHOLARSHIPS_CATALOG;
  }, [firestoreScholarships]);

  const exams = useMemo(() => {
    if (firestoreExams.length > 0) {
      return [...firestoreExams].sort((a, b) => a.shortName.localeCompare(b.shortName));
    }
    return VERIFIED_EXAMS_CATALOG;
  }, [firestoreExams]);

  const signInEmail = useCallback(
    async (email: string, password: string) => {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      await syncUserProfileDoc(cred.user);
    },
    [syncUserProfileDoc]
  );

  const signUpEmail = useCallback(
    async (email: string, password: string, fullName = '') => {
      const cleanName = truncate(fullName, 120);
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (cleanName) {
        try {
          await updateProfile(cred.user, { displayName: cleanName });
        } catch {
          // Profile display name update on Auth is secondary to Firestore persistence
        }
      }
      await syncUserProfileDoc(cred.user, cleanName);
      try {
        await sendEmailVerification(cred.user);
      } catch {
        // Verification email dispatch failure should not block initial signup
      }
    },
    [syncUserProfileDoc]
  );

  const signInGoogle = useCallback(async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    await syncUserProfileDoc(cred.user);
  }, [syncUserProfileDoc]);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const logout = useCallback(async () => {
    clearUserScopedState();
    await signOut(auth);
  }, [clearUserScopedState]);

  const saveProfile = useCallback(
    async (updates: {
      personal: UserProfile['personal'];
      eligibility: UserProfile['eligibility'];
      education: UserProfile['education'];
      searchPreferences?: string[];
      profileCompleted?: boolean;
      reminderPreferences?: UserProfile['reminderPreferences'];
    }) => {
      if (!user) throw new Error('Authentication required.');
      const uid = user.uid;
      const path = `users/${uid}`;
      const ref = doc(db, 'users', uid);

      try {
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          const base = createEmptyProfile(uid, user.email || '');
          await setDoc(ref, {
            ...base,
            personal: updates.personal,
            eligibility: updates.eligibility,
            education: updates.education,
            searchPreferences: (updates.searchPreferences ?? []).slice(0, 15),
            profileCompleted: updates.profileCompleted ?? true,
            reminderPreferences: updates.reminderPreferences ?? base.reminderPreferences,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(ref, {
            email: truncate(user.email || '', BLUEPRINT_LIMITS.EMAIL_MAX),
            personal: updates.personal,
            eligibility: updates.eligibility,
            education: updates.education,
            ...(updates.searchPreferences !== undefined
              ? { searchPreferences: updates.searchPreferences.slice(0, 15) }
              : {}),
            profileCompleted: updates.profileCompleted ?? true,
            ...(updates.reminderPreferences
              ? { reminderPreferences: updates.reminderPreferences }
              : {}),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    },
    [user]
  );

  const addExamResult = useCallback(
    async (data: Omit<ExamResult, 'id' | 'uid' | 'createdAt' | 'updatedAt'>) => {
      if (!user) throw new Error('Authentication required.');
      const id = sanitizeId(`exam_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
      const path = `users/${user.uid}/examResults/${id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'examResults', id), {
          uid: user.uid,
          examName: truncate(data.examName, BLUEPRINT_LIMITS.EXAM_NAME_MAX),
          examCategory: data.examCategory,
          attemptLabel: truncate(data.attemptLabel || 'Attempt 1', BLUEPRINT_LIMITS.ATTEMPT_LABEL_MAX),
          year: truncate(data.year || '', BLUEPRINT_LIMITS.YEAR_MAX),
          testDate: truncate(data.testDate || '', BLUEPRINT_LIMITS.DATE_MAX),
          fields: data.fields || {},
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [user]
  );

  const updateExamResult = useCallback(
    async (id: string, data: Omit<ExamResult, 'id' | 'uid' | 'createdAt' | 'updatedAt'>) => {
      if (!user) throw new Error('Authentication required.');
      const path = `users/${user.uid}/examResults/${id}`;
      try {
        await updateDoc(doc(db, 'users', user.uid, 'examResults', id), {
          examName: truncate(data.examName, BLUEPRINT_LIMITS.EXAM_NAME_MAX),
          examCategory: data.examCategory,
          attemptLabel: truncate(data.attemptLabel || 'Attempt 1', BLUEPRINT_LIMITS.ATTEMPT_LABEL_MAX),
          year: truncate(data.year || '', BLUEPRINT_LIMITS.YEAR_MAX),
          testDate: truncate(data.testDate || '', BLUEPRINT_LIMITS.DATE_MAX),
          fields: data.fields || {},
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [user]
  );

  const deleteExamResult = useCallback(
    async (id: string) => {
      if (!user) throw new Error('Authentication required.');
      const path = `users/${user.uid}/examResults/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'examResults', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    },
    [user]
  );

  const toggleSaveScholarship = useCallback(
    async (scholarship: Scholarship): Promise<boolean> => {
      if (!user) throw new Error('Authentication required.');
      const safeId = sanitizeId(scholarship.id);
      const path = `users/${user.uid}/savedScholarships/${safeId}`;
      const existing = savedScholarships.find((s) => s.scholarshipId === safeId);
      try {
        if (existing) {
          await deleteDoc(doc(db, 'users', user.uid, 'savedScholarships', safeId));
          return false;
        }
        await setDoc(doc(db, 'users', user.uid, 'savedScholarships', safeId), {
          uid: user.uid,
          scholarshipId: safeId,
          scholarshipName: truncate(scholarship.name, BLUEPRINT_LIMITS.SCHOLARSHIP_NAME_MAX),
          provider: truncate(scholarship.provider, BLUEPRINT_LIMITS.PROVIDER_MAX),
          country: truncate(scholarship.country, BLUEPRINT_LIMITS.COUNTRY_MAX),
          deadline: truncate(scholarship.deadline, BLUEPRINT_LIMITS.DEADLINE_MAX),
          reminderDays: profile?.reminderPreferences?.defaultDaysBefore?.slice(0, 5) || [30, 14, 7],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return true;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    },
    [user, savedScholarships, profile]
  );

  const updateSavedReminderDays = useCallback(
    async (scholarshipId: string, reminderDays: number[]) => {
      if (!user) throw new Error('Authentication required.');
      const safeId = sanitizeId(scholarshipId);
      const path = `users/${user.uid}/savedScholarships/${safeId}`;
      try {
        await updateDoc(doc(db, 'users', user.uid, 'savedScholarships', safeId), {
          reminderDays: reminderDays.slice(0, BLUEPRINT_LIMITS.REMINDER_DAYS_MAX),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [user]
  );

  const upsertApplication = useCallback(
    async (data: Omit<ApplicationRecord, 'uid' | 'createdAt' | 'updatedAt'>) => {
      if (!user) throw new Error('Authentication required.');
      const safeId = sanitizeId(data.id || `app_${data.scholarshipId}`);
      const safeScholarshipId = sanitizeId(data.scholarshipId);
      const path = `users/${user.uid}/applications/${safeId}`;
      const ref = doc(db, 'users', user.uid, 'applications', safeId);

      try {
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, {
            uid: user.uid,
            scholarshipId: safeScholarshipId,
            scholarshipName: truncate(data.scholarshipName, BLUEPRINT_LIMITS.SCHOLARSHIP_NAME_MAX),
            provider: truncate(data.provider, BLUEPRINT_LIMITS.PROVIDER_MAX),
            deadline: truncate(data.deadline, BLUEPRINT_LIMITS.DEADLINE_MAX),
            applicationDate: truncate(data.applicationDate || '', BLUEPRINT_LIMITS.DATE_MAX),
            status: data.status,
            referenceNumber: truncate(data.referenceNumber || '', BLUEPRINT_LIMITS.REFERENCE_MAX),
            notes: truncate(data.notes || '', BLUEPRINT_LIMITS.NOTES_MAX),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(ref, {
            scholarshipName: truncate(data.scholarshipName, BLUEPRINT_LIMITS.SCHOLARSHIP_NAME_MAX),
            provider: truncate(data.provider, BLUEPRINT_LIMITS.PROVIDER_MAX),
            deadline: truncate(data.deadline, BLUEPRINT_LIMITS.DEADLINE_MAX),
            applicationDate: truncate(data.applicationDate || '', BLUEPRINT_LIMITS.DATE_MAX),
            status: data.status,
            referenceNumber: truncate(data.referenceNumber || '', BLUEPRINT_LIMITS.REFERENCE_MAX),
            notes: truncate(data.notes || '', BLUEPRINT_LIMITS.NOTES_MAX),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    },
    [user]
  );

  const deleteApplication = useCallback(
    async (applicationId: string) => {
      if (!user) throw new Error('Authentication required.');
      const path = `users/${user.uid}/applications/${applicationId}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'applications', applicationId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    },
    [user]
  );

  const saveAdminScholarship = useCallback(
    async (scholarship: Scholarship, isNew: boolean) => {
      if (!user || !isAdmin) throw new Error('Admin authorization required.');
      const safeId = sanitizeId(scholarship.id);
      const path = `scholarships/${safeId}`;
      const ref = doc(db, 'scholarships', safeId);

      const payload = {
        id: safeId,
        name: truncate(scholarship.name, BLUEPRINT_LIMITS.SCHOLARSHIP_NAME_MAX),
        provider: truncate(scholarship.provider, BLUEPRINT_LIMITS.PROVIDER_MAX),
        country: truncate(scholarship.country, BLUEPRINT_LIMITS.COUNTRY_MAX),
        state: truncate(scholarship.state || '', BLUEPRINT_LIMITS.STATE_MAX),
        university: truncate(scholarship.university || '', BLUEPRINT_LIMITS.UNIVERSITY_MAX),
        scope: scholarship.scope,
        providerType: scholarship.providerType.slice(0, 80),
        studyLevels: scholarship.studyLevels.slice(0, 12),
        degrees: scholarship.degrees.slice(0, 20),
        fields: scholarship.fields.slice(0, 20),
        fundingType: scholarship.fundingType.slice(0, 80),
        fundingDetails: truncate(scholarship.fundingDetails || '', BLUEPRINT_LIMITS.FUNDING_DETAILS_MAX),
        duration: truncate(scholarship.duration || '', BLUEPRINT_LIMITS.DURATION_MAX),
        deadline: truncate(scholarship.deadline, BLUEPRINT_LIMITS.DEADLINE_MAX),
        deadlineStatus: (scholarship.deadlineStatus || 'Varies by cycle').slice(0, 60),
        eligibility: scholarship.eligibility,
        examRequirement: scholarship.examRequirement,
        requiredDocuments: scholarship.requiredDocuments.slice(0, 30),
        applicationProcedure: scholarship.applicationProcedure.slice(0, 25),
        officialWebsite: truncate(scholarship.officialWebsite, BLUEPRINT_LIMITS.URL_MAX),
        officialPortal: truncate(scholarship.officialPortal, BLUEPRINT_LIMITS.URL_MAX),
        officialSource: scholarship.officialSource.slice(0, 240),
        sourceUrl: truncate(scholarship.sourceUrl || scholarship.officialWebsite, BLUEPRINT_LIMITS.URL_MAX),
        verificationStatus: scholarship.verificationStatus,
        lastVerifiedDate: scholarship.lastVerifiedDate.slice(0, 40),
        updatedBy: user.uid,
      };

      try {
        if (isNew) {
          await setDoc(ref, {
            ...payload,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          const snap = await getDoc(ref);
          if (!snap.exists()) {
            await setDoc(ref, {
              ...payload,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else {
            await updateDoc(ref, {
              ...payload,
              updatedAt: serverTimestamp(),
            });
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    },
    [user, isAdmin]
  );

  const deleteAdminScholarship = useCallback(
    async (scholarshipId: string) => {
      if (!user || !isAdmin) throw new Error('Admin authorization required.');
      const path = `scholarships/${scholarshipId}`;
      try {
        await deleteDoc(doc(db, 'scholarships', scholarshipId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    },
    [user, isAdmin]
  );

  const saveAdminExam = useCallback(
    async (exam: ExamInfo, isNew: boolean) => {
      if (!user || !isAdmin) throw new Error('Admin authorization required.');
      const safeId = sanitizeId(exam.id);
      const path = `exams/${safeId}`;
      const ref = doc(db, 'exams', safeId);

      const payload = {
        id: safeId,
        name: exam.name.slice(0, 160),
        shortName: exam.shortName.slice(0, 40),
        category: exam.category.slice(0, 80),
        countryOrRegion: exam.countryOrRegion.slice(0, 120),
        purpose: exam.purpose.slice(0, 500),
        whoTakesIt: exam.whoTakesIt.slice(0, 400),
        relatedPrograms: exam.relatedPrograms.slice(0, 25),
        officialWebsite: truncate(exam.officialWebsite, BLUEPRINT_LIMITS.URL_MAX),
        requirementsNote: exam.requirementsNote.slice(0, 600),
        verificationStatus: exam.verificationStatus,
        lastVerifiedDate: exam.lastVerifiedDate.slice(0, 40),
      };

      try {
        if (isNew) {
          await setDoc(ref, {
            ...payload,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          const snap = await getDoc(ref);
          if (!snap.exists()) {
            await setDoc(ref, {
              ...payload,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else {
            await updateDoc(ref, {
              ...payload,
              updatedAt: serverTimestamp(),
            });
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    },
    [user, isAdmin]
  );

  const deleteAdminExam = useCallback(
    async (examId: string) => {
      if (!user || !isAdmin) throw new Error('Admin authorization required.');
      const path = `exams/${examId}`;
      try {
        await deleteDoc(doc(db, 'exams', examId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    },
    [user, isAdmin]
  );

  const publishCatalogToFirestore = useCallback(async () => {
    if (!user || !isAdmin) throw new Error('Admin authorization required.');
    try {
      const batch = writeBatch(db);
      for (const s of VERIFIED_SCHOLARSHIPS_CATALOG) {
        batch.set(doc(db, 'scholarships', s.id), {
          ...s,
          updatedBy: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      for (const e of VERIFIED_EXAMS_CATALOG) {
        batch.set(doc(db, 'exams', e.id), {
          ...e,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'scholarships');
    }
  }, [user, isAdmin]);

  const value: AuthContextValue = {
    user,
    authReady,
    profile,
    profileLoading,
    isAdmin,
    adminChecked,
    examResults,
    savedScholarships,
    applications,
    scholarships,
    scholarshipsFromFirestore: firestoreScholarships.length > 0,
    exams,
    catalogLoading: Boolean(user) && (!scholarshipsLoaded || !examsLoaded),
    signInEmail,
    signUpEmail,
    signInGoogle,
    resetPassword,
    logout,
    saveProfile,
    addExamResult,
    updateExamResult,
    deleteExamResult,
    toggleSaveScholarship,
    updateSavedReminderDays,
    upsertApplication,
    deleteApplication,
    saveAdminScholarship,
    deleteAdminScholarship,
    saveAdminExam,
    deleteAdminExam,
    publishCatalogToFirestore,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
