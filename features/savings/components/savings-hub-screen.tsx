import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppInput } from '@/components/ui/app-input';
import { AppScreen } from '@/components/ui/app-screen';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import { useGoovaAppState } from '@/features/app/providers/goova-app-state-provider';
import { HomeToolbar } from '@/features/home/components/home-toolbar';
import { useHomeDashboard } from '@/features/home/hooks/use-home-dashboard';
import { GlobalSearchSheet } from '@/features/search/components/global-search-sheet';
import { parseCurrencyAmount } from '@/lib/currency';
import type { IncomeSortingRule } from '@/types/fintech';

import { IncomeSortingRuleRow } from './income-sorting-rule-row';
import { SavingsGoalPlanCard } from './savings-goal-plan-card';

const frequencyOptions: ('weekly' | 'biweekly' | 'monthly')[] = ['weekly', 'biweekly', 'monthly'];

function toTitleCase(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function SavingsHubScreen() {
  const router = useRouter();
  const { dashboard } = useHomeDashboard();
  const {
    accounts,
    addGoalContribution,
    createSavingsGoal,
    incomeSorting,
    savingsGoals,
    setIncomeSortingEnabled,
    setIncomeSortingMinimumTriggerAmount,
    updateIncomeSortingRule,
  } = useGoovaAppState();
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const availableCurrencies = useMemo(
    () =>
      accounts
        .map((account) => account.currencyCode)
        .filter((currencyCode, index, list) => list.indexOf(currencyCode) === index),
    [accounts]
  );

  const [goalName, setGoalName] = useState('');
  const [goalTargetAmountInput, setGoalTargetAmountInput] = useState('');
  const [goalCurrencyCode, setGoalCurrencyCode] = useState(availableCurrencies[0] || 'NGN');
  const [goalTargetDateInput, setGoalTargetDateInput] = useState('');
  const [goalAutoSaveAmountInput, setGoalAutoSaveAmountInput] = useState('');
  const [goalFrequency, setGoalFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [goalError, setGoalError] = useState<string | null>(null);

  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(savingsGoals[0]?.id || null);
  const [contributionAmountInput, setContributionAmountInput] = useState('');
  const [contributionError, setContributionError] = useState<string | null>(null);

  const [minimumTriggerInput, setMinimumTriggerInput] = useState(
    String(incomeSorting.minimumTriggerAmount || 0)
  );

  const allocationTotal = useMemo(
    () =>
      incomeSorting.rules
        .filter((rule) => rule.enabled)
        .reduce((total, rule) => total + rule.allocationPercentage, 0),
    [incomeSorting.rules]
  );

  const allocationHint =
    allocationTotal === 100
      ? 'Allocation is balanced at 100%.'
      : allocationTotal < 100
        ? `${100 - allocationTotal}% is still unallocated.`
        : `${allocationTotal - 100}% is over-allocated.`;

  const allocationHintColor =
    allocationTotal === 100
      ? Colors.success
      : allocationTotal < 100
        ? Colors.secondary
        : Colors.danger;

  function handleCreateGoal() {
    const parsedTargetAmount = parseCurrencyAmount(goalTargetAmountInput);
    const parsedAutoSaveAmount = parseCurrencyAmount(goalAutoSaveAmountInput);
    const parsedTargetDate = new Date(goalTargetDateInput);

    if (!goalName.trim()) {
      setGoalError('Enter a goal name.');
      return;
    }

    if (parsedTargetAmount <= 0) {
      setGoalError('Target amount must be greater than zero.');
      return;
    }

    if (Number.isNaN(parsedTargetDate.getTime())) {
      setGoalError('Enter a valid target date in YYYY-MM-DD format.');
      return;
    }

    if (parsedTargetDate.getTime() <= Date.now()) {
      setGoalError('Target date must be in the future.');
      return;
    }

    const nextGoal = createSavingsGoal({
      name: goalName,
      currencyCode: goalCurrencyCode,
      targetAmount: parsedTargetAmount,
      targetDate: parsedTargetDate.toISOString(),
      autoSaveAmount: parsedAutoSaveAmount,
      autoSaveFrequency: goalFrequency,
      sourceAccountId: accounts.find((account) => account.currencyCode === goalCurrencyCode)?.id,
    });

    setGoalError(null);
    setGoalName('');
    setGoalTargetAmountInput('');
    setGoalTargetDateInput('');
    setGoalAutoSaveAmountInput('');
    setSelectedGoalId(nextGoal.id);
  }

  function handleSaveToGoal() {
    const parsedAmount = parseCurrencyAmount(contributionAmountInput);

    if (!selectedGoalId) {
      setContributionError('Select a goal to continue.');
      return;
    }

    if (parsedAmount <= 0) {
      setContributionError('Contribution amount must be greater than zero.');
      return;
    }

    const result = addGoalContribution({
      goalId: selectedGoalId,
      amount: parsedAmount,
    });

    if (!result) {
      setContributionError('Unable to save to the selected goal right now.');
      return;
    }

    setContributionError(null);
    setContributionAmountInput('');
  }

  function cycleRuleDestination(
    ruleId: IncomeSortingRule['id'],
    currentDestinationGoalId: string | null
  ) {
    const allDestinationIds = [null, ...savingsGoals.map((goal) => goal.id)];
    const currentIndex = allDestinationIds.findIndex((id) => id === currentDestinationGoalId);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % allDestinationIds.length;

    updateIncomeSortingRule({
      ruleId,
      destinationGoalId: allDestinationIds[nextIndex],
    });
  }

  function applyMinimumTrigger() {
    setIncomeSortingMinimumTriggerAmount(parseCurrencyAmount(minimumTriggerInput));
  }

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <HomeToolbar
        avatarInitials={dashboard?.avatarInitials || 'GCF'}
        onAvatarPress={() => router.push('/profile' as never)}
        onSearchChange={setSearchValue}
        onSearchPress={() => setIsSearchVisible(true)}
        searchPlaceholder=""
        searchValue={searchValue}
      />

      <AppCard style={styles.summaryCard}>
        <View style={styles.summaryBlock}>
          <Text style={styles.summaryValue}>{savingsGoals.length}</Text>
          <Text style={styles.summaryLabel}>Active goals</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryBlock}>
          <Text style={styles.summaryValue}>{allocationTotal}%</Text>
          <Text style={styles.summaryLabel}>Income allocated</Text>
        </View>
      </AppCard>

      <AppCard style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Create a goal with target period</Text>
        <Text style={styles.sectionDescription}>
          Set a target amount, target date, and auto-save cadence.
        </Text>

        <AppInput label="Goal name" onChangeText={setGoalName} placeholder="e.g. MBA tuition fund" value={goalName} />

        <View style={styles.fieldRow}>
          <AppInput
            containerStyle={styles.rowField}
            keyboardType="decimal-pad"
            label="Target amount"
            onChangeText={setGoalTargetAmountInput}
            placeholder="8500000"
            value={goalTargetAmountInput}
          />
          <View style={styles.rowField}>
            <Text style={styles.fieldLabel}>Currency</Text>
            <View style={styles.chipRow}>
              {availableCurrencies.map((currencyCode) => {
                const isActive = currencyCode === goalCurrencyCode;
                return (
                  <Pressable
                    key={currencyCode}
                    onPress={() => setGoalCurrencyCode(currencyCode)}
                    style={[styles.choiceChip, isActive ? styles.choiceChipActive : null]}>
                    <Text style={[styles.choiceChipText, isActive ? styles.choiceChipTextActive : null]}>
                      {currencyCode}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.fieldRow}>
          <AppInput
            containerStyle={styles.rowField}
            keyboardType="numbers-and-punctuation"
            label="Target date"
            onChangeText={setGoalTargetDateInput}
            placeholder="YYYY-MM-DD"
            value={goalTargetDateInput}
          />
          <AppInput
            containerStyle={styles.rowField}
            keyboardType="decimal-pad"
            label="Auto-save amount"
            onChangeText={setGoalAutoSaveAmountInput}
            placeholder="25000"
            value={goalAutoSaveAmountInput}
          />
        </View>

        <View style={styles.frequencyWrap}>
          <Text style={styles.fieldLabel}>Auto-save frequency</Text>
          <View style={styles.chipRow}>
            {frequencyOptions.map((frequency) => {
              const isActive = frequency === goalFrequency;
              return (
                <Pressable
                  key={frequency}
                  onPress={() => setGoalFrequency(frequency)}
                  style={[styles.choiceChip, isActive ? styles.choiceChipActive : null]}>
                  <Text style={[styles.choiceChipText, isActive ? styles.choiceChipTextActive : null]}>
                    {toTitleCase(frequency)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {goalError ? <Text style={styles.errorText}>{goalError}</Text> : null}

        <AppButton onPress={handleCreateGoal} title="Create goal plan" />
      </AppCard>

      <AppCard style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Save towards an existing goal</Text>
        <Text style={styles.sectionDescription}>
          Make manual contributions while automatic rules continue in the background.
        </Text>

        <View style={styles.goalChipsWrap}>
          {savingsGoals.map((goal) => {
            const isActive = goal.id === selectedGoalId;
            return (
              <Pressable
                key={goal.id}
                onPress={() => setSelectedGoalId(goal.id)}
                style={[styles.goalChip, isActive ? styles.goalChipActive : null]}>
                <Text style={[styles.goalChipText, isActive ? styles.goalChipTextActive : null]}>{goal.name}</Text>
              </Pressable>
            );
          })}
        </View>

        <AppInput
          keyboardType="decimal-pad"
          label="Contribution amount"
          onChangeText={setContributionAmountInput}
          placeholder="10000"
          value={contributionAmountInput}
        />

        {contributionError ? <Text style={styles.errorText}>{contributionError}</Text> : null}

        <AppButton
          disabled={!savingsGoals.length}
          onPress={handleSaveToGoal}
          title={savingsGoals.length ? 'Save now' : 'Create a goal first'}
        />
      </AppCard>

      <View style={styles.goalList}>
        {savingsGoals.map((goal) => (
          <SavingsGoalPlanCard key={goal.id} goal={goal} />
        ))}
      </View>

      <AppCard style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Automatic income sorting tool</Text>
        <Text style={styles.sectionDescription}>
          Control how incoming funds are categorized and routed before spending.
        </Text>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Enable automatic sorting</Text>
          <Pressable
            onPress={() => setIncomeSortingEnabled(!incomeSorting.enabled)}
            style={[styles.switchTrack, incomeSorting.enabled ? styles.switchTrackActive : null]}>
            <View style={[styles.switchThumb, incomeSorting.enabled ? styles.switchThumbActive : null]} />
          </Pressable>
        </View>

        <View style={styles.triggerRow}>
          <AppInput
            containerStyle={styles.rowField}
            keyboardType="decimal-pad"
            label="Minimum trigger amount"
            onChangeText={setMinimumTriggerInput}
            placeholder="50"
            value={minimumTriggerInput}
          />
          <AppButton
            containerStyle={styles.triggerButton}
            onPress={applyMinimumTrigger}
            title="Apply"
            variant="secondary"
          />
        </View>

        <Text style={[styles.allocationHint, { color: allocationHintColor }]}>{allocationHint}</Text>

        <View style={styles.ruleList}>
          {incomeSorting.rules.map((rule) => (
            <IncomeSortingRuleRow
              key={rule.id}
              destinationLabel={
                rule.destinationGoalId
                  ? savingsGoals.find((goal) => goal.id === rule.destinationGoalId)?.name || 'Goal destination'
                  : 'Unassigned'
              }
              onCycleDestination={() => cycleRuleDestination(rule.id, rule.destinationGoalId)}
              onDecrease={() =>
                updateIncomeSortingRule({
                  ruleId: rule.id,
                  allocationPercentage: Math.max(0, rule.allocationPercentage - 5),
                })
              }
              onIncrease={() =>
                updateIncomeSortingRule({
                  ruleId: rule.id,
                  allocationPercentage: Math.min(100, rule.allocationPercentage + 5),
                })
              }
              onToggleEnabled={() =>
                updateIncomeSortingRule({
                  ruleId: rule.id,
                  enabled: !rule.enabled,
                })
              }
              rule={rule}
            />
          ))}
        </View>
      </AppCard>

      <GlobalSearchSheet
        onClose={() => {
          setIsSearchVisible(false);
          setSearchValue('');
        }}
        onSearchValueChange={setSearchValue}
        searchValue={searchValue}
        visible={isSearchVisible}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.lg,
  },
  summaryCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  summaryBlock: {
    flex: 1,
    gap: 4,
  },
  summaryValue: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: '700',
  },
  summaryLabel: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  summaryDivider: {
    backgroundColor: Colors.border,
    height: 42,
    width: 1,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  sectionDescription: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  rowField: {
    flex: 1,
  },
  frequencyWrap: {
    gap: 8,
  },
  fieldLabel: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  choiceChip: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  choiceChipActive: {
    backgroundColor: Colors.primarySoft,
    borderColor: 'rgba(31, 168, 154, 0.18)',
  },
  choiceChipText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  choiceChipTextActive: {
    color: Colors.primaryStrong,
  },
  goalChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  goalChip: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  goalChipActive: {
    backgroundColor: Colors.violetSoft,
    borderColor: 'rgba(95, 118, 130, 0.18)',
  },
  goalChipText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  goalChipTextActive: {
    color: Colors.violet,
  },
  goalList: {
    gap: Spacing.md,
  },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  switchTrack: {
    backgroundColor: 'rgba(166, 183, 190, 0.24)',
    borderRadius: Radius.full,
    height: 28,
    justifyContent: 'center',
    paddingHorizontal: 3,
    width: 50,
  },
  switchTrackActive: {
    backgroundColor: 'rgba(43, 182, 115, 0.28)',
  },
  switchThumb: {
    backgroundColor: Colors.textSubtle,
    borderRadius: Radius.full,
    height: 22,
    width: 22,
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.success,
  },
  triggerRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  triggerButton: {
    minHeight: 54,
  },
  allocationHint: {
    fontSize: 12,
    fontWeight: '600',
  },
  ruleList: {
    gap: Spacing.sm,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
});
