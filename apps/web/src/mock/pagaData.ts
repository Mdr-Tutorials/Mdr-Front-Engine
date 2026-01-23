import { type MIRDocument } from "../core/types/engine.types";

export const testDoc: MIRDocument = {
    version: "1.0",
    ui: {
        root: {
            id: "root",
            type: "container",
            style: {
                padding: "40px",
                background: "#e4ffb4",
                border: "1px solid #ccc",
                minHeight: "50vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "20px"
            },
            children: [
                {
                    id: "h1",
                    type: "text",
                    text: "MDR 渲染引擎测试",
                    style: {
                        fontSize: "32px",
                        display: "block",
                        marginBottom: "20px"
                    }
                },
                {
                    id: "countDisplay",
                    type: "div",
                    children: [
                        {
                            id: "p",
                            type: "text",
                            text: "当前计数：",
                            style: { fontSize: "20px" }
                        },
                        {
                            id: "countValue",
                            type: "text",
                            text: { "$param": "count" }
                        }
                    ]
                },
                {
                    id: "btn",
                    type: "button",
                    text: { "$param": "buttonText" },
                    props: { className: "my-button" },
                    events: {
                        click: {
                            trigger: "click",
                            action: "onAction"
                        }
                    },
                    style: {
                        padding: "10px 20px",
                        cursor: "pointer"
                    }
                },
                {
                    id: "input_1",
                    type: "input",
                    props: {
                        placeholder: "搜索项目...",
                        maxLength: 20
                    }
                }
            ]
        }
    },
    logic: {
        props: {
            buttonText: { type: "string", default: "Click Me" },
            count: { type: "number", default: 0 },
            onAction: { type: "() => void" }
        }
    }
};
