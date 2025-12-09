import * as hmUI from "@zos/ui";
import { getText } from "@zos/i18n";

import { reactive,effect } from "@x1a0ma17x/zeppos-reactive";
import { Text } from "./exampleText";

Page({
    build() {
      const state=reactive({
        text:""
      })
      const textWidget = new Text({ text: "测试" });
      effect(() => {
        textWidget.text = state.text
      })
      setInterval(() => {
        state.text = `当前时间: ${Date.now()}`
      }, 1000/30);

    },

    onDestroy() {},
});

