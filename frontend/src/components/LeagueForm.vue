<script setup>
import { ref } from "vue";

const props = defineProps({
  modelValue: { type: Object, required: true },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const formRef = ref(null);

const sportOptions = ["soccer", "baseball", "volleyball", "football"];

const updateField = (field, value) => {
  emit("update:modelValue", { ...props.modelValue, [field]: value });
};

const nameRules = [
  (value) => !!value?.trim() || "Required",
  (value) =>
    (value?.trim().length ?? 0) <= 50 ||
    "League name must be 50 characters or fewer.",
];
const sportRules = [
  (value) => !!value || "Required",
  (value) =>
    sportOptions.includes(value) ||
    "Sport must be soccer, baseball, volleyball, or football.",
];

const validate = () => formRef.value.validate();

defineExpose({ validate });
</script>

<template>
  <v-form ref="formRef" @submit.prevent="emit('submit')">
    <v-text-field
      :model-value="modelValue.name"
      label="League Name"
      density="comfortable"
      :rules="nameRules"
      @update:model-value="updateField('name', $event)"
    />
    <v-select
      :model-value="modelValue.sport"
      label="Sport"
      :items="sportOptions"
      density="comfortable"
      :rules="sportRules"
      @update:model-value="updateField('sport', $event)"
    />
  </v-form>
</template>
