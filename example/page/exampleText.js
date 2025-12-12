import * as hmUI from "@zos/ui";
import { getText } from "@zos/i18n";

import { reactive, effect } from "@x1a0ma17x/zeppos-reactive";
export class Text {
    constructor(config = {}) {
        this._state = reactive({
            text: config.text || "",
        });
        this.textWidget = hmUI.createWidget(hmUI.widget.TEXT, TEXT_STYLE);
        effect(() => {
            this.textWidget.setProperty(hmUI.prop.TEXT, this._state.text);
        });
    }
    get text() {
        return this._state.text;
    }

    set text(value) {
        this._state.text = value;
    }
}
const TEXT_STYLE = {
    x: 0,
    y: 80,
    w: 480,
    h: 80,
    text: "计数: 0",
    color: 0x00ff00,
    text_size: 36,
    align_h: hmUI.align.CENTER_H,
    align_v: hmUI.align.CENTER_V,
};
