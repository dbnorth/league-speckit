<script setup>
import { ref } from "vue";
import { isValidEmail } from "../config/validation.js";

const props = defineProps({
  modelValue: { type: Object, required: true },
  users: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const formRef = ref(null);

const genderOptions = ["male", "female", "other"];

const updateField = (field, value) => {
  emit("update:modelValue", { ...props.modelValue, [field]: value });
};

const firstNameRules = [
  (value) => !!value?.trim() || "Required",
  (value) =>
    (value?.trim().length ?? 0) <= 50 ||
    "First name must be 50 characters or fewer.",
];
const lastNameRules = [
  (value) => !!value?.trim() || "Required",
  (value) =>
    (value?.trim().length ?? 0) <= 50 ||
    "Last name must be 50 characters or fewer.",
];
const emailRules = [
  (value) => !!value?.trim() || "Required",
  (value) =>
    (value?.trim().length ?? 0) <= 100 ||
    "Email must be 100 characters or fewer.",
  (value) => isValidEmail(value) || "Email must be a valid email address.",
];
const birthDateRules = [
  (value) => !!value || "Required",
  (value) => {
    const dateOnly = String(value ?? "").slice(0, 10);
    const today = new Date();
    const todayOnly = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");
    return dateOnly < todayOnly || "Birth date must be in the past.";
  },
];
const genderRules = [
  (value) => !!value || "Required",
  (value) =>
    genderOptions.includes(value) || "Gender must be male, female, or other.",
];

const validate = () => formRef.value.validate();

defineExpose({ validate });
</script>

<template>
  <v-form ref="formRef" @submit.prevent="emit('submit')">
    <v-text-field
      :model-value="modelValue.firstName"
      label="First Name"
      density="comfortable"
      :rules="firstNameRules"
      @update:model-value="updateField('firstName', $event)"
    />
    <v-text-field
      :model-value="modelValue.lastName"
      label="Last Name"
      density="comfortable"
      :rules="lastNameRules"
      @update:model-value="updateField('lastName', $event)"
    />
    <v-text-field
      :model-value="modelValue.email"
      label="Email"
      density="comfortable"
      :rules="emailRules"
      @update:model-value="updateField('email', $event)"
    />
    <v-text-field
      :model-value="modelValue.birthDate"
      label="Birth Date"
      type="date"
      density="comfortable"
      :rules="birthDateRules"
      @update:model-value="updateField('birthDate', $event)"
    />
    <v-select
      :model-value="modelValue.gender"
      label="Gender"
      :items="genderOptions"
      density="comfortable"
      :rules="genderRules"
      @update:model-value="updateField('gender', $event)"
    />
    <v-select
      :model-value="modelValue.userId"
      label="User"
      :items="users"
      item-title="username"
      item-value="id"
      clearable
      density="comfortable"
      @update:model-value="updateField('userId', $event)"
    />
  </v-form>
</template>
