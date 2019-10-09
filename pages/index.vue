<template>
  <b-container>
    <div class="my-5 d-flex flex-column align-items-center">
      <h1>json-translator</h1>
      <h3 class="text-muted">Translate i18n json using google translate</h3>
    </div>

    <b-form-row class="my-2">
      <b-col>
        <b-form-group label="From language">
          <b-form-select v-model="from" :options="languages"></b-form-select>
        </b-form-group>
      </b-col>
      <b-col>
        <b-form-group label="To language">
          <b-form-select v-model="to" :options="languages"></b-form-select>
        </b-form-group>
      </b-col>
    </b-form-row>

    <b-form-textarea class="my-2" v-model="json" placeholder="Paste here your json data" rows="6"></b-form-textarea>

    <b-button pill class="my-2" variant="outline-primary" :disabled="!isValid" @click="translate">
      <template v-if="isTranslating">
        <b-spinner small type="grow"></b-spinner>Translating
      </template>
      <template v-else>Translate</template>
    </b-button>

    <b-form-textarea
      class="my-2"
      readonly
      :value="translatedJson"
      placeholder="JSON translation will appear here"
      rows="6"
    ></b-form-textarea>
  </b-container>
</template>

<script>
export default {
  async asyncData({ $axios }) {
    const { data } = await $axios.get("/languages");
    return { languages: data };
  },

  data() {
    return {
      languages: [],
      json: null,
      translatedJson: null,
      from: null,
      to: null,
      isTranslating: false
    };
  },

  computed: {
    isValid() {
      try {
        return (
          Boolean(this.from) &&
          Boolean(this.to) &&
          Boolean(this.json) &&
          JSON.parse(this.json)
        );
      } catch (error) {
        return false;
      }
    }
  },

  methods: {
    translate() {
      this.translatedJson = null;
      this.isTranslating = true;
      this.$axios
        .post("/translate", {
          from: this.from,
          to: this.to,
          json: JSON.parse(this.json)
        })
        .then(res => {
          this.isTranslating = false;
          this.translatedJson = JSON.stringify(res.data);
        })
        .catch(res => {
          this.isTranslating = false;

          this.$bvToast.toast(res.response, {
            title: `Oops`,
            variant: "danger",
            solid: true
          });
        });
    }
  }
};
</script>