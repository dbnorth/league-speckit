<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  modelValue: { type: Object, required: true },
  people: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const formRef = ref(null);

const personItems = computed(() =>
  props.people.map((person) => ({
    id: person.id,
    title: `${person.lastName}, ${person.firstName}`,
  })),
);

const updateField = (field, value) => {
  emit("update:modelValue", { ...props.modelValue, [field]: value });
};

const personRules = [(value) => !!value || "Required"];
const positionRules = [
  (value) => !!value?.toString().trim() || "Required",
  (value) =>
    (value?.toString().trim().length ?? 0) <= 30 ||
    "Position must be 30 characters or fewer.",
];
const numberRules = [
  (value) =>
    (value !== undefined && value !== null && String(value).trim() !== "") ||
    "Required",
  (value) => {
    const parsed = parseInt(value, 10);
    return (
      (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 99) ||
      "Player number must be between 0 and 99."
    );
  },
];

const validate = () => formRef.value.validate();

defineExpose({ validate });
</script>

<template>
  <v-form ref="formRef" @submit.prevent="emit('submit')">
    <v-select
      :model-value="modelValue.personId"
      label="Person"
      :items="personItems"
      item-title="title"
      item-value="id"
      density="comfortable"
      :rules="personRules"
      @update:model-value="updateField('personId', $event)"
    />
    <v-text-field
      :model-value="modelValue.position"
      label="Position"
      density="comfortable"
      :rules="positionRules"
      @update:model-value="updateField('position', $event)"
    />
    <v-text-field
      :model-value="modelValue.number"
      label="Number"
      type="number"
      density="comfortable"
      :rules="numberRules"
      @update:model-value="updateField('number', $event)"
    />
  </v-form>
</template>
