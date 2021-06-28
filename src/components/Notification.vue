<template>
  <div v-if="messages !== null" :class="classes" role="alert">
    <template v-for="(m, i) in messages" :key="i"> {{ m }} <br /> </template>
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
      type: [String, Array],
      default: null,
    },
    type: {
      type: String,
      default: "danger",
    },
  },
  computed: {
    messages: function() {
      if (Array.isArray(this.message)) {
        return this.message;
      } else if (this.message) {
        return [this.message];
      } else {
        return null;
      }
    },
    classes: function() {
      return "alert alert-" + this.type;
    },
  },
};
</script>
