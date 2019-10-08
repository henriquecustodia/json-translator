<template>
  <div class="container">
    <div>
      <h1 class="title">json-translator</h1>
      <h2 class="subtitle">Web app to translate i18n json to another language using google translate</h2>

      <b-form-textarea v-model="json" placeholder="Paste here your json data" rows="3" max-rows="6"></b-form-textarea>

      <b-button variant="outline-primary" :disabled="!isValid" @click="translate">Translate</b-button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      json: "{ \"name\": \"Meu nome é Henrique\", \"key1\": { \"key2\": { \"key3\": \"Funcionou!\" } } }"
    };
  },

  computed: {
    isValid() {
      try {
        return Boolean(this.json) && JSON.parse(this.json);
      } catch (error) {
        return false;
      }
    }
  },

  methods: {
    translate() {
      this.$axios
        .post("/translate", {
          from: "pt",
          to: "en",
          json: JSON.parse(this.json)
        })
        .then(res => {
          console.log("res", res);
        });
    }
  }
};
</script>