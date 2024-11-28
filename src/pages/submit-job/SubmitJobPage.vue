<template>
  <div class="container flex-grow-1 page-body">
    <notification :message="error" />
    <form ref="submitform">
      <div class="d-flex justify-content-end mb-5">
        <button
          v-if="!submitting"
          class="btn btn-secondary"
          type="button"
          id="submit-button"
          :disabled="!valid"
          @click="submit()"
        >
          Submit
        </button>
        <button v-if="submitting" class="btn btn-secondary" type="button" disabled>
          Submitting...
        </button>
      </div>
    </form>
  </div>
</template>
<script setup lang="ts">

import Notification from '@/components/Notification.vue'

import { validateDna } from '@/fasta/validate-fasta'
import { createBaktaJobRequest } from '@/model/bakta-service';
import { ref } from 'vue';

const request = ref(createBaktaJobRequest())

function submitJob() {}

export default {
    parseAndSetSeqquence: function () {
      try {
        const seq = fasta.parse(this.sequence)

        const valid = validateDna(seq)
        if (valid.valid) {
          this.replicons = seq.map(function (x) {
            return {
              id: x.name,
              length: x.seq.length,
              new: '',
              type: 'contig',
              topology: 'l',
              name: '',
            }
          })
          this.loading = false
          this.validSequenceFile = true
          this.error = null
        } else {
          this.loading = false
          this.validSequenceFile = false
          this.error = ['Invalid fasta:', ...valid.messages]
        }
      } catch (e) {
        this.loading = false
        this.validSequenceFile = false
        this.error = 'Invalid fasta file. Please provide a valid fasta.'
      }
    },

    submit: function () {
      const vm = this

      if (this.$refs.submitform.reportValidity()) {
        this.submitting = true
        this.error = null
        this.$bakta
          .submit(this.request)
          .then((x) => {
            console.debug('Job submitted', x)
            vm.submitting = false
            vm.$router.push({ name: 'Jobs' })
          })
          .catch((ex) => {
            console.log('Submission failed', ex)
            vm.submitting = false
            vm.error = ex
          })
      }
    },
  },
  watch: {
    sequenceInput(newValue) {
      if (this.sequenceFile === null || (this.sequenceFile !== null && !this.validSequenceFile)) {
        this.sequence = newValue
      }
    },
    sequence() {
      if (this.sequence !== null) {
        try {
          this.loading = true
          this.loadingProgress.title = 'Parsing file'
          setTimeout(this.parseAndSetSeqquence, 0)
        } catch (e) {
          this.error = "Can't read fasta data"
          this.replicons = []
          this.validSequenceFile = false
        }
      } else {
        this.validSequenceFile = false
        this.error = null
        this.replicons = []
      }
    },

    'options.completeGenome': function () {
      let possibleTopologies = []
      let possibleTypes = []
      let newTopology = null
      let newType = null

      if (this.options.completeGenome) {
        possibleTypes = ['chromosome', 'plasmid']
        possibleTopologies = ['c']
        newTopology = 'c'
        newType = 'chromosome'
      } else {
        possibleTypes = ['contig']
        possibleTopologies = ['l']
        newTopology = 'l'
        newType = 'contig'
      }

      this.replicons
        .filter((x) => !possibleTypes.some((y) => x.type === y))
        .forEach((x) => (x.type = newType))
      this.replicons
        .filter((x) => !possibleTopologies.some((y) => x.topology === y))
        .forEach((x) => (x.topology = newTopology))
    },
  },

    request() {
      return {
        jobname: this.sequenceFile ? this.sequenceFile.name : 'Manually entered sequence(s)',
        sequence: this.sequence,
        prodigal: this.prodigalTrainingFile,
        replicons: this.replicons,
        options: this.options,
      }
    },
</script>
