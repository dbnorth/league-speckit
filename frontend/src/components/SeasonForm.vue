<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  modelValue: { type: Object, required: true },
  leagues: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const formRef = ref(null);

const updateField = (field, value) => {
  emit("update:modelValue", { ...props.modelValue, [field]: value });
};

const requiredRule = [(value) => !!value?.toString().trim() || "Required"];
const nameRules = [
  (value) => !!value?.trim() || "Required",
  (value) =>
    (value?.trim() || "").length <= 30 ||
    "Season name must be 30 characters or fewer.",
];
const leagueRules = [(value) => !!value || "Required"];
const endDateRules = computed(() => [
  (value) => !!value || "Required",
  (value) =>
    !props.modelValue.startDate ||
    value > props.modelValue.startDate ||
    "End date must be after start date.",
]);

const validate = () => formRef.value.validate();

defineExpose({ validate });
</script>

<template>
  <v-form ref="formRef" @submit.prevent="emit('submit')">
    <v-text-field
      :model-value="modelValue.name"
      label="Season Name"
      density="comfortable"
      :rules="nameRules"
      @update:model-value="updateField('name', $event)"
    />
    <v-select
      :model-value="modelValue.leagueId"
      label="League"
      :items="leagues"
      item-title="name"
      item-value="id"
      density="comfortable"
      :rules="leagueRules"
      @update:model-value="updateField('leagueId', $event)"
    />
    <v-text-field
      :model-value="modelValue.startDate"
      label="Start Date"
      type="date"
      density="comfortable"
      :rules="requiredRule"
      @update:model-value="updateField('startDate', $event)"
    />
    <v-text-field
      :model-value="modelValue.endDate"
      label="End Date"
      type="date"
      density="comfortable"
      :rules="endDateRules"
      @update:model-value="updateField('endDate', $event)"
    />
  </v-form>
</template>
