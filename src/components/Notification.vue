<template>
  <div v-if="message !== null" :class="classes" role="alert">
    {{ message }}
  </div>
</template>
<script>
/**
 * The notification is only visible when the message is non-null.
 */
export default {
  name: "Notification",
  props: {
    message: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      default: "danger",
    },
  },
  computed: {
    classes: function () {
      return "alert alert-" + this.type;
    },
  },
};
</script>