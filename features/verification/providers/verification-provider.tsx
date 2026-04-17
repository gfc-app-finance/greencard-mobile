import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@supabase/supabase-js';
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  buildVerificationAccess,
  defaultVerificationProfile,
  getRestrictedFeatureCopy,
  hasCompletedProfileDetails,
  isFeatureAllowed,
  resolveVerificationStatus,
} from '@/features/verification/verification-access';
import { useSession } from '@/hooks/use-session';
import * as authService from '@/services/auth-service';
import type {
  RestrictedFeature,
  VerificationAccess,
  VerificationProfile,
  VerificationStatus,
} from '@/types/verification';

type VerifyIdentityInput = {
  bvn: string;
  nin: string;
};

type CompleteProfileInput = {
  dateOfBirth: string;
  address: string;
  nationality: string;
};

type VerificationActionResult = {
  success: boolean;
  message: string;
};

type VerificationContextValue = {
  profile: VerificationProfile;
  access: VerificationAccess;
  isReady: boolean;
  isPromptVisible: boolean;
  promptFeature: RestrictedFeature | null;
  promptCopy: ReturnType<typeof getRestrictedFeatureCopy> | null;
  showVerificationPrompt: (feature: RestrictedFeature) => void;
  hideVerificationPrompt: () => void;
  guardFeatureAction: (
    feature: RestrictedFeature,
    onAllowed: () => void
  ) => boolean;
  completeProfile: (
    input: CompleteProfileInput
  ) => Promise<VerificationActionResult>;
  verifyIdentity: (
    input: VerifyIdentityInput
  ) => Promise<VerificationActionResult>;
};

type VerificationProfileSeed = Partial<VerificationProfile>;

const STORAGE_KEY_PREFIX = 'goova.verification.profile.v3';
const DIGITS_ONLY = /\D+/g;
const ID_NUMBER_LENGTH = 11;

const VerificationContext = createContext<VerificationContextValue | null>(null);

function getSafeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function getSafeBoolean(value: unknown) {
  return value === true;
}

function getLast4(value: string) {
  return value.slice(-4);
}

function isVerificationStatus(value: string): value is VerificationStatus {
  return (
    value === 'basic' ||
    value === 'profile_completed' ||
    value === 'under_review' ||
    value === 'restricted' ||
    value === 'verified'
  );
}

function getStorageKey(userId: string | null | undefined) {
  return userId
    ? `${STORAGE_KEY_PREFIX}.${userId}`
    : `${STORAGE_KEY_PREFIX}.guest`;
}

function parseStoredProfile(rawValue: string | null): VerificationProfileSeed {
  if (!rawValue) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<VerificationProfile>;
    const statusValue = getSafeString(parsed.status);

    return {
      fullName: getSafeString(parsed.fullName),
      email: getSafeString(parsed.email),
      phoneNumber: getSafeString(parsed.phoneNumber),
      dateOfBirth: getSafeString(parsed.dateOfBirth),
      address: getSafeString(parsed.address),
      nationality: getSafeString(parsed.nationality),
      profileCompletedAt: parsed.profileCompletedAt || null,
      bvn: getSafeString(parsed.bvn) || null,
      nin: getSafeString(parsed.nin) || null,
      hasBVN: Boolean(parsed.hasBVN) || Boolean(getSafeString(parsed.bvn)),
      hasNIN: Boolean(parsed.hasNIN) || Boolean(getSafeString(parsed.nin)),
      verificationCompletedAt: parsed.verificationCompletedAt || null,
      bvnLast4:
        parsed.bvnLast4 || (parsed.bvn ? getLast4(getSafeString(parsed.bvn)) : null),
      ninLast4:
        parsed.ninLast4 || (parsed.nin ? getLast4(getSafeString(parsed.nin)) : null),
      status: isVerificationStatus(statusValue) ? statusValue : undefined,
    };
  } catch {
    return {};
  }
}

function getSessionProfileSeed(sessionUser: User | null): VerificationProfileSeed {
  if (!sessionUser) {
    return {};
  }

  const metadata = (sessionUser.user_metadata || {}) as Record<string, unknown>;
  const statusValue = getSafeString(metadata.verification_status);
  const verificationCompletedAt =
    getSafeString(metadata.verification_completed_at) || null;
  const profileCompletedAt = getSafeString(metadata.profile_completed_at) || null;
  const hasBVN =
    getSafeBoolean(metadata.has_bvn) ||
    Boolean(getSafeString(metadata.bvn_last4));
  const hasNIN =
    getSafeBoolean(metadata.has_nin) ||
    Boolean(getSafeString(metadata.nin_last4));
  const hasVerifiedIdentity =
    verificationCompletedAt !== null ||
    statusValue === 'verified' ||
    (hasBVN && hasNIN);

  return {
    fullName: getSafeString(metadata.full_name),
    email: getSafeString(sessionUser.email),
    phoneNumber: getSafeString(metadata.phone_number || metadata.phone),
    dateOfBirth: getSafeString(metadata.date_of_birth),
    address: getSafeString(
      metadata.residential_address || metadata.address
    ),
    nationality: getSafeString(metadata.nationality),
    profileCompletedAt,
    hasBVN: hasVerifiedIdentity || hasBVN,
    hasNIN: hasVerifiedIdentity || hasNIN,
    verificationCompletedAt,
    bvnLast4: getSafeString(metadata.bvn_last4) || null,
    ninLast4: getSafeString(metadata.nin_last4) || null,
    status: isVerificationStatus(statusValue) ? statusValue : undefined,
  };
}

function buildVerificationProfile(
  storedValue: string | null,
  sessionUser: User | null
): VerificationProfile {
  const storedProfile = parseStoredProfile(storedValue);
  const sessionProfile = getSessionProfileSeed(sessionUser);
  const explicitLockedStatus =
    storedProfile.status === 'under_review' ||
    storedProfile.status === 'restricted'
      ? storedProfile.status
      : sessionProfile.status === 'under_review' ||
          sessionProfile.status === 'restricted'
        ? sessionProfile.status
        : null;
  const hasVerifiedIdentity = Boolean(
    storedProfile.verificationCompletedAt ||
      sessionProfile.verificationCompletedAt ||
      storedProfile.status === 'verified' ||
      sessionProfile.status === 'verified'
  );

  const profile: VerificationProfile = {
    ...defaultVerificationProfile,
    fullName: storedProfile.fullName || sessionProfile.fullName || '',
    email: storedProfile.email || sessionProfile.email || '',
    phoneNumber:
      storedProfile.phoneNumber || sessionProfile.phoneNumber || '',
    dateOfBirth:
      storedProfile.dateOfBirth || sessionProfile.dateOfBirth || '',
    address: storedProfile.address || sessionProfile.address || '',
    nationality:
      storedProfile.nationality || sessionProfile.nationality || '',
    profileCompletedAt:
      storedProfile.profileCompletedAt || sessionProfile.profileCompletedAt || null,
    bvn: null,
    nin: null,
    hasBVN:
      hasVerifiedIdentity ||
      Boolean(storedProfile.hasBVN) ||
      Boolean(sessionProfile.hasBVN),
    hasNIN:
      hasVerifiedIdentity ||
      Boolean(storedProfile.hasNIN) ||
      Boolean(sessionProfile.hasNIN),
    verificationCompletedAt:
      storedProfile.verificationCompletedAt ||
      sessionProfile.verificationCompletedAt ||
      null,
    bvnLast4:
      storedProfile.bvnLast4 || sessionProfile.bvnLast4 || null,
    ninLast4:
      storedProfile.ninLast4 || sessionProfile.ninLast4 || null,
    status: 'basic',
  };

  const completedProfile = hasCompletedProfileDetails(profile);
  const status = hasVerifiedIdentity
    ? 'verified'
    : explicitLockedStatus ||
      resolveVerificationStatus(completedProfile, profile.hasBVN, profile.hasNIN);

  return {
    ...profile,
    status,
    hasBVN: status === 'verified' ? true : profile.hasBVN,
    hasNIN: status === 'verified' ? true : profile.hasNIN,
    profileCompletedAt: completedProfile ? profile.profileCompletedAt : null,
    verificationCompletedAt:
      status === 'verified' ? profile.verificationCompletedAt : null,
  };
}

async function syncProfileToAccount(profile: VerificationProfile) {
  try {
    await authService.updateVerificationProfileMetadata(profile);
  } catch {
    // Local persistence remains the source of truth if auth metadata sync is unavailable.
  }
}

export function VerificationProvider({ children }: PropsWithChildren) {
  const { user: sessionUser } = useSession();
  const [profile, setProfile] = useState<VerificationProfile>(
    defaultVerificationProfile
  );
  const [isReady, setIsReady] = useState(false);
  const [promptFeature, setPromptFeature] = useState<RestrictedFeature | null>(
    null
  );

  useEffect(() => {
    let isMounted = true;

    setIsReady(false);

    const loadProfile = async () => {
      try {
        const storedValue = sessionUser?.id
          ? await AsyncStorage.getItem(getStorageKey(sessionUser.id))
          : null;

        if (!isMounted) {
          return;
        }

        setProfile(buildVerificationProfile(storedValue, sessionUser));
      } catch {
        if (isMounted) {
          setProfile(buildVerificationProfile(null, sessionUser));
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [sessionUser]);

  useEffect(() => {
    if (!isReady || !sessionUser?.id) {
      return;
    }

    AsyncStorage.setItem(
      getStorageKey(sessionUser.id),
      JSON.stringify(profile)
    ).catch(() => undefined);
  }, [isReady, profile, sessionUser?.id]);

  const access = useMemo(() => buildVerificationAccess(profile), [profile]);

  const value = useMemo<VerificationContextValue>(
    () => ({
      profile,
      access,
      isReady,
      isPromptVisible: Boolean(promptFeature),
      promptFeature,
      promptCopy: promptFeature ? getRestrictedFeatureCopy(promptFeature) : null,
      showVerificationPrompt(feature) {
        setPromptFeature(feature);
      },
      hideVerificationPrompt() {
        setPromptFeature(null);
      },
      guardFeatureAction(feature, onAllowed) {
        if (isFeatureAllowed(access, feature)) {
          onAllowed();
          return true;
        }

        setPromptFeature(feature);
        return false;
      },
      async completeProfile({ address, dateOfBirth, nationality }) {
        if (profile.status === 'verified') {
          return {
            success: true,
            message: 'Your profile is already complete and fully verified.',
          };
        }

        const normalizedAddress = address.trim();
        const normalizedDateOfBirth = dateOfBirth.trim();
        const normalizedNationality = nationality.trim();

        if (
          !normalizedAddress ||
          !normalizedDateOfBirth ||
          !normalizedNationality
        ) {
          return {
            success: false,
            message: 'Enter date of birth, address, and nationality to continue.',
          };
        }

        const now = new Date().toISOString();
        const nextProfile: VerificationProfile = {
          ...profile,
          dateOfBirth: normalizedDateOfBirth,
          address: normalizedAddress,
          nationality: normalizedNationality,
          profileCompletedAt: profile.profileCompletedAt || now,
          status: resolveVerificationStatus(true, profile.hasBVN, profile.hasNIN),
          verificationCompletedAt: profile.verificationCompletedAt,
        };

        setProfile(nextProfile);
        void syncProfileToAccount(nextProfile);

        return {
          success: true,
          message: 'Profile completed. Continue to identity verification.',
        };
      },
      async verifyIdentity({ bvn, nin }) {
        if (profile.status === 'verified') {
          setPromptFeature(null);

          return {
            success: true,
            message: 'Your identity is already verified. Full access remains unlocked.',
          };
        }

        if (!hasCompletedProfileDetails(profile)) {
          return {
            success: false,
            message:
              'Complete your profile first (date of birth, address, nationality).',
          };
        }

        const bvnDigits = bvn.replace(DIGITS_ONLY, '');
        const ninDigits = nin.replace(DIGITS_ONLY, '');
        const hasValidBVN = bvnDigits.length === ID_NUMBER_LENGTH;
        const hasValidNIN = ninDigits.length === ID_NUMBER_LENGTH;

        if (!hasValidBVN || !hasValidNIN) {
          return {
            success: false,
            message: 'Enter valid 11-digit BVN and NIN to continue.',
          };
        }

        const now = new Date().toISOString();
        const nextProfile: VerificationProfile = {
          ...profile,
          bvn: null,
          nin: null,
          hasBVN: true,
          hasNIN: true,
          bvnLast4: getLast4(bvnDigits),
          ninLast4: getLast4(ninDigits),
          status: 'verified',
          verificationCompletedAt: profile.verificationCompletedAt || now,
        };

        setProfile(nextProfile);
        setPromptFeature(null);
        void syncProfileToAccount(nextProfile);

        return {
          success: true,
          message: 'Identity verification complete. Full access is now unlocked.',
        };
      },
    }),
    [access, isReady, profile, promptFeature]
  );

  return (
    <VerificationContext.Provider value={value}>
      {children}
    </VerificationContext.Provider>
  );
}

export function useVerification() {
  const context = useContext(VerificationContext);

  if (!context) {
    throw new Error('useVerification must be used within VerificationProvider.');
  }

  return context;
}
