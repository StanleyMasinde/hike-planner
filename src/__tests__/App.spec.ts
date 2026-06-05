import { describe, expect, it } from "vitest";

import { mount } from "@vue/test-utils";
import App from "../App.vue";
import router from "../router";

describe("App", () => {
  it("renders the hike planner route", async () => {
    router.push("/");
    await router.isReady();

    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toContain("Trail weather");
  });
});
