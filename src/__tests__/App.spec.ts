import { describe, expect, it } from "vitest";

import { mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import App from "../App.vue";
import router from "../router";

describe("App", () => {
  it("renders the hike planner route", async () => {
    router.push("/");
    await router.isReady();

    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    expect(wrapper.text()).toContain("Trail weather");
  });
});
