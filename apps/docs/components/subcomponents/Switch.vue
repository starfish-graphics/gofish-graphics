<template>
    <label class="container">
        <input v-bind="$attrs" type="checkbox" @change="onChange" :checked="checked" class="input"/>
        <span class="switch"></span>
        <span class="label">{{ currentLabel }}</span>
    </label>
</template>

<script>
import { computed, ref } from 'vue';
export default {
  name: "Switch",
  props: {
    label1: {
      type: String,
      required: true,
    },
    label2: {
      type: String,
      required: true,
    },
    checked: {
      type: Boolean,
      required: true,
    },
  },
  setup(props, { emit }) {
    const currentLabel = ref(props.label1);

    const onChange = event => {
        emit('update:checked', event.target.checked);
        currentLabel.value = event.target.checked ? props.label2 : props.label1;
    }

    return { currentLabel, onChange }
  }
};
</script>

<style scoped>
.container {
  cursor: pointer;
  display: flex;
  align-items: center;
}
.label {
  margin-left: 12px;
  color: #1a202c;
  /* Show an ellipsis if the text takes more than one line */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* Visually hide the checkbox input */
.input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
.switch {
  --switch-container-width: 50px;
  --switch-size: calc(var(--switch-container-width) / 2);
  --light-gray: #0e65c2;
  --gray: #cbd5e0;
  --dark-gray: #a0aec0;
  --teal: #4fd1c5;
  --dark-teal: #319795;

  display: flex;
  align-items: center;
  position: relative;
  height: var(--switch-size);
  flex-basis: var(--switch-container-width);

  border-radius: var(--switch-size);
  background-color: var(--light-gray);

  flex-shrink: 0;
  transition: background-color 0.25s ease-in-out;
}
.switch::before {
  content: "";
  position: absolute;
  /* Move a little bit the inner circle to the right */
  left: 1px;
  height: calc(var(--switch-size) - 4px);
  width: calc(var(--switch-size) - 4px);
  /* Make the inner circle fully rounded */
  border-radius: 9999px;
  background-color: white;
  border: 2px solid var(--light-gray);
  transition: transform 0.375s ease-in-out;
}
.input:checked + .switch {
  background-color: var(--teal);
}
.input:checked + .switch::before {
  border-color: var(--teal);
  /* Move the inner circle to the right */
  transform: translateX(
    calc(var(--switch-container-width) - var(--switch-size))
  );
}
.input:focus + .switch::before {
  border-color: var(--gray);
}
.input:focus:checked + .switch::before {
  border-color: var(--dark-teal);
}
.input:disabled + .switch {
  background-color: var(--gray);
}
.input:disabled + .switch::before {
  background-color: var(--dark-gray);
  border-color: var(--dark-gray);
}
</style>