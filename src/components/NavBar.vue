<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-white">
    <div class="container-fluid">
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div
        class="collapse navbar-collapse d-flex justify-content-end"
        id="navbarNav"
      >
        <ul class="navbar-nav">
          <template v-for="item in nav" :key="item.label">
            <li class="nav-item">
                <a v-if="item.active" class="nav-link active" :href="item.href">{{ item.label }}</a>
                <a v-else class="nav-link" :href="item.href">{{ item.label }}</a>
            </li>
          </template>
        </ul>
      </div>
    </div>
  </nav>
</template>
<script>
export default {
  name: "NavBar",
  props: {
    active: String,
  },
  data: function() {
      return {
          'navElements': [
              {"label": "Jobs", "href": "#"},
              {"label": "Info", "href": "#"},
              {"label": "Download", "href": "#"},
              {"label": "GitHub", "href": "https://github.com/oschwengers/bakta"},
          ]
      }
  },
  computed: {
      "nav": function() {
          let nav = []
          for (let i of this.navElements) {
              nav.push(
                  {"label": i.label, "href": i.href, "active": i.label === this.active}
              )
          }
          return nav;
      }
  }


};
</script>