import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Pencil, MinusCircle, Check, X } from 'lucide-react-native';
import { Header } from '../components/Header';
import { colors, fonts, spacing, fontSize, radius } from '../theme';
import { useAppTheme } from '../context/AppTheme';
import { TaskGroup, TaskLevel, Task, AppUser } from '../types';
import {
  db,
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from '../firebase';

interface EditMenuScreenProps {
  taskGroup: TaskGroup;
  level: TaskLevel;
  onBack: () => void;
  onSaved: () => void;
  user: AppUser | null;
}

const CUSTOM_CATEGORY_PREFIX = 'EX';
const DEFAULT_PREFIX = 'EX*';

export default function EditMenuScreen({
  taskGroup,
  level,
  onBack,
  onSaved,
}: EditMenuScreenProps) {
  const { theme } = useAppTheme();

  // The tier suffix for each task (everything after the original level prefix)
  // e.g. level.prefix="EA1", task_code="EA1E" → tierSuffix="E"
  const tierSuffixes = useMemo(
    () =>
      [...level.tasks]
        .reverse()
        .map((t) => t.task_code.slice(level.prefix.length)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // ── Core state ─────────────────────────────────────────────────────────────
  const [groupName, setGroupName] = useState(taskGroup.name[0] ?? '');
  const [levelPrefix, setLevelPrefix] = useState(DEFAULT_PREFIX);

  // Cloned tasks (reversed so Platinum/highest is first, matching TaskScreen)
  const [tasks, setTasks] = useState<Task[]>(() =>
    [...level.tasks].reverse().map((task) => ({
      ...task,
      task_code: DEFAULT_PREFIX + task.task_code.slice(level.prefix.length),
    }))
  );
  const [removedIndices, setRemovedIndices] = useState<Set<number>>(new Set());

  // ── Inline-edit: group name ────────────────────────────────────────────────
  const [editingGroupName, setEditingGroupName] = useState(false);
  const [groupNameDraft, setGroupNameDraft] = useState(groupName);

  const commitGroupName = () => {
    const val = groupNameDraft.trim();
    if (val) setGroupName(val);
    setEditingGroupName(false);
  };

  // ── Inline-edit: level prefix ──────────────────────────────────────────────
  const [editingLevelPrefix, setEditingLevelPrefix] = useState(false);
  const [levelPrefixDraft, setLevelPrefixDraft] = useState(levelPrefix);

  const commitLevelPrefix = () => {
    const newPrefix = levelPrefixDraft.trim() || DEFAULT_PREFIX;
    setLevelPrefix(newPrefix);
    // Re-generate task codes: newPrefix + original tier suffix
    setTasks((prev) =>
      prev.map((task, i) => ({ ...task, task_code: newPrefix + tierSuffixes[i] }))
    );
    setEditingLevelPrefix(false);
  };

  // ── Task edit modal ────────────────────────────────────────────────────────
  const [editingTaskIdx, setEditingTaskIdx] = useState<number | null>(null);
  const [taskForm, setTaskForm] = useState({
    task_code: '',
    task_name: '',
    price: '',
    service_agreement_price: '',
    estimated_time: '',
    task_description: '',
  });

  const openTaskEdit = (index: number) => {
    const t = tasks[index];
    setTaskForm({
      task_code: t.task_code,
      task_name: t.task_name,
      price: String(t.price),
      service_agreement_price: String(t.service_agreement_price),
      estimated_time: t.estimated_time,
      task_description: t.task_description,
    });
    setEditingTaskIdx(index);
  };

  const saveTaskEdit = () => {
    if (editingTaskIdx === null) return;
    setTasks((prev) =>
      prev.map((t, i) => {
        if (i !== editingTaskIdx) return t;
        return {
          ...t,
          task_code: taskForm.task_code.trim() || t.task_code,
          task_name: taskForm.task_name.trim() || t.task_name,
          price: parseFloat(taskForm.price) || t.price,
          service_agreement_price:
            parseFloat(taskForm.service_agreement_price) ||
            t.service_agreement_price,
          estimated_time: taskForm.estimated_time.trim() || t.estimated_time,
          task_description:
            taskForm.task_description.trim() || t.task_description,
        };
      })
    );
    setEditingTaskIdx(null);
  };

  const removeTask = (index: number) => {
    setRemovedIndices((prev) => new Set([...prev, index]));
  };

  // ── Save to Firestore ──────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);

  const handleSave = async () => {
    const activeTasks = tasks.filter((_, i) => !removedIndices.has(i));
    if (activeTasks.length === 0) {
      Alert.alert('Error', 'At least one task tier is required.');
      return;
    }
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a menu name.');
      return;
    }

    setIsSaving(true);
    try {
      const clonedLevel: TaskLevel = {
        id: Date.now(),
        prefix: levelPrefix,
        level_number: level.level_number,
        custom_level_name: level.custom_level_name,
        tasks: activeTasks,
      };

      const clonedGroup: TaskGroup = {
        name: [groupName.trim()],
        levels: [clonedLevel],
        task_list: taskGroup.task_list,
      };

      // Find the existing "EX - Custom Menus" category by prefix
      const q = query(
        collection(db, 'categories'),
        where('prefix', '==', CUSTOM_CATEGORY_PREFIX)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus(null), 3000);
        return;
      }

      const catDoc = snapshot.docs[0];
      const existingGroups = (catDoc.data().task_groups ?? []) as TaskGroup[];
      await updateDoc(doc(db, 'categories', catDoc.id), {
        task_groups: [...existingGroups, clonedGroup],
        updatedAt: serverTimestamp(),
      });

      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus(null);
        onSaved();
      }, 1500);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const taskRange =
    taskGroup.levels.length > 1
      ? `TASKS ${taskGroup.levels[0].prefix}-${taskGroup.levels[taskGroup.levels.length - 1].prefix}`
      : `TASKS ${taskGroup.levels[0]?.prefix ?? ''}`;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Header onMenuPress={() => {}} onBack={onBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Draft banner */}
        <View style={styles.draftBanner}>
          <Text style={styles.draftText}>Draft: Creating a new Menu Pricing</Text>
        </View>

        {/* Task range + editable group name */}
        <View style={styles.taskInfoHeader}>
          <Text style={styles.taskRange}>{taskRange}</Text>

          {editingGroupName ? (
            <View style={styles.inlineEditRow}>
              <TextInput
                style={styles.inlineInput}
                value={groupNameDraft}
                onChangeText={setGroupNameDraft}
                autoFocus
                multiline
                returnKeyType="done"
                onSubmitEditing={commitGroupName}
              />
              <TouchableOpacity
                onPress={commitGroupName}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Check size={22} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setEditingGroupName(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={22} color={colors.brandBlack + '66'} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.groupNameRow}>
              <Text style={styles.groupName}>{groupName}</Text>
              <TouchableOpacity
                onPress={() => {
                  setGroupNameDraft(groupName);
                  setEditingGroupName(true);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Pencil size={20} color={theme.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Level prefix label */}
        <View style={styles.levelRow}>
          {editingLevelPrefix ? (
            <View style={styles.inlineEditRowCenter}>
              <TextInput
                style={[styles.inlineInput, styles.levelPrefixInput]}
                value={levelPrefixDraft}
                onChangeText={setLevelPrefixDraft}
                autoFocus
                autoCapitalize="characters"
                returnKeyType="done"
                onSubmitEditing={commitLevelPrefix}
              />
              <Text style={styles.levelNumber}> - LEVEL {level.level_number}</Text>
              <TouchableOpacity
                onPress={commitLevelPrefix}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Check size={18} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setEditingLevelPrefix(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={18} color={colors.brandBlack + '66'} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.levelLabel}>
                {levelPrefix} - LEVEL {level.level_number}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setLevelPrefixDraft(levelPrefix);
                  setEditingLevelPrefix(true);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Pencil size={16} color={theme.primary} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Task items */}
        {tasks.map((task, index) => {
          if (removedIndices.has(index)) return null;
          return (
            <View key={index} style={styles.taskItem}>
              {/* Tier header: minus icon + tier name + price */}
              <View style={styles.tierRow}>
                <TouchableOpacity
                  onPress={() => removeTask(index)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MinusCircle size={22} color={colors.brandBlack + '40'} />
                </TouchableOpacity>
                <Text style={styles.tierName}>
                  {task.service_level}{' '}
                  <Text style={[styles.tierPrice, { color: theme.primary }]}>
                    - ${task.price}
                  </Text>
                </Text>
              </View>

              {/* Task code + name + pencil */}
              <View style={styles.taskCodeRow}>
                <Text style={styles.taskCodeName} numberOfLines={3}>
                  {task.task_code} {task.task_name}
                </Text>
                <TouchableOpacity
                  onPress={() => openTaskEdit(index)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.pencilBtn}
                >
                  <Pencil size={18} color={theme.primary} />
                </TouchableOpacity>
              </View>

              {/* Meta line */}
              <Text style={styles.taskMeta}>
                {task.task_code} - {task.estimated_time}h / SA {task.service_agreement_price}
              </Text>

              {/* Description */}
              <View style={styles.descBlock}>
                {task.task_description.split('\n').map((line, i) => (
                  <Text key={i} style={styles.descLine}>
                    {line}
                  </Text>
                ))}
              </View>

              {/* Bottom accent */}
              <View style={[styles.taskAccent, { backgroundColor: theme.primary }]} />
            </View>
          );
        })}
      </ScrollView>

      {/* Success / error banner */}
      {saveStatus === 'success' && (
        <View style={styles.bannerSuccess}>
          <Text style={styles.bannerText}>
            Saved to EX - Custom Menus
          </Text>
        </View>
      )}
      {saveStatus === 'error' && (
        <View style={styles.bannerError}>
          <Text style={styles.bannerText}>
            Save failed — check your connection and try again.
          </Text>
        </View>
      )}

      {/* Save button */}
      <TouchableOpacity
        style={[
          styles.saveBtn,
          { backgroundColor: theme.primary },
          isSaving && styles.saveBtnDisabled,
        ]}
        onPress={handleSave}
        disabled={isSaving}
        activeOpacity={0.85}
      >
        {isSaving ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.saveBtnText}>Save Custom Pricing Menu</Text>
        )}
      </TouchableOpacity>

      {/* ── Task Edit Modal ───────────────────────────────────────────────── */}
      <Modal
        visible={editingTaskIdx !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setEditingTaskIdx(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalCard}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Task</Text>
              <TouchableOpacity
                onPress={() => setEditingTaskIdx(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={22} color={colors.brandBlack} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Task Code</Text>
                <TextInput
                  style={styles.formInput}
                  value={taskForm.task_code}
                  onChangeText={(v) => setTaskForm((p) => ({ ...p, task_code: v }))}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Task Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={taskForm.task_name}
                  onChangeText={(v) => setTaskForm((p) => ({ ...p, task_name: v }))}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formField, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Price ($)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={taskForm.price}
                    onChangeText={(v) => setTaskForm((p) => ({ ...p, price: v }))}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={[styles.formField, { flex: 1 }]}>
                  <Text style={styles.formLabel}>SA Price ($)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={taskForm.service_agreement_price}
                    onChangeText={(v) =>
                      setTaskForm((p) => ({ ...p, service_agreement_price: v }))
                    }
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Estimated Time (hrs)</Text>
                <TextInput
                  style={styles.formInput}
                  value={taskForm.estimated_time}
                  onChangeText={(v) =>
                    setTaskForm((p) => ({ ...p, estimated_time: v }))
                  }
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.formInputMulti]}
                  value={taskForm.task_description}
                  onChangeText={(v) =>
                    setTaskForm((p) => ({ ...p, task_description: v }))
                  }
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalSaveBtn, { backgroundColor: theme.primary }]}
              onPress={saveTaskEdit}
              activeOpacity={0.85}
            >
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },

  // ── Scroll ─────────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing['2xl'] },

  // ── Draft banner ────────────────────────────────────────────────────────────
  draftBanner: {
    backgroundColor: colors.brandPlatinum,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.brandPlatinum,
  },
  draftText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.xs,
    color: colors.brandBlack + '88',
    fontStyle: 'italic',
  },

  // ── Task info header ────────────────────────────────────────────────────────
  taskInfoHeader: {
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.brandPlatinum,
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  taskRange: {
    fontFamily: fonts.sansBlack,
    fontSize: 10,
    color: colors.brandBlack + '66',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  groupNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  groupName: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.xl,
    color: colors.brandBlack,
    flex: 1,
    lineHeight: 28,
  },
  inlineEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inlineInput: {
    flex: 1,
    fontFamily: fonts.sansBold,
    fontSize: fontSize.base,
    color: colors.brandBlack,
    borderWidth: 1,
    borderColor: colors.brandPlatinum,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.white,
  },

  // ── Level row ───────────────────────────────────────────────────────────────
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.brandPlatinum,
    backgroundColor: colors.white,
  },
  levelLabel: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.sm,
    color: colors.brandBlack + '77',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inlineEditRowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    justifyContent: 'center',
  },
  levelPrefixInput: {
    flex: 0,
    minWidth: 80,
    textAlign: 'center',
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  levelNumber: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.sm,
    color: colors.brandBlack + '77',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // ── Task item ───────────────────────────────────────────────────────────────
  taskItem: {
    paddingTop: spacing.base,
    paddingHorizontal: spacing.base,
    paddingBottom: 0,
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tierName: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.md,
    color: colors.brandBlack,
    flex: 1,
  },
  tierPrice: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.md,
  },
  taskCodeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  taskCodeName: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.sm,
    color: colors.brandBlack,
    textTransform: 'uppercase',
    letterSpacing: -0.3,
    flex: 1,
  },
  pencilBtn: {
    paddingTop: 2,
  },
  taskMeta: {
    fontFamily: fonts.sansBlack,
    fontSize: 10,
    color: colors.brandBlack + '55',
    textTransform: 'uppercase',
    letterSpacing: -0.3,
  },
  descBlock: {
    gap: 2,
    paddingBottom: spacing.base,
  },
  descLine: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.brandBlack + '99',
  },
  taskAccent: {
    height: 2,
    marginHorizontal: -spacing.base,
  },

  // ── Status banners ──────────────────────────────────────────────────────────
  bannerSuccess: {
    backgroundColor: '#16a34a',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    alignItems: 'center',
  },
  bannerError: {
    backgroundColor: colors.brandRed,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    alignItems: 'center',
  },
  bannerText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.xs,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // ── Save button ─────────────────────────────────────────────────────────────
  saveBtn: {
    paddingVertical: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.base,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // ── Modal ───────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    maxHeight: '90%',
    paddingTop: spacing.base,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.brandPlatinum,
  },
  modalTitle: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.base,
    color: colors.brandBlack,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalScroll: {
    paddingHorizontal: spacing.base,
  },
  formField: {
    marginTop: spacing.base,
    gap: spacing.xs,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  formLabel: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.xs,
    color: colors.brandBlack + '88',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.brandPlatinum,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontFamily: fonts.sans,
    fontSize: fontSize.base,
    color: colors.brandBlack,
    backgroundColor: colors.white,
  },
  formInputMulti: {
    height: 120,
    paddingTop: spacing.sm,
  },
  modalSaveBtn: {
    margin: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
});
